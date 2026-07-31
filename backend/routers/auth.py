"""
eSKala — Auth Router
POST /api/v1/auth/login
POST /api/v1/auth/register
GET  /api/v1/auth/me
PATCH /api/v1/auth/users/me       (NEW - citizen profile update)
DELETE /api/v1/auth/users/me       (NEW - citizen account soft-delete)
POST /api/v1/auth/logout (client-side but endpoint for completeness)
"""

from collections import defaultdict
import time
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserRole, AuditLog
from schemas import UserLogin, UserRegister, Token, UserResponse, MessageResponse
from auth import (
    verify_password, hash_password, create_access_token,
    get_current_user, log_action,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
import os

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

FAILED_ATTEMPTS: dict[str, list[float]] = defaultdict(list)
LOCKOUT_THRESHOLD = 5
LOCKOUT_DURATION = 900  # 15 minutes in seconds

DUMMY_HASH = "$2b$12$e83W.D1yM/m1.5Q3b2Q7O.X8.G5g5.X8G5g5X8G5g5X8G5g5X8G5g"

def check_rate_limit(key: str):
    now = time.time()
    attempts = [t for t in FAILED_ATTEMPTS[key] if now - t < LOCKOUT_DURATION]
    FAILED_ATTEMPTS[key] = attempts
    if len(attempts) >= LOCKOUT_THRESHOLD:
        time_left = int(LOCKOUT_DURATION - (now - attempts[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Locked out for security. Please try again in {max(1, time_left // 60)} minutes.",
        )

def record_failed_attempt(key: str):
    FAILED_ATTEMPTS[key].append(time.time())

def clear_failed_attempts(key: str):
    FAILED_ATTEMPTS.pop(key, None)


@router.post("/login", response_model=Token, summary="Login and receive JWT")
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    credential = payload.credential.strip().lower()

    check_rate_limit(client_ip)
    check_rate_limit(credential)

    # Match by email or username
    user = (
        db.query(User)
        .filter(User.userEmail == credential, User.userIsDeleted == False)
        .first()
    )

    if not user:
        record_failed_attempt(client_ip)
        record_failed_attempt(credential)
        verify_password(payload.password, DUMMY_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not verify_password(payload.password, user.userHashedPassword):
        record_failed_attempt(client_ip)
        record_failed_attempt(credential)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.userIsActive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Contact your Super Admin.",
        )

    clear_failed_attempts(client_ip)
    clear_failed_attempts(credential)

    # Update last login timestamp
    user.lastLogin = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token = create_access_token(
        {"sub": str(user.userID), "role": user.userRole.value},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    log_action(db, user, "User Login", "auth", str(user.userID), f"{user.userName} logged in")

    return Token(
        accessToken=token,
        tokenType="Bearer",
        expiresIn=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED,
             summary="Self-register as a Citizen (Guest role)")
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.userEmail == payload.userEmail.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        userName=payload.userName,
        userEmail=payload.userEmail.lower(),
        userHashedPassword=hash_password(payload.password),
        userLocation=payload.userLocation,
        userIsStaRosa=payload.userIsStaRosa,
        userRole=UserRole.GUEST,
        userIsSK=False,
        userIsActive=True,
        userIsDeleted=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log (using a system user stand-in)
    entry = AuditLog(
        actorID=user.userID,
        actorName=user.userName,
        actorRole="Guest",
        barangay=user.userLocation,
        actionType="Account Registered",
        targetModule="accounts",
        targetID=str(user.userID),
        details=f"New citizen account created: {user.userEmail}",
    )
    db.add(entry)
    db.commit()

    token = create_access_token(
        {"sub": str(user.userID), "role": user.userRole.value},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return Token(
        accessToken=token,
        tokenType="Bearer",
        expiresIn=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user profile")
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


# ─── NEW ENDPOINTS FOR CITIZEN PROFILE MANAGEMENT ───────────────────────────

@router.patch("/users/me", response_model=UserResponse, 
              summary="Citizen: Update their own profile (name, barangay, photoURL)")
def update_my_profile(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allows authenticated citizen to update ONLY their own profile.
    Permitted fields: name, barangay, photoURL
    """
    # Only allow specific fields to be updated
    allowed_fields = {"name", "barangay", "photoURL"}
    
    # Extract only allowed fields from payload
    updates = {}
    for field in allowed_fields:
        if field in payload and payload[field] is not None:
            updates[field] = payload[field]
    
    # Map frontend field names to database column names
    if "name" in updates:
        current_user.userName = updates["name"]
    if "barangay" in updates:
        current_user.userLocation = updates["barangay"]
    if "photoURL" in updates:
        current_user.userProfilePicture = updates["photoURL"]
    
    # Save to database
    db.commit()
    db.refresh(current_user)
    
    # Log the action
    log_action(
        db, current_user, "Profile Updated", "users", 
        str(current_user.userID), 
        f"{current_user.userName} updated their profile"
    )
    
    return UserResponse.model_validate(current_user)


@router.delete("/users/me", response_model=MessageResponse,
               summary="Citizen: Soft-delete their own account")
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allows authenticated citizen to soft-delete their own account.
    Account is marked as deleted but NOT removed from database.
    Account is also deactivated.
    """
    # Soft delete: mark as deleted and inactive
    current_user.userIsDeleted = True
    current_user.userIsActive = False
    current_user.deletedAt = datetime.utcnow()
    
    db.commit()
    
    # Log the action
    log_action(
        db, current_user, "Account Deleted", "users",
        str(current_user.userID),
        f"Citizen {current_user.userName} soft-deleted their own account"
    )
    
    return {"message": "Your account has been deleted. We're sorry to see you go!"}


@router.post("/logout", response_model=MessageResponse, summary="Logout (client clears token)")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_action(db, current_user, "User Logout", "auth", str(current_user.userID),
               f"{current_user.userName} logged out")
    return {"message": "Logged out. Please delete the token on the client side."}
