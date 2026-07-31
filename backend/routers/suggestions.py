"""
eSKala — Standalone Suggestions Router
Suggestions are independent of any project — citizens post them to their barangay feed,
SK officials and community members can read, reply, and upvote them once.

GET  /api/v1/suggestions?barangay=X       — List suggestions for a barangay
POST /api/v1/suggestions                   — Post a new suggestion (Citizens only)
POST /api/v1/suggestions/{id}/vote        — Upvote a suggestion (Limit 1 per user)
POST /api/v1/suggestions/{id}/reply       — Reply to a suggestion (SK officials & users)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, Suggestion, SuggestionReply, SuggestionVote, UserRole
from schemas import SuggestionCreate, SuggestionResponse, SuggestionReplyCreate, SuggestionReplyResponse
from auth import require_authenticated, log_action

router = APIRouter(prefix="/api/v1/suggestions", tags=["Suggestions"])


def _is_citizen(user: User) -> bool:
    """Check if the user is a Citizen (Guest role = registered citizen)."""
    role_str = str(getattr(user.userRole, 'value', user.userRole)).lower()
    return role_str in ('guest', 'citizen')


@router.get("", response_model=List[SuggestionResponse], summary="List suggestions for a barangay")
def list_suggestions(
    barangay: Optional[str] = Query(None, description="Filter by barangay"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    query = db.query(Suggestion)
    if barangay and barangay.strip() and barangay.strip().lower() not in {"all", "santa rosa city"}:
        query = query.filter(Suggestion.barangay == barangay)
    items = query.order_by(Suggestion.createdAt.desc()).offset(skip).limit(limit).all()
    for s in items:
        if s.votesCount is None:
            s.votesCount = 0
    return [SuggestionResponse.model_validate(s) for s in items]


@router.post("", response_model=SuggestionResponse, status_code=status.HTTP_201_CREATED,
             summary="Post a suggestion (Citizens only)")
def create_suggestion(
    payload: SuggestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    if not _is_citizen(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered citizens can post suggestions. SK officials manage and review them.",
        )

    suggestion = Suggestion(
        barangay=current_user.userLocation,
        authorID=current_user.userID,
        authorName=current_user.userName,
        category=payload.category or "General Suggestion",
        suggestionText=payload.suggestionText,
        votesCount=0,
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)

    log_action(
        db, current_user,
        "Suggestion Posted",
        "suggestions",
        str(suggestion.suggestionID),
        f"{current_user.userName} posted a suggestion for Barangay {current_user.userLocation}: '{payload.suggestionText[:60]}'",
    )

    return SuggestionResponse.model_validate(suggestion)


@router.post("/{suggestion_id}/vote", response_model=SuggestionResponse,
             summary="Toggle Upvote/Unvote a suggestion")
def vote_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    suggestion = db.query(Suggestion).filter(Suggestion.suggestionID == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found")

    existing_vote = db.query(SuggestionVote).filter(
        SuggestionVote.suggestionID == suggestion_id,
        SuggestionVote.userID == current_user.userID
    ).first()

    if existing_vote:
        # User already voted — UNDO / UNCHECK / UNVOTE
        db.delete(existing_vote)
        suggestion.votesCount = max(0, (suggestion.votesCount or 0) - 1)
        db.commit()
        db.refresh(suggestion)
        return SuggestionResponse.model_validate(suggestion)

    vote = SuggestionVote(
        suggestionID=suggestion_id,
        userID=current_user.userID,
    )
    db.add(vote)
    suggestion.votesCount = (suggestion.votesCount or 0) + 1
    db.commit()
    db.refresh(suggestion)

    return SuggestionResponse.model_validate(suggestion)


@router.patch("/{suggestion_id}", response_model=SuggestionResponse,
              summary="Edit suggestion (Creator or Super Admin)")
def update_suggestion(
    suggestion_id: int,
    payload: SuggestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    suggestion = db.query(Suggestion).filter(Suggestion.suggestionID == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found")

    role_str = str(getattr(current_user.userRole, 'value', current_user.userRole)).lower()
    if suggestion.authorID != current_user.userID and role_str != 'superadmin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own suggestions.")

    if payload.suggestionText and payload.suggestionText.strip():
        suggestion.suggestionText = payload.suggestionText.strip()
    if payload.category:
        suggestion.category = payload.category

    db.commit()
    db.refresh(suggestion)
    return SuggestionResponse.model_validate(suggestion)


@router.delete("/{suggestion_id}", summary="Delete suggestion (Creator or Super Admin)")
def delete_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    suggestion = db.query(Suggestion).filter(Suggestion.suggestionID == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found")

    role_str = str(getattr(current_user.userRole, 'value', current_user.userRole)).lower()
    if suggestion.authorID != current_user.userID and role_str != 'superadmin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own suggestions.")

    db.delete(suggestion)
    db.commit()
    return {"message": "Suggestion deleted successfully"}



@router.post("/{suggestion_id}/reply", response_model=SuggestionResponse,
             summary="Reply to a suggestion (SK Officials & Community members)")
def reply_suggestion(
    suggestion_id: int,
    payload: SuggestionReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    suggestion = db.query(Suggestion).filter(Suggestion.suggestionID == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found")

    role_val = str(getattr(current_user.userRole, 'value', current_user.userRole))

    reply = SuggestionReply(
        suggestionID=suggestion_id,
        authorID=current_user.userID,
        authorName=current_user.userName,
        authorRole=role_val,
        replyText=payload.replyText,
    )
    db.add(reply)
    db.commit()
    db.refresh(suggestion)

    log_action(
        db, current_user,
        "Suggestion Replied",
        "suggestions",
        str(suggestion_id),
        f"{current_user.userName} ({role_val}) replied to suggestion #{suggestion_id}: '{payload.replyText[:50]}'",
    )

    return SuggestionResponse.model_validate(suggestion)
