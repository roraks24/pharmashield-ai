"""SQLAlchemy ORM models for the complaint management database.

Tables:
    complaints  — Core complaint records.
    analyses    — AI analysis results linked to a complaint (1-to-1).
"""
import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Column, String, Text, Date, DateTime, Integer, Float, Enum as SAEnum,
    ForeignKey, JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


# ── Complaint table ───────────────────────────────────────────────

class ComplaintDB(Base):
    """ORM model for the `complaints` table."""

    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Customer details
    complaint_source: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    customer_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Product & batch identification
    product_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    product_strength_grade: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    batch_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    manufacturing_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    quantity_affected: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Complaint details
    complaint_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    complaint_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Assessment & classification
    severity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    priority: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Draft")

    # Audit timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationship to analysis
    analysis: Mapped[Optional["AnalysisDB"]] = relationship(
        "AnalysisDB", back_populates="complaint", uselist=False, cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        """Convert to plain dict for API serialisation."""
        return {
            "id": self.id,
            "complaint_source": self.complaint_source,
            "customer_name": self.customer_name,
            "customer_contact": self.customer_contact,
            "product_name": self.product_name,
            "product_strength_grade": self.product_strength_grade,
            "batch_number": self.batch_number,
            "manufacturing_date": str(self.manufacturing_date) if self.manufacturing_date else None,
            "expiry_date": str(self.expiry_date) if self.expiry_date else None,
            "quantity_affected": self.quantity_affected,
            "complaint_type": self.complaint_type,
            "complaint_date": str(self.complaint_date) if self.complaint_date else None,
            "description": self.description,
            "severity": self.severity,
            "priority": self.priority,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# ── Analysis table ────────────────────────────────────────────────

class AnalysisDB(Base):
    """ORM model for the `analyses` table.

    Stores AI analysis results linked 1-to-1 with a complaint record.
    List/dict fields are stored as JSON for flexibility.
    """

    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    complaint_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )

    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completeness_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    missing_fields: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    risk_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_next_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    root_cause_hypotheses: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    capa_recommendations: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    duplicate_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    duplicate_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Back-reference to complaint
    complaint: Mapped["ComplaintDB"] = relationship(
        "ComplaintDB", back_populates="analysis"
    )

    def to_dict(self) -> dict:
        """Convert to plain dict for API serialisation."""
        return {
            "complaint_id": self.complaint_id,
            "summary": self.summary,
            "completeness_score": self.completeness_score,
            "missing_fields": self.missing_fields,
            "risk_level": self.risk_level,
            "risk_reason": self.risk_reason,
            "recommended_next_action": self.recommended_next_action,
            "root_cause_hypotheses": self.root_cause_hypotheses,
            "capa_recommendations": self.capa_recommendations,
            "duplicate_score": self.duplicate_score,
            "duplicate_reason": self.duplicate_reason,
            "confidence": self.confidence,
        }
