"""
eSKala — Pydantic v2 Schemas
All request/response models matching frontend TypeScript interfaces in types.ts.
"""

from __future__ import annotations
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from models import UserRole, ProjectStatus, OrderType, CommentType


# ─── SHARED ───────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str


# ─── AUTH / USERS ─────────────────────────────────────────────────────────────

class UserLogin(BaseModel):
    credential: str = Field(..., description="Email or username")
    password: str
    rememberMe: bool = False


class UserRegister(BaseModel):
    userName: str = Field(..., min_length=2, max_length=100)
    userEmail: EmailStr
    password: str = Field(..., min_length=8)
    userLocation: str = Field(..., description="Santa Rosa City Barangay")
    userIsStaRosa: bool = True


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
    userName: Optional[str] = None
    userLocation: Optional[str] = None
    userIsStaRosa: Optional[bool] = None
    userIsActive: Optional[bool] = None
    userSKTermStart: Optional[date] = None
    userSKTermEnd: Optional[date] = None
    userProfilePicture: Optional[str] = None


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
    projectDescription: Optional[str] = None
    projectStartTime: datetime
    projectEndTime: datetime
    projectLocation: str = Field(..., description="Barangay")
    projectBudget: Optional[float] = Field(None, ge=0)
    projectCategory: Optional[str] = None


class ProjectUpdate(BaseModel):
    projectName: Optional[str] = None
    projectDescription: Optional[str] = None
    projectStartTime: Optional[datetime] = None
    projectEndTime: Optional[datetime] = None
    projectBudget: Optional[float] = None
    projectCategory: Optional[str] = None
    projectProgress: Optional[int] = Field(None, ge=0, le=100)


class ProjectBreakdownUpdate(BaseModel):
    projectBreakdown: float = Field(..., ge=0, description="Total financial breakdown filled by Treasurer")


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
    projectStartTime: datetime
    projectEndTime: datetime
    projectLocation: str
    projectCreatedBy: Optional[int] = None
    projectBreakdown: Optional[float] = None
    projectBudget: Optional[float] = None
    projectProgress: int
    projectCategory: Optional[str] = None
    projectStatus: ProjectStatus
    isDeleted: bool
    createdAt: datetime
    updatedAt: datetime
    purchase_orders: List[PurchaseOrderSummary] = []

    model_config = {"from_attributes": True}


# ─── PURCHASE ORDERS ──────────────────────────────────────────────────────────

class PurchaseOrderCreate(BaseModel):
    projectID: int
    orderName: str = Field(..., min_length=2, max_length=255)
    orderType: OrderType = OrderType.PHYSICAL
    orderQty: float = Field(..., gt=0)
    orderPrice: float = Field(..., ge=0)


class PurchaseOrderUpdate(BaseModel):
    orderName: Optional[str] = None
    orderType: Optional[OrderType] = None
    orderQty: Optional[float] = Field(None, gt=0)
    orderPrice: Optional[float] = Field(None, ge=0)
    isManuallyOverridden: Optional[bool] = None
    ocrExtractedAmount: Optional[float] = None


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
    commentDetails: str = Field(..., min_length=1)
    commentType: CommentType = CommentType.COMMENT
    parentCommentID: Optional[int] = None


class CommentResponse(BaseModel):
    commentID: int
    commentFor: int
    parentCommentID: Optional[int] = None
    authorID: int
    commentName: str
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
    summary: Optional[str] = None
    fullContent: Optional[str] = None
    category: str = "City News"
    projectLocation: Optional[str] = None
    imageURL: Optional[str] = None


class NewsletterUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    fullContent: Optional[str] = None
    category: Optional[str] = None
    imageURL: Optional[str] = None
    isPublished: Optional[bool] = None


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
