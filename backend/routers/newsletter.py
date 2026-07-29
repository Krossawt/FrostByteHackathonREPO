"""
eSKala — Newsletter Router
GET    /api/v1/newsletter          (public)
GET    /api/v1/newsletter/{id}     (public)
POST   /api/v1/newsletter          (Super Admin)
PATCH  /api/v1/newsletter/{id}     (Super Admin)
DELETE /api/v1/newsletter/{id}     (Super Admin — soft delete)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import User, Newsletter
from schemas import NewsletterCreate, NewsletterUpdate, NewsletterResponse, MessageResponse
from auth import require_superadmin, get_optional_user, log_action

router = APIRouter(prefix="/api/v1/newsletter", tags=["Newsletter"])


from sqlalchemy import or_


@router.get("", response_model=List[NewsletterResponse], summary="List newsletter entries (public)")
def list_newsletters(
    location: Optional[str] = Query(None, description="Filter by barangay"),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    # Auto-seed initial city news entries if newsletter table is empty
    total_count = db.query(Newsletter).filter(Newsletter.isDeleted == False).count()
    if total_count == 0:
        default_items = [
            Newsletter(
                title="CYDO Santa Rosa Youth Leadership Summit 2025 Successfully Launched",
                summary="Over 400 youth leaders across all 18 barangays gathered at the Santa Rosa Multi-Purpose Complex for the annual CYDO Leadership Summit.",
                fullContent="The City Youth Development Office (CYDO) of Santa Rosa City, Laguna, in partnership with the Sangguniang Kabataan Federation, successfully hosted the annual Youth Leadership Summit 2025.",
                category="Youth Programs",
                projectLocation="Santa Rosa City",
                imageURL="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&q=80",
                isPublished=True,
                isDeleted=False,
            ),
            Newsletter(
                title="eSKala Financial Transparency Portal Officially Deployed for All 18 Barangays",
                summary="The City Youth Development Office and SK Federation introduce eSKala, enabling Santa Rosa citizens to track SK fund utilization, ABYIP budgets, and project receipts in real-time.",
                fullContent="In compliance with Republic Act No. 10742 (SK Reform Act of 2015) and DILG Full Disclosure policies, Santa Rosa City launches eSKala.",
                category="Transparency",
                projectLocation="Santa Rosa City",
                imageURL="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&q=80",
                isPublished=True,
                isDeleted=False,
            ),
            Newsletter(
                title="Santa Rosa SK Federation Approves Enhanced Sports & Digital Literacy Programs",
                summary="Targeting youth development across education, health, and sports for FY 2025 under RA 10742 and RA 11768 guidelines.",
                fullContent="The SK Federation of Santa Rosa City passed landmark resolutions authorizing sports tournament sponsorships and digital literacy workshops.",
                category="SK Update",
                projectLocation="Santa Rosa City",
                imageURL="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80",
                isPublished=True,
                isDeleted=False,
            ),
        ]
        db.add_all(default_items)
        db.commit()

    query = db.query(Newsletter).filter(
        Newsletter.isDeleted == False,
        or_(Newsletter.isPublished == True, Newsletter.isPublished.is_(None)),
    )

    if location:
        query = query.filter(Newsletter.projectLocation == location)
    if category:
        query = query.filter(Newsletter.category == category)
    if search:
        query = query.filter(Newsletter.title.ilike(f"%{search}%"))

    items = query.order_by(Newsletter.publishedAt.desc()).offset(skip).limit(limit).all()
    return [NewsletterResponse.model_validate(n) for n in items]


@router.get("/{newsletter_id}", response_model=NewsletterResponse, summary="Get newsletter detail (public)")
def get_newsletter(
    newsletter_id: int,
    db: Session = Depends(get_db),
):
    item = db.query(Newsletter).filter(
        Newsletter.newsletterID == newsletter_id,
        Newsletter.isDeleted == False,
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Newsletter not found")
    return NewsletterResponse.model_validate(item)


import os
import uuid
from fastapi import UploadFile, File

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "static/uploads")


MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB limit


def validate_and_get_image_ext(content: bytes) -> str:
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowed limit of 5MB",
        )
    if content.startswith(b"\xFF\xD8\xFF"):
        return "jpg"
    elif content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    elif len(content) >= 12 and content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return "webp"
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid image format. Only authentic JPG, PNG, or WEBP image files are allowed.",
        )


@router.post("/upload-image", summary="Upload news display image (JPG, PNG, WEBP)")
async def upload_news_image(
    file: UploadFile = File(..., description="News image file"),
    current_user: User = Depends(require_superadmin),
):
    content = await file.read()
    ext = validate_and_get_image_ext(content)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"news_{uuid.uuid4().hex[:12]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    image_url = f"/static/uploads/{filename}"
    return {"imageURL": image_url}


@router.post("", response_model=NewsletterResponse, status_code=status.HTTP_201_CREATED,
             summary="Super Admin: Create a manual newsletter entry")
def create_newsletter(
    payload: NewsletterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    item = Newsletter(
        title=payload.title,
        summary=payload.summary,
        fullContent=payload.fullContent,
        category=payload.category,
        projectLocation=payload.projectLocation,
        imageURL=payload.imageURL,
        authorID=current_user.userID,
        isPublished=True,
        isDeleted=False,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    log_action(db, current_user, "Newsletter Created", "newsletter", str(item.newsletterID),
               f"Super Admin created newsletter: '{payload.title}'")

    return NewsletterResponse.model_validate(item)


@router.patch("/{newsletter_id}", response_model=NewsletterResponse,
              summary="Super Admin: Update newsletter entry")
def update_newsletter(
    newsletter_id: int,
    payload: NewsletterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    item = db.query(Newsletter).filter(
        Newsletter.newsletterID == newsletter_id,
        Newsletter.isDeleted == False,
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Newsletter not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    item.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(item)

    log_action(db, current_user, "Newsletter Updated", "newsletter", str(newsletter_id),
               f"Updated newsletter: '{item.title}'")

    return NewsletterResponse.model_validate(item)


@router.delete("/{newsletter_id}", response_model=MessageResponse,
               summary="Super Admin: Soft-delete (archive) newsletter entry")
def delete_newsletter(
    newsletter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    item = db.query(Newsletter).filter(
        Newsletter.newsletterID == newsletter_id,
        Newsletter.isDeleted == False,
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Newsletter not found")

    item.isDeleted = True
    item.isPublished = False
    item.updatedAt = datetime.utcnow()
    db.commit()

    log_action(db, current_user, "Newsletter Archived", "newsletter", str(newsletter_id),
               f"Archived newsletter: '{item.title}'")

    return {"message": f"Newsletter '{item.title}' has been archived"}
