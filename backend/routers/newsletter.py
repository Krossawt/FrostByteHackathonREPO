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
from cache import cache

router = APIRouter(prefix="/api/v1/newsletter", tags=["Newsletter"])


from sqlalchemy import or_


@router.get("", response_model=List[NewsletterResponse], summary="List newsletter entries (public)")
def list_newsletters(
    location: Optional[str] = Query(None, description="Filter by barangay"),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    # Only cache the default unfiltered first-page request (most common call)
    use_cache = (not location and not category and not search and skip == 0 and limit == 50)
    if use_cache:
        cached = cache.get("newsletter:list")
        if cached is not None:
            return cached

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
    result = [NewsletterResponse.model_validate(n) for n in items]

    if use_cache:
        cache.set("newsletter:list", result, 60)  # 60-second TTL

    return result


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


from fastapi import UploadFile, File
from storage import upload_to_supabase


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


@router.post("/upload-image", summary="Upload news display image to Supabase Storage (JPG, PNG, WEBP)")
async def upload_news_image(
    file: UploadFile = File(..., description="News image file"),
    current_user: User = Depends(require_superadmin),
):
    content = await file.read()
    ext = validate_and_get_image_ext(content)

    try:
        public_url = upload_to_supabase(content, ext, folder="news")
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Image upload failed: {exc}",
        )

    return {"imageURL": public_url}


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

    # Invalidate the newsletter list cache so the new entry is visible immediately
    cache.delete("newsletter:list")

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

    # Invalidate the newsletter list cache so the updated entry is visible immediately
    cache.delete("newsletter:list")

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

    # Invalidate the newsletter list cache so the archived entry disappears immediately
    cache.delete("newsletter:list")

    return {"message": f"Newsletter '{item.title}' has been archived"}
