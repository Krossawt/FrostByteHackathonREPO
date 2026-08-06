"""
eSKala — Pydantic v2 Schemas
All request/response models matching frontend TypeScript interfaces in types.ts.
"""

from __future__ import annotations
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from models import UserRole, ProjectStatus, OrderType, CommentType


import re
import html

def sanitize_str(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    # Strip HTML/script tags
    clean = re.sub(r'<[^>]*>', '', str(v))
    clean = html.unescape(clean).strip()
    return clean


# ─── SHARED ───────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str


# ─── AUTH / USERS ─────────────────────────────────────────────────────────────

class UserLogin(BaseModel):
    credential: str = Field(..., min_length=1, max_length=254, description="Email or username")
    password: str = Field(..., min_length=1, max_length=128)
    rememberMe: bool = False

    @field_validator("credential", mode="before")
    @classmethod
    def clean_credential(cls, v: str) -> str:
        return sanitize_str(v) or ""


class SendOtpRequest(BaseModel):
    email: EmailStr
    userName: Optional[str] = None


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class UserRegister(BaseModel):
    userName: str = Field(..., min_length=2, max_length=100)
    userEmail: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    userLocation: str = Field(..., min_length=2, max_length=100, description="Santa Rosa City Barangay")
    userIsStaRosa: bool = True
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit email verification OTP")

    @field_validator("userName", "userLocation", mode="before")
    @classmethod
    def clean_user_fields(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)


class AdminCreateUser(BaseModel):
    userName: str = Field(..., min_length=2, max_length=100)
    userEmail: EmailStr
    password: str = Field(..., min_length=8)
    userRole: UserRole
    userLocation: str
    userIsStaRosa: bool = True
    userIsSK: bool = False
    userSKTermStart: Optional[date] = None
    userSKTermEnd: Optional[date] = None


class UserUpdate(BaseModel):
    userName: Optional[str] = Field(None, min_length=2, max_length=100)
    userEmail: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)
    userRole: Optional[UserRole] = None
    userLocation: Optional[str] = Field(None, min_length=2, max_length=100)
    userIsStaRosa: Optional[bool] = None
    userIsActive: Optional[bool] = None
    userSKTermStart: Optional[date] = None
    userSKTermEnd: Optional[date] = None
    userProfilePicture: Optional[str] = None

    @field_validator("userName", "userLocation", mode="before")
    @classmethod
    def clean_user_update_fields(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)


class UserResponse(BaseModel):
    userID: int
    userName: str
    userEmail: str
    userIsStaRosa: bool
    userLocation: str
    userDateCreated: Optional[datetime] = None
    userUpdatedAt: Optional[datetime] = None
    userProfilePicture: Optional[str] = None
    userRole: UserRole
    userIsSK: bool
    userSKTermStart: Optional[date] = None
    userSKTermEnd: Optional[date] = None
    userIsActive: bool
    userIsDeleted: bool
    lastLogin: Optional[datetime] = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    accessToken: str
    tokenType: str = "Bearer"
    expiresIn: int
    user: UserResponse


# ─── PROJECTS ─────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    projectName: str = Field(..., min_length=3, max_length=255)
    projectDescription: Optional[str] = Field(None, max_length=5000)
    projectStartTime: datetime
    projectEndTime: datetime
    projectLocation: str = Field(..., min_length=2, max_length=100, description="Barangay")
    projectBudget: Optional[float] = Field(None, ge=0, le=1_000_000_000)
    projectCategory: Optional[str] = Field(None, max_length=100)

    @field_validator("projectName", "projectDescription", "projectLocation", "projectCategory", mode="before")
    @classmethod
    def clean_project_fields(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)


class ProjectUpdate(BaseModel):
    projectName: Optional[str] = Field(None, min_length=3, max_length=255)
    projectDescription: Optional[str] = Field(None, max_length=5000)
    projectStartTime: Optional[datetime] = None
    projectEndTime: Optional[datetime] = None
    projectBudget: Optional[float] = Field(None, ge=0, le=1_000_000_000)
    projectCategory: Optional[str] = Field(None, max_length=100)
    projectProgress: Optional[int] = Field(None, ge=0, le=100)
    projectStatus: Optional[ProjectStatus] = None  # Chairperson/Secretary can set: Incoming, In Progress, Completed
    projectLocation: Optional[str] = Field(None, min_length=2, max_length=100)

    @field_validator("projectName", "projectDescription", "projectCategory", "projectLocation", mode="before")
    @classmethod
    def clean_project_update_fields(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)


class ProjectBreakdownUpdate(BaseModel):
    projectBreakdown: float = Field(..., ge=0, le=1_000_000_000, description="Total financial breakdown filled by Treasurer")


class PurchaseOrderSummary(BaseModel):
    orderID: str
    orderName: str
    orderType: OrderType
    orderQty: float
    orderPrice: float
    orderTotalPrice: Optional[float] = None
    isApproved: Optional[bool] = None

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    projectID: int
    projectName: str
    projectDescription: Optional[str] = None
    projectStartTime: Optional[datetime] = None
    projectEndTime: Optional[datetime] = None
    projectLocation: str
    projectCreatedBy: Optional[int] = None
    projectBreakdown: Optional[float] = None
    projectBudget: Optional[float] = None
    projectProgress: Optional[int] = 0
    projectCategory: Optional[str] = None
    projectStatus: ProjectStatus
    isDeleted: bool
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    purchase_orders: List[PurchaseOrderSummary] = []

    model_config = {"from_attributes": True}


# ─── PURCHASE ORDERS ──────────────────────────────────────────────────────────

class PurchaseOrderCreate(BaseModel):
    projectID: int
    orderName: str = Field(..., min_length=2, max_length=255)
    orderType: OrderType = OrderType.PHYSICAL
    orderQty: float = Field(..., gt=0, le=1_000_000)
    orderPrice: float = Field(..., ge=0, le=1_000_000_000)

    @field_validator("orderName", mode="before")
    @classmethod
    def clean_po_fields(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)


class PurchaseOrderUpdate(BaseModel):
    orderName: Optional[str] = Field(None, min_length=2, max_length=255)
    orderType: Optional[OrderType] = None
    orderQty: Optional[float] = Field(None, gt=0, le=1_000_000)
    orderPrice: Optional[float] = Field(None, ge=0, le=1_000_000_000)
    isManuallyOverridden: Optional[bool] = None
    ocrExtractedAmount: Optional[float] = Field(None, ge=0, le=1_000_000_000)

    @field_validator("orderName", mode="before")
    @classmethod
    def clean_po_update_fields(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)


class PurchaseOrderResponse(BaseModel):
    orderID: str
    projectID: int
    orderName: str
    orderType: OrderType
    orderQty: float
    orderPrice: float
    orderTotalPrice: Optional[float] = None
    receiptImageURL: Optional[str] = None
    ocrExtractedAmount: Optional[float] = None
    isOCRScanned: bool
    isManuallyOverridden: bool
    isApproved: Optional[bool] = None
    createdAt: datetime

    model_config = {"from_attributes": True}


class OCRReceiptResult(BaseModel):
    orderID: str
    ocrExtractedAmount: float
    isOCRScanned: bool = True
    receiptImageURL: str
    message: str


# ─── COMMENTS ─────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    commentDetails: str = Field(..., min_length=1, max_length=2000)
    commentType: CommentType = CommentType.COMMENT
    parentCommentID: Optional[int] = None

    @field_validator("commentDetails", mode="before")
    @classmethod
    def clean_comment_fields(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)


class CommentResponse(BaseModel):
    hasVoted: bool = False
    commentID: int
    commentFor: int
    parentCommentID: Optional[int] = None
    authorID: int
    commentName: str
    authorRole: Optional[str] = None
    commentDetails: str
    commentType: CommentType
    votesCount: int
    commentTimestamp: datetime
    replies: List["CommentResponse"] = []

    model_config = {"from_attributes": True}


CommentResponse.model_rebuild()


# ─── NEWSLETTER ───────────────────────────────────────────────────────────────

class NewsletterCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    summary: Optional[str] = Field(None, max_length=2000)
    fullContent: Optional[str] = Field(None, max_length=10000)
    category: str = Field("City News", max_length=100)
    projectLocation: Optional[str] = Field(None, max_length=100)
    imageURL: Optional[str] = Field(None, max_length=500)

    @field_validator("title", "summary", "fullContent", "category", "projectLocation", mode="before")
    @classmethod
    def clean_news_fields(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)


class NewsletterUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    summary: Optional[str] = Field(None, max_length=2000)
    fullContent: Optional[str] = Field(None, max_length=10000)
    category: Optional[str] = Field(None, max_length=100)
    imageURL: Optional[str] = Field(None, max_length=500)
    isPublished: Optional[bool] = None

    @field_validator("title", "summary", "fullContent", "category", mode="before")
    @classmethod
    def clean_news_update_fields(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)


class NewsletterResponse(BaseModel):
    newsletterID: int
    projectID: Optional[int] = None
    title: str
    summary: Optional[str] = None
    fullContent: Optional[str] = None
    imageURL: Optional[str] = None
    category: str
    projectLocation: Optional[str] = None
    projectBreakdown: Optional[float] = None
    authorID: Optional[int] = None
    isPublished: bool
    isDeleted: bool
    publishedAt: datetime
    createdAt: datetime

    model_config = {"from_attributes": True}


# ─── ANNUAL BUDGET REPORTS ────────────────────────────────────────────────────

class BudgetReportCreate(BaseModel):
    budgetBarangay: str
    budgetYear: int
    budgetValue: float = Field(..., ge=0)
    budgetFileURL: Optional[str] = None


class BudgetReportResponse(BaseModel):
    budgetID: int
    budgetBarangay: str
    budgetUploadedBy: Optional[int] = None
    budgetYear: int
    budgetValue: float
    budgetFileURL: Optional[str] = None
    budgetUploadedOn: datetime
    isOCRScanned: bool
    isManuallyOverridden: bool

    model_config = {"from_attributes": True}


class BudgetReportOverride(BaseModel):
    budgetBarangay: Optional[str] = None
    budgetYear: Optional[int] = None
    budgetValue: Optional[float] = None


# ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    logID: int
    actorID: Optional[int] = None
    actorName: str
    actorRole: Optional[str] = None
    barangay: Optional[str] = None
    actionType: str
    targetModule: str
    targetID: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


# ─── REPORTS / DASHBOARD ──────────────────────────────────────────────────────

class BarangaySummary(BaseModel):
    barangay: str
    annualBudget: float
    spent: float
    remaining: float
    projectCount: int
    ongoingCount: int
    completedCount: int


class CityConsolidatedReport(BaseModel):
    totalBudget: float
    totalSpent: float
    totalRemaining: float
    totalProjects: int
    ongoingProjects: int
    completedProjects: int
    upcomingProjects: int
    skOfficialsCount: int
    barangays: List[BarangaySummary]


# ─── SUGGESTIONS ──────────────────────────────────────────────────────────────

class SuggestionReplyCreate(BaseModel):
    replyText: str = Field(..., min_length=1, max_length=2000)

    @field_validator("replyText", mode="before")
    @classmethod
    def clean_reply_fields(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)


class SuggestionReplyResponse(BaseModel):
    replyID: int
    suggestionID: int
    authorID: int
    authorName: str
    authorRole: str
    replyText: str
    createdAt: datetime

    model_config = {"from_attributes": True}


class SuggestionCreate(BaseModel):
    category: str = Field("General Suggestion", max_length=100)
    suggestionText: str = Field(..., min_length=1, max_length=2000)

    @field_validator("category", "suggestionText", mode="before")
    @classmethod
    def clean_suggestion_fields(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)


class SuggestionAcknowledger(BaseModel):
    userID: int
    userName: str
    userRole: Optional[str] = None

    model_config = {"from_attributes": True}


class SuggestionResponse(BaseModel):
    suggestionID: int
    barangay: str
    authorID: int
    authorName: str
    category: str
    suggestionText: str
    votesCount: int
    createdAt: datetime
    replies: List[SuggestionReplyResponse] = []
    hasVoted: bool = False
    acknowledgements: List[SuggestionAcknowledger] = []

    model_config = {"from_attributes": True}

