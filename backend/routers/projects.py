"""
eSKala — Projects Router (Simplified, No Staged Workflow)

GET    /api/v1/projects
GET    /api/v1/projects/{id}
POST   /api/v1/projects          (Chairperson or Secretary — creates Incoming immediately)
PATCH  /api/v1/projects/{id}     (Chairperson or Secretary — edit + set status directly)
DELETE /api/v1/projects/{id}     (Chairperson or Secretary — soft delete)

Status values: Incoming | In Progress | Completed
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import User, UserRole, Project, ProjectStatus, Newsletter
from schemas import (
    ProjectCreate, ProjectUpdate,
    ProjectResponse, MessageResponse
)
from auth import (
    require_authenticated, require_chairperson_or_secretary,
    require_chairperson, require_sk_officer,
    get_optional_user, log_action
)
from cache import cache

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])


def _project_or_404(db: Session, project_id: int) -> Project:
    project = (
        db.query(Project)
        .options(joinedload(Project.purchase_orders))
        .filter(Project.projectID == project_id, Project.isDeleted == False)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


from sqlalchemy import func


@router.get("", response_model=List[ProjectResponse], summary="List all projects")
def list_projects(
    barangay: Optional[str] = Query(None),
    status_param: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    public_only: Optional[bool] = Query(None, description="If true, only return Completed and In Progress projects"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Project).options(joinedload(Project.purchase_orders)).filter(Project.isDeleted == False)

    # Optional status filter
    if status_param and status_param.strip() and status_param.strip().lower() != "all":
        st = status_param.strip().lower()
        if "complete" in st or "posted" in st:
            query = query.filter(Project.projectStatus.in_(["Completed", "Posted"]))
        elif "progress" in st or "ongoing" in st:
            query = query.filter(Project.projectStatus.in_(["In Progress", "ongoing"]))
        elif "incoming" in st or "upcoming" in st or "draft" in st:
            query = query.filter(Project.projectStatus.in_(["Incoming", "Drafted", "Finance Update", "For Approval"]))

    # public_only=true → return visible public projects
    if public_only is True:
        query = query.filter(
            Project.projectStatus.in_(["In Progress", "Completed", "Posted", "Incoming"])
        )
    elif public_only is None and current_user is None and not status_param:
        query = query.filter(
            Project.projectStatus.in_(["In Progress", "Completed", "Posted", "Incoming"])
        )

    if barangay and barangay.strip() and barangay.strip() not in {"Santa Rosa City", "All", "all"}:
        query = query.filter(func.lower(func.trim(Project.projectLocation)) == barangay.strip().lower())
    if search and search.strip():
        query = query.filter(Project.projectName.ilike(f"%{search.strip()}%"))
    if category and category.strip() and category.strip() != "All":
        query = query.filter(Project.projectCategory.ilike(category.strip()))

    projects = query.order_by(Project.createdAt.desc()).offset(skip).limit(limit).all()
    return [ProjectResponse.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse, summary="Get project detail")
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    project = _project_or_404(db, project_id)
    return ProjectResponse.model_validate(project)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED,
             summary="Create a new project (Chairperson or Secretary) — defaults to Incoming")
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_chairperson_or_secretary),
):
    if payload.projectEndTime <= payload.projectStartTime:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="End time must be after start time")

    project = Project(
        projectName=payload.projectName,
        projectDescription=payload.projectDescription,
        projectStartTime=payload.projectStartTime,
        projectEndTime=payload.projectEndTime,
        projectLocation=payload.projectLocation,
        projectCreatedBy=current_user.userID,
        projectBudget=payload.projectBudget,
        projectCategory=payload.projectCategory,
        projectStatus=ProjectStatus.INCOMING,  # All projects start as Incoming immediately
        isDeleted=False,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    log_action(db, current_user, "Project Created", "projects", str(project.projectID),
               f"'{project.projectName}' created in {project.projectLocation} — status: Incoming")

    # New project changes report totals — drop the reports cache
    cache.invalidate_prefix("reports:")

    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse, summary="Update project details and/or status")
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_chairperson_or_secretary),
):
    """
    Chairperson or Secretary can update any field including status.
    Status options: Incoming | In Progress | Completed
    """
    project = _project_or_404(db, project_id)

    old_status = str(getattr(project.projectStatus, 'value', project.projectStatus) or "Incoming")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    project.updatedAt = datetime.utcnow()

    db.commit()
    db.refresh(project)

    new_status = str(getattr(project.projectStatus, 'value', project.projectStatus) or old_status)

    # If status changed to Completed, auto-create/update a newsletter entry
    if new_status == "Completed" and old_status != "Completed":
        existing = db.query(Newsletter).filter(Newsletter.projectID == project_id).first()
        if not existing:
            newsletter_entry = Newsletter(
                projectID=project.projectID,
                title=f"[Completed] {project.projectName}",
                summary=project.projectDescription or f"Project '{project.projectName}' has been completed in Barangay {project.projectLocation}.",
                category="SK Project Update",
                projectLocation=project.projectLocation,
                projectBreakdown=project.projectBreakdown,
                authorID=current_user.userID,
                isPublished=True,
                isDeleted=False,
            )
            db.add(newsletter_entry)
            db.commit()

    log_action(db, current_user, "Project Updated", "projects", str(project_id),
               f"Updated '{project.projectName}' — status: {old_status} → {new_status}")

    # Project update (especially status change) affects report totals and may
    # have auto-created a newsletter entry — invalidate both caches
    cache.invalidate_prefix("reports:")
    cache.delete("newsletter:list")

    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", response_model=MessageResponse, summary="Soft-delete a project (Chairperson or Secretary)")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_chairperson_or_secretary),
):
    project = _project_or_404(db, project_id)
    project.isDeleted = True
    db.commit()

    log_action(db, current_user, "Project Deleted", "projects", str(project_id),
               f"Soft-deleted: '{project.projectName}'")

    # Deleted project changes report totals — drop the reports cache
    cache.invalidate_prefix("reports:")

    return {"message": f"Project '{project.projectName}' has been deleted"}
