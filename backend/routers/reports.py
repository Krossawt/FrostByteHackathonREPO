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
from cache import cache

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
    CACHE_KEY = "reports:consolidated"
    CACHE_TTL = 300  # 5-minute TTL — heavy query, data changes infrequently

    cached = cache.get(CACHE_KEY)
    if cached is not None:
        return cached

    from sqlalchemy import case, text

    # ── 1. Fetch latest budget per barangay in ONE query ────────────────────────────────
    from sqlalchemy import distinct
    # Get max budgetYear per barangay, then join value
    latest_year_subq = (
        db.query(
            AnnualBudgetReport.budgetBarangay,
            func.max(AnnualBudgetReport.budgetYear).label("maxYear"),
        )
        .group_by(AnnualBudgetReport.budgetBarangay)
        .subquery()
    )
    budget_rows = (
        db.query(
            AnnualBudgetReport.budgetBarangay,
            AnnualBudgetReport.budgetValue,
        )
        .join(
            latest_year_subq,
            (AnnualBudgetReport.budgetBarangay == latest_year_subq.c.budgetBarangay)
            & (AnnualBudgetReport.budgetYear == latest_year_subq.c.maxYear),
        )
        .all()
    )
    budget_by_brgy: dict = {r.budgetBarangay: float(r.budgetValue) for r in budget_rows}
    total_budget = sum(budget_by_brgy.values())

    # ── 2. Fetch all projects in ONE query — only the 3 columns we need ────────────────
    proj_rows = (
        db.query(
            Project.projectLocation,
            Project.projectStatus,
            Project.projectBreakdown,
        )
        .filter(Project.isDeleted == False)
        .all()
    )

    # Aggregate in Python — zero extra DB round trips
    from collections import defaultdict
    brgy_data: dict = defaultdict(lambda: {"spent": 0.0, "ongoing": 0, "completed": 0, "upcoming": 0, "total": 0})
    total_spent = 0.0
    total_projects = 0
    ongoing_count = 0
    completed_count = 0
    upcoming_count = 0

    for row in proj_rows:
        loc = (row.projectLocation or "").strip()
        st = str(getattr(row.projectStatus, "value", row.projectStatus) or "").lower()
        brk = float(row.projectBreakdown or 0)
        d = brgy_data[loc]
        d["spent"] += brk
        d["total"] += 1
        total_spent += brk
        total_projects += 1
        if st in {"in progress", "ongoing"}:
            d["ongoing"] += 1; ongoing_count += 1
        elif st in {"completed", "posted"}:
            d["completed"] += 1; completed_count += 1
        else:
            d["upcoming"] += 1; upcoming_count += 1

    # ── 3. SK officials count ───────────────────────────────────────────────────────────────────────
    sk_officials_count = db.query(func.count(User.userID)).filter(
        User.userIsSK == True,
        User.userIsDeleted == False,
        User.userIsActive == True,
    ).scalar() or 0

    # ── 4. Build barangay summaries ───────────────────────────────────────────────────────────────────
    barangay_summaries = []
    for barangay in BARANGAYS:
        annual_budget = budget_by_brgy.get(barangay, 0.0)
        d = brgy_data.get(barangay, {"spent": 0.0, "ongoing": 0, "completed": 0, "upcoming": 0, "total": 0})
        barangay_summaries.append(BarangaySummary(
            barangay=barangay,
            annualBudget=annual_budget,
            spent=d["spent"],
            remaining=max(annual_budget - d["spent"], 0.0),
            projectCount=d["total"],
            ongoingCount=d["ongoing"],
            completedCount=d["completed"],
        ))

    result = CityConsolidatedReport(
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
    cache.set(CACHE_KEY, result, CACHE_TTL)
    return result


@router.get("/barangay/{barangay_name}", summary="Per-barangay financial and project summary (public)")
def get_barangay_report(barangay_name: str, db: Session = Depends(get_db)):
    # Normalise key: lowercase, stripped so "Balibago" and "balibago" share one entry
    CACHE_KEY = f"reports:barangay:{barangay_name.strip().lower()}"
    CACHE_TTL = 60  # seconds

    cached = cache.get(CACHE_KEY)
    if cached is not None:
        return cached

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

    result = {
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
    cache.set(CACHE_KEY, result, CACHE_TTL)
    return result


@router.get("/sk-officials", response_model=List[UserResponse],
            summary="List all SK officials city-wide (public)")
def list_sk_officials(
    barangay: Optional[str] = None,
    db: Session = Depends(get_db),
):
    # Cache key includes barangay so filtered and unfiltered results are separate entries
    CACHE_KEY = f"reports:sk-officials:{(barangay or '').strip().lower()}"
    CACHE_TTL = 600  # 10-minute TTL — SK roster changes only when Super Admin edits it

    cached = cache.get(CACHE_KEY)
    if cached is not None:
        return cached

    query = db.query(User).filter(
        User.userIsSK == True,
        User.userIsDeleted == False,
        User.userIsActive == True,
    )
    if barangay:
        query = query.filter(User.userLocation == barangay)

    officials = query.order_by(User.userLocation, User.userRole).all()
    result = [UserResponse.model_validate(o) for o in officials]
    cache.set(CACHE_KEY, result, CACHE_TTL)
    return result


@router.get("/sk-officials/{barangay_name}", response_model=List[UserResponse],
            summary="List SK officials for a specific barangay (public)")
def get_barangay_officials(barangay_name: str, db: Session = Depends(get_db)):
    CACHE_KEY = f"reports:sk-officials-brgy:{barangay_name.strip().lower()}"
    CACHE_TTL = 600  # 10-minute TTL — rarely changes

    cached = cache.get(CACHE_KEY)
    if cached is not None:
        return cached

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
    result = [UserResponse.model_validate(o) for o in officials]
    cache.set(CACHE_KEY, result, CACHE_TTL)
    return result
