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
    query = db.query(Newsletter).filter(
        Newsletter.isDeleted == False,
        Newsletter.isPublished == True,
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


@router.post("/upload-image", summary="Upload news display image (JPG, PNG, WEBP)")
async def upload_news_image(
    file: UploadFile = File(..., description="News image file"),
    current_user: User = Depends(require_superadmin),
):
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only JPG, PNG, or WEBP image files are allowed",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"news_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
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
