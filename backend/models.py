"""
eSKala — SQLAlchemy ORM Models
All 8 database tables matching the meeting specification ERD.
"""

import enum
from datetime import datetime, date
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum, ForeignKey,
    Integer, Numeric, String, Text, func
)
from sqlalchemy.orm import relationship
from database import Base


# ─── ENUM DEFINITIONS ─────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    SUPER_ADMIN  = "Super Admin"
    CHAIRPERSON  = "SK Chairperson"
    SECRETARY    = "SK Secretary"
    TREASURER    = "SK Treasurer"
    KAGAWAD      = "SK Kagawad"
    GUEST        = "Guest"
    SYSTEM       = "System"


class ProjectStatus(str, enum.Enum):
    INCOMING       = "Incoming"
    IN_PROGRESS    = "In Progress"
    COMPLETED      = "Completed"
    # Legacy fallbacks for database backward compatibility
    DRAFTED        = "Drafted"
    FINANCE_UPDATE = "Finance Update"
    FOR_APPROVAL   = "For Approval"
    POSTED         = "Posted"


class OrderType(str, enum.Enum):
    PHYSICAL = "Physical"
    SERVICE  = "Service"


class CommentType(str, enum.Enum):
    COMMENT    = "comment"
    SUGGESTION = "suggestion"


# ─── TABLE: USERS ─────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    userID              = Column(Integer, primary_key=True, index=True, autoincrement=True)
    userName            = Column(String(100), nullable=False)
    userEmail           = Column(String(150), unique=True, nullable=False, index=True)
    userHashedPassword  = Column(String(255), nullable=False)
    userIsStaRosa       = Column(Boolean, default=True)
    userLocation        = Column(String(100), nullable=False)   # Barangay
    userDateCreated     = Column(DateTime, default=func.now())
    userUpdatedAt       = Column(DateTime, default=func.now(), onupdate=func.now())
    userProfilePicture  = Column(String(500), default="profile_picture.png")
    userRole            = Column(Enum(UserRole, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=UserRole.GUEST)
    userIsSK            = Column(Boolean, default=False)
    userSKTermStart     = Column(Date, nullable=True)
    userSKTermEnd       = Column(Date, nullable=True)
    userIsActive        = Column(Boolean, default=True)
    userIsDeleted       = Column(Boolean, default=False)
    lastLogin           = Column(DateTime, nullable=True)
    deletedAt           = Column(DateTime, nullable=True)  # ADD THIS LINE

    # Relationships
    projects            = relationship("Project", back_populates="creator", foreign_keys="Project.projectCreatedBy")
    comments            = relationship("Comment", back_populates="author")
    budget_reports      = relationship("AnnualBudgetReport", back_populates="uploader")
    audit_logs          = relationship("AuditLog", back_populates="actor")


# ─── TABLE: PROJECTS ──────────────────────────────────────────────────────────

class Project(Base):
    __tablename__ = "projects"

    projectID           = Column(Integer, primary_key=True, index=True, autoincrement=True)
    projectName         = Column(String(255), nullable=False)
    projectDescription  = Column(Text, nullable=True)
    projectStartTime    = Column(DateTime, nullable=False)
    projectEndTime      = Column(DateTime, nullable=False)
    projectLocation     = Column(String(100), nullable=False)   # Barangay
    projectCreatedBy    = Column(Integer, ForeignKey("users.userID", ondelete="SET NULL"), nullable=True)
    projectBreakdown    = Column(Numeric(12, 2), nullable=True)  # Filled by Treasurer
    projectBudget       = Column(Numeric(12, 2), nullable=True)  # Proposed budget from proposal
    projectProgress     = Column(Integer, default=0)             # 0-100%
    projectCategory     = Column(String(100), nullable=True)     # e.g. Health, Education
    projectStatus       = Column(String(100), nullable=False, default="Incoming")
    isDeleted           = Column(Boolean, default=False)
    createdAt           = Column(DateTime, default=func.now())
    updatedAt           = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    creator             = relationship("User", back_populates="projects", foreign_keys=[projectCreatedBy])
    attachments         = relationship("Attachment", back_populates="project", cascade="all, delete-orphan")
    purchase_orders     = relationship("PurchaseOrder", back_populates="project", cascade="all, delete-orphan")
    comments            = relationship("Comment", back_populates="project", cascade="all, delete-orphan")
    newsletter          = relationship("Newsletter", back_populates="project", uselist=False)


# ─── TABLE: PURCHASE_ORDERS ───────────────────────────────────────────────────

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    orderID             = Column(String(100), primary_key=True, index=True)
    projectID           = Column(Integer, ForeignKey("projects.projectID", ondelete="CASCADE"), nullable=False)
    orderName           = Column(String(255), nullable=False)
    orderType           = Column(Enum(OrderType, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=OrderType.PHYSICAL)
    orderQty            = Column(Numeric(10, 2), nullable=False, default=1.0)
    orderPrice          = Column(Numeric(12, 2), nullable=False, default=0.00)
    orderTotalPrice     = Column(Numeric(12, 2), nullable=True)  # Computed: qty × price
    receiptImageURL     = Column(String(500), nullable=True)
    ocrExtractedAmount  = Column(Numeric(12, 2), nullable=True)
    isOCRScanned        = Column(Boolean, default=False)
    isManuallyOverridden= Column(Boolean, default=False)
    isApproved          = Column(Boolean, nullable=True)         # None=pending, True=approved, False=rejected
    approvedBy          = Column(Integer, ForeignKey("users.userID", ondelete="SET NULL"), nullable=True)
    createdAt           = Column(DateTime, default=func.now())
    updatedAt           = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    project             = relationship("Project", back_populates="purchase_orders")
    attachments         = relationship("Attachment", back_populates="purchase_order")


# ─── TABLE: ATTACHMENTS ───────────────────────────────────────────────────────

class Attachment(Base):
    __tablename__ = "attachments"

    attachfile_ID       = Column(Integer, primary_key=True, index=True, autoincrement=True)
    attachfile_for      = Column(Integer, ForeignKey("projects.projectID", ondelete="CASCADE"), nullable=False)
    attachFileLink      = Column(String(500), nullable=False)
    attachFileName      = Column(String(255), nullable=True)
    attachFileType      = Column(String(50), nullable=True)       # e.g. "proposal", "receipt", "budget"
    hasOrderID          = Column(Boolean, default=False)
    orderID             = Column(String(100), ForeignKey("purchase_orders.orderID", ondelete="SET NULL"), nullable=True)
    createdAt           = Column(DateTime, default=func.now())

    # Relationships
    project             = relationship("Project", back_populates="attachments")
    purchase_order      = relationship("PurchaseOrder", back_populates="attachments")


# ─── TABLE: COMMENTS ──────────────────────────────────────────────────────────

class Comment(Base):
    __tablename__ = "comments"

    commentID           = Column(Integer, primary_key=True, index=True, autoincrement=True)
    commentFor          = Column(Integer, ForeignKey("projects.projectID", ondelete="CASCADE"), nullable=False)
    parentCommentID     = Column(Integer, ForeignKey("comments.commentID", ondelete="CASCADE"), nullable=True)
    authorID            = Column(Integer, ForeignKey("users.userID", ondelete="CASCADE"), nullable=False)
    commentName         = Column(String(150), nullable=False)      # Author display name
    commentDetails      = Column(Text, nullable=False)
    commentType         = Column(Enum(CommentType, values_callable=lambda obj: [e.value for e in obj]), default=CommentType.COMMENT)
    votesCount          = Column(Integer, default=0)
    commentTimestamp    = Column(DateTime, default=func.now())

    # Relationships
    project             = relationship("Project", back_populates="comments")
    author              = relationship("User", back_populates="comments")
    replies             = relationship("Comment", backref="parent", remote_side="Comment.commentID",
                                       foreign_keys=[parentCommentID])


# ─── TABLE: NEWSLETTER ────────────────────────────────────────────────────────

class Newsletter(Base):
    """
    Auto-populated by the system when a project's status becomes 'Posted'.
    Super Admin can also create standalone newsletter entries.
    """
    __tablename__ = "newsletter"

    newsletterID        = Column(Integer, primary_key=True, index=True, autoincrement=True)
    projectID           = Column(Integer, ForeignKey("projects.projectID", ondelete="CASCADE"), nullable=True)
    title               = Column(String(255), nullable=False)
    summary             = Column(Text, nullable=True)
    fullContent         = Column(Text, nullable=True)
    imageURL            = Column(String(500), nullable=True)
    category            = Column(String(80), default="City News")
    projectLocation     = Column(String(100), nullable=True)        # Barangay
    projectBreakdown    = Column(Numeric(12, 2), nullable=True)
    authorID            = Column(Integer, ForeignKey("users.userID", ondelete="SET NULL"), nullable=True)
    isPublished         = Column(Boolean, default=True)
    isDeleted           = Column(Boolean, default=False)
    publishedAt         = Column(DateTime, default=func.now())
    createdAt           = Column(DateTime, default=func.now())
    updatedAt           = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    project             = relationship("Project", back_populates="newsletter")


# ─── TABLE: ANNUAL BUDGET REPORTS ─────────────────────────────────────────────

class AnnualBudgetReport(Base):
    __tablename__ = "annual_budget_reports"

    budgetID            = Column(Integer, primary_key=True, index=True, autoincrement=True)
    budgetBarangay      = Column(String(100), nullable=False)
    budgetUploadedBy    = Column(Integer, ForeignKey("users.userID", ondelete="SET NULL"), nullable=True)
    budgetYear          = Column(Integer, nullable=False)
    budgetValue         = Column(Numeric(12, 2), nullable=False, default=0.00)
    budgetFileURL       = Column(String(500), nullable=True)
    budgetUploadedOn    = Column(DateTime, default=func.now())
    isOCRScanned        = Column(Boolean, default=False)
    isManuallyOverridden= Column(Boolean, default=False)

    # Relationships
    uploader            = relationship("User", back_populates="budget_reports")


# ─── TABLE: AUDIT LOGS ────────────────────────────────────────────────────────

class AuditLog(Base):
    """
    Immutable system audit trail. Records are only inserted, never updated or deleted.
    """
    __tablename__ = "audit_logs"

    logID               = Column(Integer, primary_key=True, index=True, autoincrement=True)
    actorID             = Column(Integer, ForeignKey("users.userID", ondelete="SET NULL"), nullable=True)
    actorName           = Column(String(150), nullable=False)
    actorRole           = Column(String(80), nullable=True)
    barangay            = Column(String(100), nullable=True)
    actionType          = Column(String(150), nullable=False)       # e.g. "Project Created", "Receipt Uploaded"
    targetModule        = Column(String(100), nullable=False)       # e.g. "projects", "accounts"
    targetID            = Column(String(50), nullable=True)         # ID of affected record
    details             = Column(Text, nullable=True)
    timestamp           = Column(DateTime, default=func.now(), index=True)

    # Relationships
    actor               = relationship("User", back_populates="audit_logs")


# ─── TABLE: SUGGESTIONS ───────────────────────────────────────────────────────

class Suggestion(Base):
    """
    Standalone citizen suggestions — independent of any project.
    Citizens post these; SK officials read and view them for their barangay.
    """
    __tablename__ = "suggestions"

    suggestionID        = Column(Integer, primary_key=True, index=True, autoincrement=True)
    barangay            = Column(String(100), nullable=False, index=True)   # Barangay this suggestion is for
    authorID            = Column(Integer, ForeignKey("users.userID", ondelete="CASCADE"), nullable=False)
    authorName          = Column(String(150), nullable=False)               # Display name at time of posting
    category            = Column(String(100), nullable=False, default="General Suggestion")
    suggestionText      = Column(Text, nullable=False)
    votesCount          = Column(Integer, default=0)
    createdAt           = Column(DateTime, default=func.now(), index=True)

    # Relationships
    author              = relationship("User")
    replies             = relationship("SuggestionReply", back_populates="suggestion", cascade="all, delete-orphan", order_by="SuggestionReply.createdAt.asc()")


# ─── TABLE: SUGGESTION REPLIES ─────────────────────────────────────────────

class SuggestionReply(Base):
    __tablename__ = "suggestion_replies"

    replyID             = Column(Integer, primary_key=True, index=True, autoincrement=True)
    suggestionID        = Column(Integer, ForeignKey("suggestions.suggestionID", ondelete="CASCADE"), nullable=False, index=True)
    authorID            = Column(Integer, ForeignKey("users.userID", ondelete="CASCADE"), nullable=False)
    authorName          = Column(String(150), nullable=False)
    authorRole          = Column(String(100), nullable=False)
    replyText           = Column(Text, nullable=False)
    createdAt           = Column(DateTime, default=func.now())

    # Relationships
    suggestion          = relationship("Suggestion", back_populates="replies")
    author              = relationship("User")


# ─── TABLE: SUGGESTION VOTES ───────────────────────────────────────────────

class SuggestionVote(Base):
    __tablename__ = "suggestion_votes"

    voteID              = Column(Integer, primary_key=True, index=True, autoincrement=True)
    suggestionID        = Column(Integer, ForeignKey("suggestions.suggestionID", ondelete="CASCADE"), nullable=False, index=True)
    userID              = Column(Integer, ForeignKey("users.userID", ondelete="CASCADE"), nullable=False, index=True)
    createdAt           = Column(DateTime, default=func.now())

