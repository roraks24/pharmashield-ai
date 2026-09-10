"""Routes for complaint management.

Provides CRUD endpoints for complaint records, including
creation, listing, detail retrieval (with AI analysis), and
status updates. All endpoints receive a database session via
FastAPI's dependency injection.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from models import ComplaintCreate, ComplaintResponse, StatusEnum, AnalysisResult
from services.complaint_service import ComplaintService
from database import get_db

router = APIRouter()


class ComplaintCreateWithAnalysis(BaseModel):
    """Request body for saving a complaint along with its analysis."""
    complaint: ComplaintCreate
    analysis: Optional[dict] = None


class ComplaintDetailResponse(BaseModel):
    """Complaint detail including linked AI analysis."""
    complaint: dict
    analysis: Optional[dict] = None


@router.post("", response_model=ComplaintResponse, status_code=201)
async def create_complaint(
    payload: ComplaintCreateWithAnalysis,
    db: AsyncSession = Depends(get_db),
):
    """Create a new complaint and optionally persist its AI analysis."""
    complaint = await ComplaintService.create_complaint(db, payload.complaint)

    if payload.analysis:
        await ComplaintService.store_analysis(db, str(complaint.id), payload.analysis)

    return complaint


@router.get("", response_model=List[ComplaintResponse])
async def list_complaints(db: AsyncSession = Depends(get_db)):
    """List all complaints, most recent first."""
    return await ComplaintService.get_complaints(db)


@router.get("/{complaint_id}")
async def get_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get complaint detail with linked AI analysis."""
    return await ComplaintService.get_complaint_with_analysis(db, complaint_id)


@router.patch("/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    status: StatusEnum,
    db: AsyncSession = Depends(get_db),
):
    """Update the status of a complaint."""
    return await ComplaintService.update_complaint(
        db, complaint_id, {"status": status.value}
    )
