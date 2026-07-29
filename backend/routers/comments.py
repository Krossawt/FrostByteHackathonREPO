"""
eSKala — Comments Router (Threaded Replies)
GET  /api/v1/projects/{project_id}/comments
POST /api/v1/projects/{project_id}/comments
POST /api/v1/comments/{comment_id}/reply
POST /api/v1/comments/{comment_id}/vote
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Comment, Project, ProjectStatus
from schemas import CommentCreate, CommentResponse
from auth import require_authenticated, get_optional_user, log_action

router = APIRouter(tags=["Comments & Suggestions"])


def _build_comment_tree(comments: List[Comment]) -> List[CommentResponse]:
    """Recursively build a threaded comment tree from a flat list."""
    comment_map = {}
    roots = []

    for c in comments:
        resp = CommentResponse(
            commentID=c.commentID,
            commentFor=c.commentFor,
            parentCommentID=c.parentCommentID,
            authorID=c.authorID,
            commentName=c.commentName,
            commentDetails=c.commentDetails,
            commentType=c.commentType,
            votesCount=c.votesCount,
            commentTimestamp=c.commentTimestamp,
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
    return _build_comment_tree(comments)


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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Parent comment not found in this project")

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
        commentDetails=reply.commentDetails,
        commentType=reply.commentType,
        votesCount=reply.votesCount,
        commentTimestamp=reply.commentTimestamp,
        replies=[],
    )


@router.post(
    "/api/v1/comments/{comment_id}/vote",
    response_model=CommentResponse,
    summary="Upvote a comment or suggestion",
)
def vote_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    comment = db.query(Comment).filter(Comment.commentID == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    comment.votesCount = (comment.votesCount or 0) + 1
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        commentID=comment.commentID,
        commentFor=comment.commentFor,
        parentCommentID=comment.parentCommentID,
        authorID=comment.authorID,
        commentName=comment.commentName,
        commentDetails=comment.commentDetails,
        commentType=comment.commentType,
        votesCount=comment.votesCount,
        commentTimestamp=comment.commentTimestamp,
        replies=[],
    )
