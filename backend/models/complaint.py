"""Pydantic models for Complaint."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum
import uuid

class SeverityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class PriorityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class StatusEnum(str, Enum):
    DRAFT = "Draft"
    OPEN = "Open"
    UNDER_REVIEW = "Under Review"
    CLOSED = "Closed"

class ComplaintBase(BaseModel):
    """Base fields for a complaint."""
    complaint_source: str = Field(..., description="Email, portal, phone, document, other")
    customer_name: Optional[str] = None
    customer_contact: Optional[str] = None
    product_name: Optional[str] = None
    product_strength_grade: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    quantity_affected: Optional[str] = None
    complaint_type: Optional[str] = None
    complaint_date: Optional[date] = None
    description: str = Field(..., description="The main text description of the complaint")
    severity: Optional[SeverityEnum] = None
    priority: Optional[PriorityEnum] = None
    status: StatusEnum = Field(default=StatusEnum.DRAFT)

class ComplaintCreate(ComplaintBase):
    """Model used for creating a new complaint."""
    pass

class ComplaintResponse(ComplaintBase):
    """Model representing a created complaint."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
