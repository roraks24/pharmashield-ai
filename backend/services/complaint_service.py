"""Service layer for managing complaints and executing AI intake pipelines.

Provides async CRUD operations for complaint records, atomic analysis persistence,
and centralized LangGraph intake execution backed by SQLAlchemy.
"""
from typing import List, Optional, Dict, Any, Tuple
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import ComplaintCreate, ComplaintResponse, ComplaintDB, AnalysisDB, AnalysisResult
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

# Constants for pharma QA duplicate matching
EXACT_BATCH_MATCH_SCORE = 0.95
KEYWORD_OVERLAP_THRESHOLD = 0.4
FROZEN_STOP_WORDS = frozenset(
    {"the", "a", "an", "is", "in", "of", "and", "to", "was", "for", "with", "this", "that", "at", "by", "on"}
)


class ComplaintService:
    """Async service for complaint CRUD, atomic persistence, and pipeline execution."""

    # ── Complaint CRUD ────────────────────────────────────────────

    @staticmethod
    async def create_complaint(
        db: AsyncSession,
        complaint_in: ComplaintCreate,
        analysis_in: Optional[Dict[str, Any]] = None,
    ) -> ComplaintResponse:
        """Create a new complaint record and optionally persist its analysis atomically in one transaction."""
        new_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        data = complaint_in.model_dump()
        # Convert Enum instances to raw string values for DB mapping
        if hasattr(data.get("complaint_source"), "value"):
            data["complaint_source"] = data["complaint_source"].value
        if hasattr(data.get("severity"), "value"):
            data["severity"] = data["severity"].value
        if hasattr(data.get("priority"), "value"):
            data["priority"] = data["priority"].value
        if hasattr(data.get("status"), "value"):
            data["status"] = data["status"].value

        db_complaint = ComplaintDB(
            id=new_id,
            created_at=now,
            updated_at=now,
            **data,
        )
        db.add(db_complaint)

        if analysis_in:
            db_analysis = AnalysisDB(
                id=str(uuid.uuid4()),
                complaint_id=new_id,
                summary=analysis_in.get("summary"),
                completeness_score=analysis_in.get("completeness_score"),
                missing_fields=analysis_in.get("missing_fields"),
                risk_level=analysis_in.get("risk_level"),
                risk_reason=analysis_in.get("risk_reason"),
                recommended_next_action=analysis_in.get("recommended_next_action"),
                root_cause_hypotheses=analysis_in.get("root_cause_hypotheses"),
                capa_recommendations=analysis_in.get("capa_recommendations"),
                duplicate_score=analysis_in.get("duplicate_score"),
                duplicate_reason=analysis_in.get("duplicate_reason"),
                confidence=analysis_in.get("confidence"),
            )
            db.add(db_analysis)

        await db.commit()
        await db.refresh(db_complaint)

        logger.info("Created complaint %s with atomic analysis persistence=%s", new_id, bool(analysis_in))
        return ComplaintResponse(**db_complaint.to_dict())

    @staticmethod
    async def get_complaints(db: AsyncSession) -> List[ComplaintResponse]:
        """Retrieve all complaints, most recent first."""
        result = await db.execute(
            select(ComplaintDB).order_by(desc(ComplaintDB.created_at))
        )
        rows = result.scalars().all()
        return [ComplaintResponse(**row.to_dict()) for row in rows]

    @staticmethod
    async def get_complaint(db: AsyncSession, complaint_id: str) -> ComplaintResponse:
        """Retrieve a specific complaint by ID."""
        result = await db.execute(
            select(ComplaintDB).where(ComplaintDB.id == complaint_id)
        )
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Complaint not found")
        return ComplaintResponse(**row.to_dict())

    @staticmethod
    async def update_complaint(
        db: AsyncSession, complaint_id: str, updates: Dict[str, Any]
    ) -> ComplaintResponse:
        """Update specific fields of a complaint."""
        result = await db.execute(
            select(ComplaintDB).where(ComplaintDB.id == complaint_id)
        )
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Complaint not found")

        for key, value in updates.items():
            if hasattr(row, key):
                setattr(row, key, value)

        row.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(row)

        logger.info("Updated complaint %s", complaint_id)
        return ComplaintResponse(**row.to_dict())

    # ── Analysis persistence ──────────────────────────────────────

    @staticmethod
    async def store_analysis(
        db: AsyncSession, complaint_id: str, analysis: Dict[str, Any]
    ) -> None:
        """Persist or update an AI analysis result linked to a complaint."""
        result = await db.execute(
            select(AnalysisDB).where(AnalysisDB.complaint_id == complaint_id)
        )
        existing = result.scalar_one_or_none()

        if existing:
            for key, value in analysis.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            await db.commit()
        else:
            db_analysis = AnalysisDB(
                id=str(uuid.uuid4()),
                complaint_id=complaint_id,
                summary=analysis.get("summary"),
                completeness_score=analysis.get("completeness_score"),
                missing_fields=analysis.get("missing_fields"),
                risk_level=analysis.get("risk_level"),
                risk_reason=analysis.get("risk_reason"),
                recommended_next_action=analysis.get("recommended_next_action"),
                root_cause_hypotheses=analysis.get("root_cause_hypotheses"),
                capa_recommendations=analysis.get("capa_recommendations"),
                duplicate_score=analysis.get("duplicate_score"),
                duplicate_reason=analysis.get("duplicate_reason"),
                confidence=analysis.get("confidence"),
            )
            db.add(db_analysis)
            await db.commit()

        logger.info("Stored analysis for complaint %s", complaint_id)

    # ── Duplicate detection (Pharma QA GMP heuristic) ──────────────

    @staticmethod
    async def find_potential_duplicates(
        db: AsyncSession,
        product_name: Optional[str] = None,
        batch_number: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Find potential duplicate complaints based on batch identity or product keyword overlap."""
        # 1. Exact batch match (strongest indicator in pharma manufacturing)
        if batch_number and batch_number.strip():
            result = await db.execute(
                select(ComplaintDB).where(ComplaintDB.batch_number == batch_number.strip())
            )
            matches = result.scalars().all()
            if matches:
                matched = matches[0]
                return {
                    "duplicate_score": EXACT_BATCH_MATCH_SCORE,
                    "duplicate_reason": f"Active complaint #{matched.id[:8]} already exists for Batch '{batch_number.strip()}'.",
                    "matched_complaint_id": matched.id,
                }

        # 2. Product name + high keyword overlap in description
        if product_name and description:
            result = await db.execute(
                select(ComplaintDB).where(ComplaintDB.product_name.ilike(f"%{product_name.strip()}%"))
            )
            matches = result.scalars().all()
            desc_words = set(description.lower().split()) - FROZEN_STOP_WORDS
            for m in matches:
                if m.description:
                    m_words = set(m.description.lower().split()) - FROZEN_STOP_WORDS
                    intersection = desc_words.intersection(m_words)
                    overlap_ratio = len(intersection) / max(len(desc_words), 1)
                    if overlap_ratio > KEYWORD_OVERLAP_THRESHOLD:
                        score = round(min(0.92, 0.5 + overlap_ratio * 0.45), 2)
                        return {
                            "duplicate_score": score,
                            "duplicate_reason": f"High textual similarity ({int(overlap_ratio * 100)}% keyword overlap) with existing complaint #{m.id[:8]} for '{product_name}'.",
                            "matched_complaint_id": m.id,
                        }

        return None

    @staticmethod
    async def get_complaint_with_analysis(
        db: AsyncSession, complaint_id: str
    ) -> Dict[str, Any]:
        """Retrieve complaint along with its linked AI analysis."""
        result = await db.execute(
            select(ComplaintDB)
            .options(selectinload(ComplaintDB.analysis))
            .where(ComplaintDB.id == complaint_id)
        )
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Complaint not found")

        return {
            "complaint": row.to_dict(),
            "analysis": row.analysis.to_dict() if row.analysis else None,
        }

    # ── Shared AI Intake Pipeline ─────────────────────────────────

    @classmethod
    async def execute_intake_pipeline(
        cls, db: AsyncSession, raw_text: str
    ) -> Tuple[Dict[str, Any], AnalysisResult]:
        """Execute the LangGraph 5-node intake pipeline, run duplicate matching, and build AnalysisResult.

        Consolidates intake logic shared across `/analyze` and conversational `LOG_COMPLAINT`.
        """
        from graph.workflow import graph

        initial_state = {"raw_text": raw_text, "errors": []}
        result = graph.invoke(initial_state)

        if result.get("errors"):
            logger.warning("Intake graph completed with non-fatal errors: %s", result["errors"])

        extracted_data = result.get("validated_complaint") or result.get("extracted_complaint") or {}
        risk_data = result.get("risk_assessment", {})
        completeness_data = result.get("completeness_result", {})
        summary_text = result.get("summary")

        # Synchronize risk assessment severity and priority into extracted complaint data
        risk_level = risk_data.get("risk_level") or "MEDIUM"
        severity_val = risk_data.get("severity") or risk_level
        priority_val = risk_data.get("priority") or (
            "URGENT" if risk_level == "CRITICAL"
            else "HIGH" if risk_level == "HIGH"
            else "MEDIUM" if risk_level == "MEDIUM"
            else "LOW"
        )

        if not extracted_data.get("severity"):
            extracted_data["severity"] = severity_val
        if not extracted_data.get("priority"):
            extracted_data["priority"] = priority_val

        # Pharma duplicate check against database
        dup_info = await cls.find_potential_duplicates(
            db,
            product_name=extracted_data.get("product_name"),
            batch_number=extracted_data.get("batch_number"),
            description=extracted_data.get("description"),
        )
        dup_score = dup_info.get("duplicate_score") if dup_info else 0.0
        dup_reason = dup_info.get("duplicate_reason") if dup_info else None

        analysis = AnalysisResult(
            summary=summary_text,
            completeness_score=completeness_data.get("score"),
            missing_fields=completeness_data.get("missing_fields"),
            risk_level=risk_level,
            priority=priority_val,
            risk_reason=risk_data.get("risk_reason"),
            recommended_next_action=risk_data.get("recommended_next_action"),
            root_cause_hypotheses=risk_data.get("root_cause_hypotheses"),
            capa_recommendations=risk_data.get("capa_recommendations"),
            duplicate_score=dup_score,
            duplicate_reason=dup_reason,
        )

        return extracted_data, analysis

