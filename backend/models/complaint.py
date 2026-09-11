from pydantic import BaseModel, Field, ConfigDict, model_validator, field_validator
from typing import Optional
from datetime import date, datetime, timezone
from enum import Enum
import uuid

class ComplaintSourceEnum(str, Enum):
    EMAIL = "Email"
    PORTAL = "Portal"
    PHONE = "Phone"
    DOCUMENT = "Document"
    OTHER = "Other"

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
    """Base fields for a complaint with pharma QA validation."""
    complaint_source: ComplaintSourceEnum = Field(
        default=ComplaintSourceEnum.EMAIL,
        description="Source of the complaint report"
    )
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
    description: str = Field(..., min_length=1, description="The main text description of the complaint")
    severity: Optional[SeverityEnum] = None
    priority: Optional[PriorityEnum] = None
    status: StatusEnum = Field(default=StatusEnum.DRAFT)

    @field_validator("complaint_source", mode="before")
    @classmethod
    def normalize_complaint_source(cls, v):
        if isinstance(v, str) and v.strip():
            for item in ComplaintSourceEnum:
                if item.value.lower() == v.strip().lower():
                    return item
        return v

    @field_validator("severity", mode="before")
    @classmethod
    def normalize_severity(cls, v):
        if isinstance(v, str) and v.strip():
            for item in SeverityEnum:
                if item.value.lower() == v.strip().lower():
                    return item
        return v

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, v):
        if isinstance(v, str) and v.strip():
            for item in PriorityEnum:
                if item.value.lower() == v.strip().lower():
                    return item
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "ComplaintBase":
        """Verify that expiry date does not precede manufacturing date."""
        if self.manufacturing_date and self.expiry_date:
            if self.expiry_date < self.manufacturing_date:
                raise ValueError("expiry_date cannot precede manufacturing_date")
        return self

class ComplaintCreate(ComplaintBase):
    """Model used for creating a new complaint."""
    pass

class ComplaintResponse(ComplaintBase):
    """Model representing a created complaint."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)

