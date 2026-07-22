"""
eSKala — Users / Accounts Router
Super Admin account management.
GET    /api/v1/admin/accounts
POST   /api/v1/admin/accounts
PATCH  /api/v1/admin/accounts/{id}
PATCH  /api/v1/admin/accounts/{id}/toggle-active
DELETE /api/v1/admin/accounts/{id}
GET    /api/v1/admin/accounts/{id}
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import User, UserRole
from schemas import AdminCreateUser, UserUpdate, UserResponse, MessageResponse
from auth import (
    hash_password, require_superadmin, require_authenticated,
    get_current_user, log_action
)

router = APIRouter(prefix="/api/v1/admin", tags=["Account Management"])


@router.get("/accounts", response_model=List[UserResponse], summary="List all user accounts")
def list_accounts(
    barangay: Optional[str] = Query(None, description="Filter by barangay"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    query = db.query(User).filter(User.userIsDeleted == False)

    if barangay:
        query = query.filter(User.userLocation == barangay)
    if role:
        query = query.filter(User.userRole == role)
    if is_active is not None:
        query = query.filter(User.userIsActive == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.userName.ilike(search_term)) | (User.userEmail.ilike(search_term))
        )

    users = query.offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/accounts/{user_id}", response_model=UserResponse, summary="Get a single user account")
def get_account(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    user = db.query(User).filter(User.userID == user_id, User.userIsDeleted == False).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)


@router.post("/accounts", response_model=UserResponse, status_code=status.HTTP_201_CREATED,
             summary="Super Admin: Create SK or Citizen account")
def create_account(
    payload: AdminCreateUser,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    existing = db.query(User).filter(User.userEmail == payload.userEmail.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        userName=payload.userName,
        userEmail=payload.userEmail.lower(),
        userHashedPassword=hash_password(payload.password),
        userRole=payload.userRole,
        userLocation=payload.userLocation,
        userIsStaRosa=payload.userIsStaRosa,
        userIsSK=payload.userIsSK or payload.userRole in {
            UserRole.CHAIRPERSON, UserRole.SECRETARY, UserRole.TREASURER
        },
        userSKTermStart=payload.userSKTermStart,
        userSKTermEnd=payload.userSKTermEnd,
        userIsActive=True,
        userIsDeleted=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_action(
        db, current_user,
        f"Account Created — {payload.userRole.value}",
        "accounts",
        str(user.userID),
        f"Super Admin created account for {user.userName} ({user.userEmail}) — role: {user.userRole.value}, barangay: {user.userLocation}",
    )

    return UserResponse.model_validate(user)


@router.patch("/accounts/{user_id}", response_model=UserResponse, summary="Update account details")
def update_account(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    user = db.query(User).filter(User.userID == user_id, User.userIsDeleted == False).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    log_action(db, current_user, "Account Updated", "accounts", str(user_id),
               f"Updated account for {user.userName}")

    return UserResponse.model_validate(user)


@router.patch("/accounts/{user_id}/toggle-active", response_model=UserResponse,
              summary="Super Admin: Suspend or reactivate account")
def toggle_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    user = db.query(User).filter(User.userID == user_id, User.userIsDeleted == False).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.userID == current_user.userID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot suspend your own account")

    user.userIsActive = not user.userIsActive
    db.commit()
    db.refresh(user)

    action = "Account Activated" if user.userIsActive else "Account Suspended"
    log_action(db, current_user, action, "accounts", str(user_id),
               f"{current_user.userName} {action.lower()} {user.userName}")

    return UserResponse.model_validate(user)


@router.delete("/accounts/{user_id}", response_model=MessageResponse,
               summary="Super Admin: Soft-delete account")
def delete_account(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    user = db.query(User).filter(User.userID == user_id, User.userIsDeleted == False).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.userID == current_user.userID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account")

    user.userIsDeleted = True
    user.userIsActive = False
    db.commit()

    log_action(db, current_user, "Account Deleted", "accounts", str(user_id),
               f"Soft-deleted account: {user.userName} ({user.userEmail})")

    return {"message": f"Account for {user.userName} has been deleted"}
