"""
eSKala — Projects Router
Full 5-stage workflow + CRUD.

GET    /api/v1/projects
GET    /api/v1/projects/{id}
POST   /api/v1/projects
PATCH  /api/v1/projects/{id}
DELETE /api/v1/projects/{id}

Workflow transitions:
PATCH  /api/v1/projects/{id}/submit-to-finance    (Chairperson/Secretary → Treasurer)
PATCH  /api/v1/projects/{id}/update-breakdown     (Treasurer adds budget breakdown)
PATCH  /api/v1/projects/{id}/submit-for-approval  (Treasurer → Chairperson)
PATCH  /api/v1/projects/{id}/approve-post         (Chairperson approves → auto Newsletter)
PATCH  /api/v1/projects/{id}/reject               (Chairperson rejects → back to Finance Update)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import User, UserRole, Project, ProjectStatus, Newsletter, AuditLog
from schemas import (
    ProjectCreate, ProjectUpdate, ProjectBreakdownUpdate,
    ProjectResponse, MessageResponse
)
from auth import (
    require_authenticated, require_chairperson_or_secretary,
    require_chairperson, require_treasurer, require_sk_officer,
    get_optional_user, log_action
)

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


@router.get("", response_model=List[ProjectResponse], summary="List all projects (public)")
def list_projects(
    barangay: Optional[str] = Query(None),
    status_param: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    public_only: Optional[bool] = Query(None, description="If true, only return Posted projects"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Project).options(joinedload(Project.purchase_orders)).filter(Project.isDeleted == False)

    # Filter status flexibly if provided
    if status_param and status_param.strip() and status_param.strip().lower() != "all":
        st = status_param.strip().lower()
        if "post" in st or "complete" in st:
            query = query.filter(Project.projectStatus == ProjectStatus.POSTED)
        elif "finance" in st:
            query = query.filter(Project.projectStatus == ProjectStatus.FINANCE_UPDATE)
        elif "approval" in st:
            query = query.filter(Project.projectStatus == ProjectStatus.FOR_APPROVAL)
        elif "draft" in st:
            query = query.filter(Project.projectStatus == ProjectStatus.DRAFTED)

    # Restrict to Posted projects only if public_only is explicitly True or for Guest/unauthenticated users when public_only is not False
    if public_only is True:
        query = query.filter(Project.projectStatus == ProjectStatus.POSTED)
    elif public_only is None and (current_user is None or (hasattr(current_user, 'userRole') and current_user.userRole == UserRole.GUEST)):
        query = query.filter(Project.projectStatus == ProjectStatus.POSTED)

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
    # Non-SK users can only view Posted projects
    if (current_user is None or current_user.userRole.value in {"Guest", "System"}):
        if project.projectStatus != ProjectStatus.POSTED:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Project not yet published")
    return ProjectResponse.model_validate(project)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED,
             summary="Create a project draft (Chairperson or Secretary)")
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
        projectStatus=ProjectStatus.DRAFTED,
        isDeleted=False,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    log_action(db, current_user, "Project Created", "projects", str(project.projectID),
               f"'{project.projectName}' created in {project.projectLocation} — status: Drafted")

    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse, summary="Update project details")
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sk_officer),
):
    project = _project_or_404(db, project_id)
    if project.projectStatus == ProjectStatus.POSTED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Cannot edit a posted project")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    project.updatedAt = datetime.utcnow()

    db.commit()
    db.refresh(project)

    log_action(db, current_user, "Project Updated", "projects", str(project_id),
               f"Updated project '{project.projectName}'")

    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", response_model=MessageResponse, summary="Soft-delete a project (Chairperson)")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_chairperson),
):
    project = _project_or_404(db, project_id)
    project.isDeleted = True
    db.commit()

    log_action(db, current_user, "Project Deleted", "projects", str(project_id),
               f"Soft-deleted: '{project.projectName}'")

    return {"message": f"Project '{project.projectName}' has been deleted"}


# ─── WORKFLOW TRANSITIONS ─────────────────────────────────────────────────────

@router.patch("/{project_id}/submit-to-finance", response_model=ProjectResponse,
              summary="Stage 2: Submit project to Treasurer for finance update")
def submit_to_finance(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_chairperson_or_secretary),
):
    project = _project_or_404(db, project_id)
    if project.projectStatus != ProjectStatus.DRAFTED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Project must be in 'Drafted' status. Current: {project.projectStatus.value}")

    project.projectStatus = ProjectStatus.FINANCE_UPDATE
    project.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(project)

    log_action(db, current_user, "Project → Finance Update", "projects", str(project_id),
               f"'{project.projectName}' submitted to Treasurer for finance update")

    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}/update-breakdown", response_model=ProjectResponse,
              summary="Stage 3: Treasurer adds financial breakdown to project")
def update_breakdown(
    project_id: int,
    payload: ProjectBreakdownUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_treasurer),
):
    project = _project_or_404(db, project_id)
    if project.projectStatus != ProjectStatus.FINANCE_UPDATE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Project must be in 'Finance Update' status. Current: {project.projectStatus.value}")

    project.projectBreakdown = payload.projectBreakdown
    project.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(project)

    log_action(db, current_user, "Project Breakdown Added", "projects", str(project_id),
               f"Treasurer set breakdown ₱{payload.projectBreakdown:,.2f} for '{project.projectName}'")

    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}/submit-for-approval", response_model=ProjectResponse,
              summary="Stage 4: Treasurer submits project to Chairperson for final approval")
def submit_for_approval(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_treasurer),
):
    project = _project_or_404(db, project_id)
    if project.projectStatus != ProjectStatus.FINANCE_UPDATE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Project must be in 'Finance Update' status. Current: {project.projectStatus.value}")
    if project.projectBreakdown is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Project breakdown must be set before submitting for approval")

    project.projectStatus = ProjectStatus.FOR_APPROVAL
    project.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(project)

    log_action(db, current_user, "Project → For Approval", "projects", str(project_id),
               f"Treasurer submitted '{project.projectName}' for Chairperson approval")

    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}/approve-post", response_model=ProjectResponse,
              summary="Stage 5: Chairperson approves and posts the project (auto-creates Newsletter)")
def approve_and_post(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_chairperson),
):
    project = _project_or_404(db, project_id)
    if project.projectStatus != ProjectStatus.FOR_APPROVAL:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Project must be in 'For Approval' status. Current: {project.projectStatus.value}")

    project.projectStatus = ProjectStatus.POSTED
    project.updatedAt = datetime.utcnow()
    db.commit()

    # Auto-create Newsletter entry (System automation)
    existing_newsletter = db.query(Newsletter).filter(Newsletter.projectID == project_id).first()
    if not existing_newsletter:
        newsletter_entry = Newsletter(
            projectID=project.projectID,
            title=f"[Posted] {project.projectName}",
            summary=project.projectDescription or f"Project '{project.projectName}' has been officially approved and posted in Barangay {project.projectLocation}.",
            category="SK Project Update",
            projectLocation=project.projectLocation,
            projectBreakdown=project.projectBreakdown,
            authorID=current_user.userID,
            isPublished=True,
            isDeleted=False,
        )
        db.add(newsletter_entry)
        db.commit()

    db.refresh(project)

    log_action(db, current_user, "Project Posted", "projects", str(project_id),
               f"Chairperson approved and posted '{project.projectName}'. Newsletter auto-generated.")

    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}/reject", response_model=ProjectResponse,
              summary="Chairperson rejects project — returns to Finance Update status")
def reject_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_chairperson),
):
    project = _project_or_404(db, project_id)
    if project.projectStatus != ProjectStatus.FOR_APPROVAL:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Project must be in 'For Approval' status. Current: {project.projectStatus.value}")

    project.projectStatus = ProjectStatus.FINANCE_UPDATE
    project.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(project)

    log_action(db, current_user, "Project Rejected", "projects", str(project_id),
               f"Chairperson rejected '{project.projectName}' — returned to Finance Update")

    return ProjectResponse.model_validate(project)
