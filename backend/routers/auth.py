"""
eSKala — Auth Router
POST /api/v1/auth/login
POST /api/v1/auth/register
GET  /api/v1/auth/me
POST /api/v1/auth/logout (client-side but endpoint for completeness)
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
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


@router.post("/login", response_model=Token, summary="Login and receive JWT")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    credential = payload.credential.strip().lower()

    # Match by email or — for legacy compatibility — find by email containing @
    user = (
        db.query(User)
        .filter(User.userEmail == credential, User.userIsDeleted == False)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not verify_password(payload.password, user.userHashedPassword):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not user.userIsActive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Contact your Super Admin.",
        )

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


@router.post("/logout", response_model=MessageResponse, summary="Logout (client clears token)")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_action(db, current_user, "User Logout", "auth", str(current_user.userID),
               f"{current_user.userName} logged out")
    return {"message": "Logged out. Please delete the token on the client side."}
