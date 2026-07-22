"""
eSKala — Database Configuration
Supports SQLite (dev) and PostgreSQL/Supabase (production).
Switch by changing DATABASE_URL in .env.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./eskala.db")

# ─── SQLite-specific pragmas for better concurrent performance ─────────────────
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=bool(os.getenv("DEBUG", "True") == "True"),
)

# Enable WAL mode for SQLite (allows concurrent reads with writes)
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: yields a database session and closes it after each request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
