"""
eSKala — Comments Router (Threaded Replies)
GET  /api/v1/projects/{project_id}/comments
POST /api/v1/projects/{project_id}/comments
POST /api/v1/comments/{comment_id}/reply
POST /api/v1/comments/{comment_id}/vote
"""
from models import CommentVote
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Comment, Project, ProjectStatus
from schemas import CommentCreate, CommentResponse
from auth import require_authenticated, get_optional_user, log_action

router = APIRouter(tags=["Comments & Suggestions"])


# ─── HELPER: Bulletproof Role Formatter ──────────────────────────────
def _get_formatted_role(user) -> str:
    if not user:
        return "SK Official"
    
    # Grab the actual database column: userRole (which contains "SK Chairperson", "SK Treasurer", etc.)
    role_enum_or_str = getattr(user, 'userRole', 'SK Official')
    
    # Handle both string and Enum values safely
    raw_role = getattr(role_enum_or_str, 'value', str(role_enum_or_str))
    
    if raw_role and raw_role not in ["System", "Guest", "Citizen", "Super Admin", "SK Official"]:
        # If it's already an official title like "SK Chairperson", return it as is. 
        # If it's just "Chairperson", prepend "SK ".
        return f"SK {raw_role}" if not raw_role.startswith("SK ") else raw_role
    
    return raw_role or "SK Official"
# ─────────────────────────────────────────────────────────────────────


def _build_comment_tree(comments: List[Comment], voted_comment_ids: set, role_map: dict) -> List[CommentResponse]:
    """Recursively build a threaded comment tree from a flat list."""
    comment_map = {}
    roots = []

    for c in comments:
        # Force string lookup to prevent int/str type mismatches!
        safe_id = str(c.authorID) if c.authorID else ""
        determined_role = role_map.get(safe_id, "SK Official")

        resp = CommentResponse(
            commentID=c.commentID,
            commentFor=c.commentFor,
            parentCommentID=c.parentCommentID,
            authorID=c.authorID,
            commentName=c.commentName,
            authorRole=determined_role, # <--- Perfectly mapped and formatted role!
            commentDetails=c.commentDetails,
            commentType=c.commentType,
            votesCount=c.votesCount,
            commentTimestamp=c.commentTimestamp,
            hasVoted=(c.commentID in voted_comment_ids),
            replies=[],
        )
        comment_map[c.commentID] = resp

    for c in comments:
        resp = comment_map[c.commentID]
        if c.parentCommentID and c.parentCommentID in comment_map:
            comment_map[c.parentCommentID].replies.append(resp)
        elif not c.parentCommentID:
            roots.append(resp)

    return roots


@router.get(
    "/api/v1/projects/{project_id}/comments",
    response_model=List[CommentResponse],
    summary="Get all threaded comments for a project (public)",
)
def get_comments(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    from models import Project, Comment, CommentVote, User
    
    # Verify project exists
    project = db.query(Project).filter(Project.projectID == project_id, Project.isDeleted == False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    comments = (
        db.query(Comment)
        .filter(Comment.commentFor == project_id)
        .order_by(Comment.commentTimestamp.asc())
        .all()
    )
    
    voted_comment_ids = set()
    if current_user:
        user_votes = db.query(CommentVote.commentID).filter(CommentVote.userID == current_user.userID).all()
        voted_comment_ids = {vote[0] for vote in user_votes}

    # --- FETCH ROLES & FORCE STRING KEYS ---
    author_ids = [c.authorID for c in comments if c.authorID]
    users = db.query(User).filter(User.userID.in_(author_ids)).all()
    
    role_map = {}
    for u in users:
        uid = str(getattr(u, 'userID', getattr(u, 'id', '')))
        role_map[uid] = _get_formatted_role(u)

    return _build_comment_tree(comments, voted_comment_ids, role_map)


@router.post(
    "/api/v1/projects/{project_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a comment or suggestion on a project",
)
def create_comment(
    project_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    project = db.query(Project).filter(Project.projectID == project_id, Project.isDeleted == False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if payload.parentCommentID:
        parent = db.query(Comment).filter(
            Comment.commentID == payload.parentCommentID,
            Comment.commentFor == project_id
        ).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent comment not found in this project")

    comment = Comment(
        commentFor=project_id,
        parentCommentID=payload.parentCommentID,
        authorID=current_user.userID,
        commentName=current_user.userName,
        commentDetails=payload.commentDetails,
        commentType=payload.commentType,
        votesCount=0,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    log_action(db, current_user, "Comment Submitted", "comments", str(comment.commentID),
               f"{current_user.userName} submitted a {'suggestion' if payload.commentType == 'suggestion' else 'comment'} on project #{project_id}")

    return CommentResponse(
        commentID=comment.commentID,
        commentFor=comment.commentFor,
        parentCommentID=comment.parentCommentID,
        authorID=comment.authorID,
        commentName=comment.commentName,
        authorRole=_get_formatted_role(current_user), # Assigned on creation!
        commentDetails=comment.commentDetails,
        commentType=comment.commentType,
        votesCount=comment.votesCount,
        commentTimestamp=comment.commentTimestamp,
        replies=[],
    )


@router.post(
    "/api/v1/comments/{comment_id}/reply",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Reply to an existing comment",
)
def reply_to_comment(
    comment_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    parent = db.query(Comment).filter(Comment.commentID == comment_id).first()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    reply = Comment(
        commentFor=parent.commentFor,
        parentCommentID=comment_id,
        authorID=current_user.userID,
        commentName=current_user.userName,
        commentDetails=payload.commentDetails,
        commentType=payload.commentType,
        votesCount=0,
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)

    return CommentResponse(
        commentID=reply.commentID,
        commentFor=reply.commentFor,
        parentCommentID=reply.parentCommentID,
        authorID=reply.authorID,
        commentName=reply.commentName,
        authorRole=_get_formatted_role(current_user), # Assigned on creation!
        commentDetails=reply.commentDetails,
        commentType=reply.commentType,
        votesCount=reply.votesCount,
        commentTimestamp=reply.commentTimestamp,
        replies=[],
    )


@router.post(
    "/api/v1/comments/{comment_id}/vote",
    response_model=CommentResponse,
    summary="Toggle upvote on a comment",
)
def vote_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    comment = db.query(Comment).filter(Comment.commentID == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    existing_vote = db.query(CommentVote).filter(
        CommentVote.commentID == comment_id,
        CommentVote.userID == current_user.userID
    ).first()

    has_voted = False
    if existing_vote:
        db.delete(existing_vote)
        comment.votesCount = max(0, (comment.votesCount or 0) - 1)
    else:
        new_vote = CommentVote(commentID=comment_id, userID=current_user.userID)
        db.add(new_vote)
        comment.votesCount = (comment.votesCount or 0) + 1
        has_voted = True

    db.commit()
    db.refresh(comment)
    
    # Grab author's role safely for the response
    author = db.query(User).filter(User.userID == comment.authorID).first()

    resp = CommentResponse(
        commentID=comment.commentID,
        commentFor=comment.commentFor,
        parentCommentID=comment.parentCommentID,
        authorID=comment.authorID,
        commentName=comment.commentName,
        authorRole=_get_formatted_role(author),
        commentDetails=comment.commentDetails,
        commentType=comment.commentType,
        votesCount=comment.votesCount,
        commentTimestamp=comment.commentTimestamp,
        replies=[],
    )
    resp.hasVoted = has_voted
    return resp