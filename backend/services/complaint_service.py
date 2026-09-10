"""Service layer for managing complaints.

Provides async CRUD operations for complaint records and their
associated AI analysis results, backed by SQLAlchemy.
"""
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.complaint import ComplaintCreate, ComplaintResponse
from models.db_models import ComplaintDB, AnalysisDB
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class ComplaintService:
    """Async service for complaint CRUD and analysis persistence."""

    # ── Complaint CRUD ────────────────────────────────────────────

    @staticmethod
    async def create_complaint(
        db: AsyncSession, complaint_in: ComplaintCreate
    ) -> ComplaintResponse:
        """Create a new complaint record in the database."""
        new_id = str(uuid.uuid4())
        now = datetime.utcnow()

        data = complaint_in.model_dump()

        db_complaint = ComplaintDB(
            id=new_id,
            created_at=now,
            updated_at=now,
            **data,
        )
        db.add(db_complaint)
        await db.commit()
        await db.refresh(db_complaint)

        logger.info(f"Created complaint {new_id}")
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
        db: AsyncSession, complaint_id: str, updates: dict
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

        row.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(row)

        logger.info(f"Updated complaint {complaint_id}")
        return ComplaintResponse(**row.to_dict())

    # ── Analysis persistence ──────────────────────────────────────

    @staticmethod
    async def store_analysis(
        db: AsyncSession, complaint_id: str, analysis: dict
    ) -> None:
        """Persist AI analysis result linked to a complaint."""
        # Check if analysis already exists
        result = await db.execute(
            select(AnalysisDB).where(AnalysisDB.complaint_id == complaint_id)
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing analysis
            for key, value in analysis.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            await db.commit()
        else:
            # Create new analysis
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

        logger.info(f"Stored analysis for complaint {complaint_id}")

    @staticmethod
    async def find_potential_duplicates(
        db: AsyncSession,
        product_name: Optional[str] = None,
        batch_number: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Optional[dict]:
        """Find potential duplicate complaints in database based on batch, product, or description keywords."""
        # 1. Exact batch match (strongest indicator in pharma manufacturing)
        if batch_number and batch_number.strip():
            result = await db.execute(
                select(ComplaintDB).where(ComplaintDB.batch_number == batch_number.strip())
            )
            matches = result.scalars().all()
            if matches:
                matched = matches[0]
                return {
                    "duplicate_score": 0.95,
                    "duplicate_reason": f"Active complaint #{matched.id[:8]} already exists for Batch '{batch_number}'.",
                    "matched_complaint_id": matched.id,
                }

        # 2. Product name + high keyword overlap in description
        if product_name and description:
            result = await db.execute(
                select(ComplaintDB).where(ComplaintDB.product_name.ilike(f"%{product_name.strip()}%"))
            )
            matches = result.scalars().all()
            stop_words = {"the", "a", "an", "is", "in", "of", "and", "to", "was", "for", "with", "this", "that", "at", "by", "on"}
            desc_words = set(description.lower().split()) - stop_words
            for m in matches:
                if m.description:
                    m_words = set(m.description.lower().split()) - stop_words
                    intersection = desc_words.intersection(m_words)
                    overlap_ratio = len(intersection) / max(len(desc_words), 1)
                    if overlap_ratio > 0.4:
                        score = round(min(0.92, 0.5 + overlap_ratio * 0.45), 2)
                        return {
                            "duplicate_score": score,
                            "duplicate_reason": f"High textual similarity ({int(overlap_ratio * 100)}% keyword overlap) with existing complaint #{m.id[:8]} for '{product_name}'.",
                            "matched_complaint_id": m.id,
                        }

        return None

    @staticmethod
    async def get_analysis(db: AsyncSession, complaint_id: str) -> Optional[dict]:
        """Retrieve AI analysis for a complaint."""
        result = await db.execute(
            select(AnalysisDB).where(AnalysisDB.complaint_id == complaint_id)
        )
        row = result.scalar_one_or_none()
        return row.to_dict() if row else None

    @staticmethod
    async def get_complaint_with_analysis(
        db: AsyncSession, complaint_id: str
    ) -> dict:
        """Retrieve complaint along with its AI analysis."""
        # Eagerly load the analysis relationship
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
