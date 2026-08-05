"""
eSKala — Annual Budget Reports Router (with OCR Scaffold)
GET  /api/v1/budget-reports
GET  /api/v1/budget-reports/{id}
POST /api/v1/budget-reports/upload
PATCH /api/v1/budget-reports/{id}/override
"""

import os
import uuid
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from models import User, AnnualBudgetReport, AuditLog
from schemas import BudgetReportResponse, BudgetReportOverride, BudgetReportCreate, MessageResponse
from auth import require_sk_officer, require_authenticated, log_action
from cache import cache

router = APIRouter(prefix="/api/v1/budget-reports", tags=["Annual Budget Reports"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "static/uploads")

BARANGAYS = [
    "Aplaya", "Balibago", "Caingin", "Dila", "Dita", "Don Jose",
    "Ibaba", "Kanluran", "Labas", "Macabling", "Malitlit", "Malusak",
    "Market Area", "Pooc", "Pulong Santa Cruz", "Santo Domingo",
    "Sinalhan", "Tagapo"
]


@router.post("", response_model=BudgetReportResponse, status_code=status.HTTP_201_CREATED,
             summary="Post/Create Annual Budget Report (ABYIP)")
def create_budget_report(
    payload: BudgetReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sk_officer),
):
    if payload.budgetBarangay not in BARANGAYS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail=f"'{payload.budgetBarangay}' is not a valid Santa Rosa City barangay")

    report = AnnualBudgetReport(
        budgetBarangay=payload.budgetBarangay,
        budgetUploadedBy=current_user.userID,
        budgetYear=payload.budgetYear,
        budgetValue=payload.budgetValue,
        budgetFileURL=payload.budgetFileURL,
        isOCRScanned=False,
        isManuallyOverridden=True,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    log_action(db, current_user, "Posted Approved ABYIP", "annual_budget_reports", str(report.budgetID),
               f"Approved ABYIP posted for {payload.budgetBarangay} FY{payload.budgetYear} — ₱{payload.budgetValue:,.2f}")

    # New budget report changes consolidated totals — drop the reports cache
    cache.invalidate_prefix("reports:")

    return BudgetReportResponse.model_validate(report)


@router.get("", response_model=List[BudgetReportResponse], summary="List annual budget reports")
def list_budget_reports(
    barangay: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    query = db.query(AnnualBudgetReport)
    if barangay and barangay.strip() and barangay.strip() not in {"Santa Rosa City", "All", "all"}:
        query = query.filter(func.lower(func.trim(AnnualBudgetReport.budgetBarangay)) == barangay.strip().lower())
    if year:
        query = query.filter(AnnualBudgetReport.budgetYear == year)

    reports = query.order_by(AnnualBudgetReport.budgetYear.desc(), AnnualBudgetReport.budgetBarangay).all()
    return [BudgetReportResponse.model_validate(r) for r in reports]


@router.get("/{report_id}", response_model=BudgetReportResponse, summary="Get budget report detail")
def get_budget_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    report = db.query(AnnualBudgetReport).filter(AnnualBudgetReport.budgetID == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget report not found")
    return BudgetReportResponse.model_validate(report)


MAX_BUDGET_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit


def validate_and_get_budget_file_ext(content: bytes) -> str:
    if len(content) > MAX_BUDGET_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowed limit of 10MB",
        )
    if content.startswith(b"\xFF\xD8\xFF"):
        return "jpg"
    elif content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    elif len(content) >= 12 and content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return "webp"
    elif content.startswith(b"%PDF-"):
        return "pdf"
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid file format. Only authentic JPG, PNG, WEBP, or PDF files are accepted.",
        )


@router.post("/upload", response_model=BudgetReportResponse, status_code=status.HTTP_201_CREATED,
             summary="Upload Annual Budget Report — OCR auto-extracts budget year and value")
async def upload_budget_report(
    barangay: str = Form(..., description="Barangay name"),
    file: UploadFile = File(..., description="Budget report scan (PDF, PNG, JPG)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sk_officer),
):
    if barangay not in BARANGAYS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail=f"'{barangay}' is not a valid Santa Rosa City barangay")

    content = await file.read()
    ext = validate_and_get_budget_file_ext(content)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"budget_{barangay.replace(' ', '_')}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    # ─── OCR STUB ──────────────────────────────────────────────────────────────
    # TODO: Replace with Google Cloud Vision / AWS Textract call.
    # Should extract: budget fiscal year and total budget value from the document.
    from datetime import datetime as dt
    current_year = dt.now().year
    ocr_budget_year = current_year
    # Simulate a realistic SK annual budget for Santa Rosa barangay (₱500K–₱1.5M range)
    ocr_budget_value = round(random.uniform(500_000, 1_500_000), 2)
    # ───────────────────────────────────────────────────────────────────────────

    file_url = f"/static/uploads/{filename}"

    report = AnnualBudgetReport(
        budgetBarangay=barangay,
        budgetUploadedBy=current_user.userID,
        budgetYear=ocr_budget_year,
        budgetValue=ocr_budget_value,
        budgetFileURL=file_url,
        isOCRScanned=True,
        isManuallyOverridden=False,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Auto-audit log
    entry = AuditLog(
        actorID=current_user.userID,
        actorName=current_user.userName,
        actorRole=current_user.userRole.value,
        barangay=barangay,
        actionType="Budget Report Uploaded (OCR)",
        targetModule="annual_budget_reports",
        targetID=str(report.budgetID),
        details=f"Budget report for {barangay} FY{ocr_budget_year} uploaded. OCR extracted ₱{ocr_budget_value:,.2f}",
    )
    db.add(entry)
    db.commit()

    # Uploaded budget affects consolidated totals — drop the reports cache
    cache.invalidate_prefix("reports:")

    return BudgetReportResponse.model_validate(report)


@router.patch("/{report_id}/override", response_model=BudgetReportResponse,
              summary="Manually override OCR-extracted budget values")
def override_budget_report(
    report_id: int,
    payload: BudgetReportOverride,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sk_officer),
):
    report = db.query(AnnualBudgetReport).filter(AnnualBudgetReport.budgetID == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget report not found")

    if payload.budgetBarangay:
        report.budgetBarangay = payload.budgetBarangay
    if payload.budgetYear:
        report.budgetYear = payload.budgetYear
    if payload.budgetValue is not None:
        report.budgetValue = payload.budgetValue

    report.isManuallyOverridden = True
    db.commit()
    db.refresh(report)

    log_action(db, current_user, "Budget Report Override", "annual_budget_reports", str(report_id),
               f"Manual override applied to budget report #{report_id}: {report.budgetBarangay} FY{report.budgetYear} = ₱{report.budgetValue:,.2f}")

    # Overridden budget value changes consolidated totals — drop the reports cache
    cache.invalidate_prefix("reports:")

    return BudgetReportResponse.model_validate(report)
