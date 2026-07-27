"""
eSKala — Clean Database Seed Script
Seeds ONLY the mandatory Super Admin account into the database.
Run: python seed.py
"""

import sys
import os
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
from models import User, UserRole, AuditLog
from auth import hash_password

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Check if Super Admin already exists
        super_admin = db.query(User).filter(User.userEmail == "superadmin@eskala.ph").first()
        if not super_admin:
            super_admin = User(
                userName="SCC Super Admin",
                userEmail="superadmin@eskala.ph",
                userHashedPassword=hash_password("Admin2026!"),
                userRole=UserRole.SUPER_ADMIN,
                userLocation="Santa Rosa City",
                userIsStaRosa=True,
                userIsSK=False,
                userIsActive=True,
                userIsDeleted=False,
            )
            db.add(super_admin)
            db.flush()

            # Add initial audit log
            entry = AuditLog(
                actorID=super_admin.userID,
                actorName=super_admin.userName,
                actorRole="Super Admin",
                barangay="Santa Rosa City",
                actionType="System Initialized",
                targetModule="system",
                targetID=str(super_admin.userID),
                details="eSKala System Initialized with Clean Super Admin Account.",
            )
            db.add(entry)
            db.commit()
            print("✔ Clean Super Admin Account Created: superadmin@eskala.ph / Admin2026!")
        else:
            print("✔ Super Admin Account already present.")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
