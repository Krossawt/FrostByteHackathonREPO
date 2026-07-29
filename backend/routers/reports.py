"""
eSKala — Reports / Dashboard Router (Public Consolidated Data)
GET /api/v1/reports/consolidated           (City-wide summary)
GET /api/v1/reports/barangay/{name}        (Per-barangay summary)
GET /api/v1/reports/sk-officials           (SK officials public list)
GET /api/v1/reports/sk-officials/{barangay}
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Project, ProjectStatus, AnnualBudgetReport, UserRole
from schemas import CityConsolidatedReport, BarangaySummary, UserResponse

router = APIRouter(prefix="/api/v1/reports", tags=["Reports & Dashboard"])

BARANGAYS = [
    "Aplaya", "Balibago", "Caingin", "Dila", "Dita", "Don Jose",
    "Ibaba", "Kanluran", "Labas", "Macabling", "Malitlit", "Malusak",
    "Market Area", "Pooc", "Pulong Santa Cruz", "Santo Domingo",
    "Sinalhan", "Tagapo"
]


@router.get("/consolidated", response_model=CityConsolidatedReport,
            summary="City-wide financial and project summary (public)")
@router.get("/summary", response_model=CityConsolidatedReport, include_in_schema=False)
def get_consolidated_report(db: Session = Depends(get_db)):
    barangay_summaries = []
    total_budget_sum = db.query(func.coalesce(func.sum(AnnualBudgetReport.budgetValue), 0.0)).scalar()
    total_budget = float(total_budget_sum or 0.0)
    total_spent = 0.0
    total_projects = 0
    ongoing_count = 0
    completed_count = 0
    upcoming_count = 0

    for barangay in BARANGAYS:
        # Get latest budget report for this barangay
        budget_row = (
            db.query(AnnualBudgetReport)
            .filter(AnnualBudgetReport.budgetBarangay == barangay)
            .order_by(AnnualBudgetReport.budgetYear.desc())
            .first()
        )
        annual_budget = float(budget_row.budgetValue) if budget_row else 0.0

        # Get projects for this barangay (case-insensitive & whitespace trimmed)
        all_projects = (
            db.query(Project)
            .filter(func.lower(func.trim(Project.projectLocation)) == barangay.lower(), Project.isDeleted == False)
            .all()
        )

        # Compute spending from project breakdown or proposed budget spent
        spent = sum(float(p.projectBreakdown or 0) for p in all_projects)

        barangay_ongoing = sum(1 for p in all_projects if str(getattr(p.projectStatus, 'value', p.projectStatus) or "").lower() in ["in progress", "ongoing"])
        barangay_completed = sum(1 for p in all_projects if str(getattr(p.projectStatus, 'value', p.projectStatus) or "").lower() in ["completed", "posted"])
        barangay_upcoming = sum(1 for p in all_projects if str(getattr(p.projectStatus, 'value', p.projectStatus) or "").lower() in ["incoming", "upcoming", "drafted", "finance update", "for approval"])

        barangay_summaries.append(BarangaySummary(
            barangay=barangay,
            annualBudget=annual_budget,
            spent=spent,
            remaining=max(annual_budget - spent, 0.0),
            projectCount=len(all_projects),
            ongoingCount=barangay_ongoing,
            completedCount=barangay_completed,
        ))

        total_spent += spent
        total_projects += len(all_projects)
        ongoing_count += barangay_ongoing
        completed_count += barangay_completed
        upcoming_count += barangay_upcoming

    sk_officials_count = db.query(User).filter(
        User.userIsSK == True,
        User.userIsDeleted == False,
        User.userIsActive == True,
    ).count()

    return CityConsolidatedReport(
        totalBudget=total_budget,
        totalSpent=total_spent,
        totalRemaining=max(total_budget - total_spent, 0.0),
        totalProjects=total_projects,
        ongoingProjects=ongoing_count,
        completedProjects=completed_count,
        upcomingProjects=upcoming_count,
        skOfficialsCount=sk_officials_count,
        barangays=barangay_summaries,
    )


@router.get("/barangay/{barangay_name}", summary="Per-barangay financial and project summary (public)")
def get_barangay_report(barangay_name: str, db: Session = Depends(get_db)):
    target_brgy = barangay_name.strip()
    matched_brgy = next((b for b in BARANGAYS if b.lower() == target_brgy.lower()), None)
    canonical_name = matched_brgy if matched_brgy else target_brgy

    # Budget reports
    budget_reports_query = db.query(AnnualBudgetReport)
    if canonical_name not in {"Santa Rosa City", "All", "all"}:
        budget_reports_query = budget_reports_query.filter(
            func.lower(func.trim(AnnualBudgetReport.budgetBarangay)) == canonical_name.lower()
        )
    budget_reports = budget_reports_query.order_by(AnnualBudgetReport.budgetYear.desc()).all()
    latest_budget = float(budget_reports[0].budgetValue) if budget_reports else 0.0

    # Projects
    projects_query = db.query(Project).filter(Project.isDeleted == False)
    if canonical_name not in {"Santa Rosa City", "All", "all"}:
        projects_query = projects_query.filter(
            func.lower(func.trim(Project.projectLocation)) == canonical_name.lower()
        )
    projects = projects_query.order_by(Project.createdAt.desc()).all()

    # SK Officials for this barangay
    officials_query = db.query(User).filter(
        User.userIsSK == True,
        User.userIsDeleted == False,
        User.userIsActive == True,
    )
    if canonical_name not in {"Santa Rosa City", "All", "all"}:
        officials_query = officials_query.filter(
            func.lower(func.trim(User.userLocation)) == canonical_name.lower()
        )
    officials = officials_query.all()

    from datetime import datetime as dt
    now = dt.utcnow()

    spent = sum(float(p.projectBreakdown or 0) for p in projects)

    return {
        "barangay": barangay_name,
        "annualBudget": latest_budget,
        "spent": spent,
        "remaining": max(latest_budget - spent, 0.0),
        "budgetReports": [
            {
                "year": r.budgetYear,
                "value": float(r.budgetValue),
                "uploadedOn": r.budgetUploadedOn.isoformat() if r.budgetUploadedOn else None,
            }
            for r in budget_reports
        ],
        "projects": [
            {
                "projectID": p.projectID,
                "projectName": p.projectName,
                "projectStatus": str(getattr(p.projectStatus, 'value', p.projectStatus) or "Incoming"),
                "projectCategory": p.projectCategory,
                "projectStartTime": p.projectStartTime.isoformat() if p.projectStartTime else None,
                "projectEndTime": p.projectEndTime.isoformat() if p.projectEndTime else None,
                "projectBreakdown": float(p.projectBreakdown) if p.projectBreakdown else None,
                "projectBudget": float(p.projectBudget) if p.projectBudget else None,
                "projectProgress": p.projectProgress,
            }
            for p in projects
        ],
        "skOfficials": [
            {
                "userID": o.userID,
                "userName": o.userName,
                "userRole": o.userRole.value,
                "userSKTermStart": o.userSKTermStart.isoformat() if o.userSKTermStart else None,
                "userSKTermEnd": o.userSKTermEnd.isoformat() if o.userSKTermEnd else None,
            }
            for o in officials
        ],
    }


@router.get("/sk-officials", response_model=List[UserResponse],
            summary="List all SK officials city-wide (public)")
def list_sk_officials(
    barangay: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(
        User.userIsSK == True,
        User.userIsDeleted == False,
        User.userIsActive == True,
    )
    if barangay:
        query = query.filter(User.userLocation == barangay)

    officials = query.order_by(User.userLocation, User.userRole).all()
    return [UserResponse.model_validate(o) for o in officials]


@router.get("/sk-officials/{barangay_name}", response_model=List[UserResponse],
            summary="List SK officials for a specific barangay (public)")
def get_barangay_officials(barangay_name: str, db: Session = Depends(get_db)):
    if barangay_name not in BARANGAYS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barangay not found")
    officials = (
        db.query(User)
        .filter(
            User.userLocation == barangay_name,
            User.userIsSK == True,
            User.userIsDeleted == False,
            User.userIsActive == True,
        )
        .order_by(User.userRole)
        .all()
    )
    return [UserResponse.model_validate(o) for o in officials]
