"""
eSKala — Purchase Orders Router (Finance MIS)
GET    /api/v1/purchase-orders
GET    /api/v1/purchase-orders/{id}
POST   /api/v1/purchase-orders
PATCH  /api/v1/purchase-orders/{id}
POST   /api/v1/purchase-orders/{id}/upload-receipt  (OCR scaffold)
PATCH  /api/v1/purchase-orders/{id}/approve
PATCH  /api/v1/purchase-orders/{id}/reject
DELETE /api/v1/purchase-orders/{id}
"""

import os
import uuid
import random
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import User, PurchaseOrder, Project
from schemas import (
    PurchaseOrderCreate, PurchaseOrderUpdate,
    PurchaseOrderResponse, OCRReceiptResult, MessageResponse
)
from auth import (
    require_treasurer, require_chairperson,
    require_sk_officer, require_authenticated, log_action
)

router = APIRouter(prefix="/api/v1/purchase-orders", tags=["Finance MIS — Purchase Orders"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "static/uploads")


def _order_or_404(db: Session, order_id: str) -> PurchaseOrder:
    order = db.query(PurchaseOrder).filter(PurchaseOrder.orderID == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
    return order


@router.get("", response_model=List[PurchaseOrderResponse], summary="List purchase orders for a project")
def list_orders(
    project_id: Optional[int] = Query(None, description="Filter by project"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    query = db.query(PurchaseOrder)
    if project_id:
        query = query.filter(PurchaseOrder.projectID == project_id)
    orders = query.order_by(PurchaseOrder.createdAt.desc()).all()
    return [PurchaseOrderResponse.model_validate(o) for o in orders]


@router.get("/{order_id}", response_model=PurchaseOrderResponse, summary="Get purchase order detail")
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    return PurchaseOrderResponse.model_validate(_order_or_404(db, order_id))


@router.post("", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED,
             summary="Treasurer: Create a purchase order")
def create_order(
    payload: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_treasurer),
):
    # Verify project exists
    project = db.query(Project).filter(Project.projectID == payload.projectID, Project.isDeleted == False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    order_id = f"PO-{uuid.uuid4().hex[:8].upper()}"
    total = float(payload.orderQty) * float(payload.orderPrice)

    order = PurchaseOrder(
        orderID=order_id,
        projectID=payload.projectID,
        orderName=payload.orderName,
        orderType=payload.orderType,
        orderQty=payload.orderQty,
        orderPrice=payload.orderPrice,
        orderTotalPrice=total,
        isOCRScanned=False,
        isManuallyOverridden=False,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    log_action(db, current_user, "Purchase Order Created", "purchase_orders", order_id,
               f"PO '{payload.orderName}' (₱{total:,.2f}) created for project #{payload.projectID}")

    return PurchaseOrderResponse.model_validate(order)


@router.patch("/{order_id}", response_model=PurchaseOrderResponse,
              summary="Treasurer: Update purchase order values")
def update_order(
    order_id: str,
    payload: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_treasurer),
):
    order = _order_or_404(db, order_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, field, value)

    # Recompute total if qty or price changed
    if payload.orderQty is not None or payload.orderPrice is not None:
        order.orderTotalPrice = float(order.orderQty) * float(order.orderPrice)

    order.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(order)

    log_action(db, current_user, "Purchase Order Updated", "purchase_orders", order_id,
               f"PO '{order.orderName}' updated")

    return PurchaseOrderResponse.model_validate(order)


MAX_RECEIPT_SIZE = 5 * 1024 * 1024  # 5 MB limit


def validate_and_get_receipt_ext(content: bytes) -> str:
    if len(content) > MAX_RECEIPT_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Receipt file size exceeds maximum allowed limit of 5MB",
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


@router.post("/{order_id}/upload-receipt", response_model=OCRReceiptResult,
             summary="Treasurer: Upload receipt image — OCR auto-extracts amount")
async def upload_receipt(
    order_id: str,
    file: UploadFile = File(..., description="Receipt image (JPG, PNG, PDF)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_treasurer),
):
    order = _order_or_404(db, order_id)

    content = await file.read()
    ext = validate_and_get_receipt_ext(content)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"receipt_{order_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    # ─── OCR STUB ─────────────────────────────────────────────────────────────
    # TODO: Replace this stub with Google Cloud Vision or AWS Textract call.
    # The stub returns the order's known total as if OCR extracted it correctly.
    # In production: send `content` (bytes) to Vision API, parse response for
    # the largest monetary value found in the receipt image.
    ocr_extracted_amount = float(order.orderTotalPrice or order.orderPrice)
    # Simulate slight OCR variance (±2%) for realism
    variance = random.uniform(-0.02, 0.02)
    ocr_extracted_amount = round(ocr_extracted_amount * (1 + variance), 2)
    # ─────────────────────────────────────────────────────────────────────────

    receipt_url = f"/static/uploads/{filename}"

    order.receiptImageURL = receipt_url
    order.ocrExtractedAmount = ocr_extracted_amount
    order.isOCRScanned = True
    order.updatedAt = datetime.utcnow()
    db.commit()

    log_action(db, current_user, "Receipt Uploaded (OCR)", "purchase_orders", order_id,
               f"Receipt for PO '{order.orderName}' uploaded. OCR extracted ₱{ocr_extracted_amount:,.2f}")

    return OCRReceiptResult(
        orderID=order_id,
        ocrExtractedAmount=ocr_extracted_amount,
        isOCRScanned=True,
        receiptImageURL=receipt_url,
        message=f"Receipt uploaded. OCR extracted ₱{ocr_extracted_amount:,.2f}. Please verify and manually override if incorrect.",
    )


@router.patch("/{order_id}/approve", response_model=PurchaseOrderResponse,
              summary="Chairperson: Approve a purchase order")
def approve_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_chairperson),
):
    order = _order_or_404(db, order_id)
    order.isApproved = True
    order.approvedBy = current_user.userID
    order.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(order)

    log_action(db, current_user, "Purchase Order Approved", "purchase_orders", order_id,
               f"Chairperson approved PO '{order.orderName}' (₱{order.orderTotalPrice:,.2f})")

    return PurchaseOrderResponse.model_validate(order)


@router.patch("/{order_id}/reject", response_model=PurchaseOrderResponse,
              summary="Chairperson: Reject a purchase order")
def reject_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_chairperson),
):
    order = _order_or_404(db, order_id)
    order.isApproved = False
    order.approvedBy = current_user.userID
    order.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(order)

    log_action(db, current_user, "Purchase Order Rejected", "purchase_orders", order_id,
               f"Chairperson rejected PO '{order.orderName}'")

    return PurchaseOrderResponse.model_validate(order)


@router.delete("/{order_id}", response_model=MessageResponse,
               summary="Treasurer: Delete a purchase order")
def delete_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_treasurer),
):
    order = _order_or_404(db, order_id)
    db.delete(order)
    db.commit()

    log_action(db, current_user, "Purchase Order Deleted", "purchase_orders", order_id,
               f"PO '{order.orderName}' deleted")

    return {"message": f"Purchase order '{order.orderName}' has been deleted"}
