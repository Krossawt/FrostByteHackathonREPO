"""
eSKala — Audit Logs Router (Immutable Activity Trail)
GET /api/v1/audit-logs            (authenticated users)
GET /api/v1/audit-logs/export     (Super Admin — PDF download)
"""

import io
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, AuditLog
from schemas import AuditLogResponse
from auth import require_authenticated, require_superadmin

router = APIRouter(prefix="/api/v1/audit-logs", tags=["Audit Trail"])


@router.get("", response_model=List[AuditLogResponse], summary="View system audit trail")
def list_audit_logs(
    module: Optional[str] = Query(None, description="Filter by target module"),
    actor_id: Optional[int] = Query(None, description="Filter by actor user ID"),
    barangay: Optional[str] = Query(None),
    action_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    query = db.query(AuditLog)

    if module:
        query = query.filter(AuditLog.targetModule == module)
    if actor_id:
        query = query.filter(AuditLog.actorID == actor_id)
    if barangay:
        query = query.filter(AuditLog.barangay == barangay)
    if action_type:
        query = query.filter(AuditLog.actionType.ilike(f"%{action_type}%"))

    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return [AuditLogResponse.model_validate(log) for log in logs]


@router.get("/export", summary="Super Admin: Export audit logs as PDF (DILG/COA compliance)")
def export_audit_logs_pdf(
    module: Optional[str] = Query(None),
    barangay: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """
    Exports audit logs to a formatted PDF report for DILG/COA compliance.
    Requires reportlab. Falls back to plain CSV if reportlab unavailable.
    """
    query = db.query(AuditLog)
    if module:
        query = query.filter(AuditLog.targetModule == module)
    if barangay:
        query = query.filter(AuditLog.barangay == barangay)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    try:
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                                rightMargin=1*cm, leftMargin=1*cm,
                                topMargin=1.5*cm, bottomMargin=1*cm)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph("eSKala — System Audit Trail Report", styles["Title"]))
        elements.append(Paragraph(
            f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | "
            f"By: {current_user.userName} ({current_user.userRole.value})",
            styles["Normal"]
        ))
        elements.append(Spacer(1, 0.5*cm))

        # Table
        headers = ["#", "Timestamp", "Actor", "Role", "Barangay", "Action", "Module", "Details"]
        data = [headers]
        for i, log in enumerate(logs, 1):
            data.append([
                str(i),
                log.timestamp.strftime("%Y-%m-%d %H:%M") if log.timestamp else "—",
                log.actorName or "System",
                log.actorRole or "—",
                log.barangay or "—",
                log.actionType or "—",
                log.targetModule or "—",
                (log.details or "")[:80],
            ])

        table = Table(data, colWidths=[0.6*cm, 3.2*cm, 3.5*cm, 3*cm, 2.5*cm, 4*cm, 2.5*cm, 8*cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#760031")),
            ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",   (0, 0), (-1, -1), 7),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FFF8F4")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("WORDWRAP", (7, 1), (7, -1), True),
        ]))
        elements.append(table)

        doc.build(elements)
        buffer.seek(0)

        filename = f"eskala_audit_log_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    except ImportError:
        # Fallback: return CSV if reportlab not available
        import csv
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp", "Actor", "Role", "Barangay", "Action", "Module", "Target ID", "Details"])
        for log in logs:
            writer.writerow([
                log.logID,
                log.timestamp.isoformat() if log.timestamp else "",
                log.actorName,
                log.actorRole or "",
                log.barangay or "",
                log.actionType,
                log.targetModule,
                log.targetID or "",
                log.details or "",
            ])

        output.seek(0)
        filename = f"eskala_audit_log_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
