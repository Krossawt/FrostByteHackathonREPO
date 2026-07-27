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

# Normalize Heroku / Supabase postgres:// scheme to postgresql:// for SQLAlchemy 2.0
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# ─── SQLite vs PostgreSQL engine parameters ────────────────────────────────────
connect_args = {}
engine_kwargs = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL / Supabase connection pooling & SSL configuration
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,  # Auto-reconnect dropped pooled connections
    })

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=bool(os.getenv("DEBUG", "False") == "True"),
    **engine_kwargs
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
