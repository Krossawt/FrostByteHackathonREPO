"""
eSKala — Authentication & RBAC
JWT creation, decoding, password hashing, and role-based dependency guards.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import hashlib
import hmac
import os

try:
    import bcrypt as _bcrypt
except ImportError:
    _bcrypt = None

from sqlalchemy.orm import Session
from database import get_db
from models import User, UserRole, AuditLog
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "eskala-dev-secret-key")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

bearer_scheme = HTTPBearer(auto_error=False)


# ─── PASSWORD UTILITIES ───────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    if _bcrypt is not None:
        return _bcrypt.hashpw(plain.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")
    # Fallback to standard library hashlib PBKDF2 HMAC if bcrypt is missing
    salt = os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac('sha256', plain.encode('utf-8'), salt, 100000)
    return f"pbkdf2:{salt.hex()}:{pw_hash.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    if hashed.startswith("pbkdf2:"):
        try:
            _, salt_hex, pw_hash_hex = hashed.split(":")
            salt = bytes.fromhex(salt_hex)
            expected_hash = bytes.fromhex(pw_hash_hex)
            actual_hash = hashlib.pbkdf2_hmac('sha256', plain.encode('utf-8'), salt, 100000)
            return hmac.compare_digest(actual_hash, expected_hash)
        except Exception:
            return False
    if _bcrypt is not None:
        try:
            return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
        except Exception:
            return False
    return False


# ─── JWT UTILITIES ────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ─── CURRENT USER DEPENDENCY ──────────────────────────────────────────────────

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.query(User).filter(User.userID == int(user_id), User.userIsDeleted == False).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.userIsActive:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended")
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Returns None for unauthenticated requests — used on public endpoints."""
    if not credentials:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None


# ─── RBAC DEPENDENCY GUARDS ───────────────────────────────────────────────────

def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.userRole != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super Admin access required")
    return current_user


def require_sk_officer(current_user: User = Depends(get_current_user)) -> User:
    """Allows Chairperson, Secretary, Treasurer, or Super Admin."""
    allowed = {UserRole.CHAIRPERSON, UserRole.SECRETARY, UserRole.TREASURER, UserRole.SUPER_ADMIN}
    if current_user.userRole not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="SK Officer access required")
    return current_user


def require_chairperson_or_secretary(current_user: User = Depends(get_current_user)) -> User:
    allowed = {UserRole.CHAIRPERSON, UserRole.SECRETARY, UserRole.SUPER_ADMIN}
    if current_user.userRole not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="SK Chairperson or Secretary required")
    return current_user


def require_chairperson(current_user: User = Depends(get_current_user)) -> User:
    allowed = {UserRole.CHAIRPERSON, UserRole.SUPER_ADMIN}
    if current_user.userRole not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="SK Chairperson access required")
    return current_user


def require_treasurer(current_user: User = Depends(get_current_user)) -> User:
    allowed = {UserRole.TREASURER, UserRole.SUPER_ADMIN}
    if current_user.userRole not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="SK Treasurer access required")
    return current_user


def require_authenticated(current_user: User = Depends(get_current_user)) -> User:
    return current_user


# ─── AUDIT LOG HELPER ─────────────────────────────────────────────────────────

def log_action(
    db: Session,
    actor: User,
    action_type: str,
    target_module: str,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
):
    """Creates an immutable audit log entry. Call after any state-changing operation."""
    entry = AuditLog(
        actorID=actor.userID,
        actorName=actor.userName,
        actorRole=actor.userRole.value,
        barangay=actor.userLocation,
        actionType=action_type,
        targetModule=target_module,
        targetID=str(target_id) if target_id else None,
        details=details,
    )
    db.add(entry)
    db.commit()
