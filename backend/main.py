"""
eSKala — FastAPI Application Entry Point
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from database import engine, Base
import models  # noqa: F401 — ensures all models are registered before create_all

# ─── Routers ──────────────────────────────────────────────────────────────────
from routers import auth, users, projects, purchase_orders, comments, newsletter, budget_reports, audit_logs, reports

load_dotenv()

# ─── Create tables ────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ─── Automatic Database Schema & Enum Migration ─────────────────────────────
from sqlalchemy import text

def _auto_migrate_schema():
    try:
        with engine.connect() as conn:
            # 1. Convert projectStatus column to VARCHAR(100) if it was created as PostgreSQL ENUM
            try:
                conn.execute(text('ALTER TABLE projects ALTER COLUMN "projectStatus" TYPE VARCHAR(100) USING "projectStatus"::varchar;'))
                conn.commit()
            except Exception as e:
                print("Note on column type migration:", e)

            # 2. Migrate any legacy row values to the new 3-status system
            try:
                conn.execute(text("UPDATE projects SET \"projectStatus\" = 'Incoming' WHERE \"projectStatus\" IN ('Drafted', 'Finance Update', 'For Approval');"))
                conn.execute(text("UPDATE projects SET \"projectStatus\" = 'Completed' WHERE \"projectStatus\" = 'Posted';"))
                conn.commit()
            except Exception as e:
                print("Note on row status migration:", e)
    except Exception as err:
        print("Note on DB migration connection:", err)

_auto_migrate_schema()

# ─── Static file directory for uploads ───────────────────────────────────────
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "static/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("static", exist_ok=True)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="eSKala API",
    description="""
## eSKala — Sangguniang Kabataan Financial Transparency Portal
**Santa Rosa City, Laguna**

Official REST API for eSKala — the SK financial transparency, project reporting, and citizen engagement system.

### Modules
- **Auth** — JWT login, citizen self-registration, token validation
- **Account Management** — Super Admin CRUD for all roles
- **Projects** — Full 5-stage approval workflow (Drafted → Finance Update → For Approval → Posted)
- **Finance MIS** — Purchase orders, receipt uploads with OCR scaffold
- **Comments** — Threaded citizen comments and suggestions
- **Newsletter** — Auto-generated on project posting + Super Admin manual entries
- **Annual Budget Reports** — OCR-assisted upload with manual override
- **Audit Trail** — Immutable activity log with PDF export (DILG/COA compliance)
- **Reports** — City-wide and per-barangay dashboard data

### Authentication
Use **Bearer Token** (JWT) in the `Authorization` header after logging in.

### Roles
`Super Admin` · `SK Chairperson` · `SK Secretary` · `SK Treasurer` · `Guest` · `System`
    """,
    version="1.0.0",
    contact={
        "name": "City Youth Development Office — Santa Rosa City",
        "email": "cydo@santarosacity.gov.ph",
    },
    license_info={
        "name": "RA 10742 — SK Reform Act of 2015",
        "url": "https://www.officialgazette.gov.ph/2016/01/15/republic-act-no-10742/",
    },
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://eskala.onrender.com")
ALLOWED_ORIGINS = [
    "*",
    FRONTEND_URL,
    "https://eskala.onrender.com",
    "https://frostbytehackathonrepo.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "https://eskala.ph",
    "https://www.eskala.ph",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|https://.*\.railway\.app|http://localhost:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global Exception Handler (Ensures CORS headers on 500 errors) ───────────
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"❌ [API ERROR 500] {request.method} {request.url.path}: {exc}")
    import traceback
    traceback.print_exc()
    response = JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )
    origin = request.headers.get("origin") or "*"
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# ─── Security & Logging Middleware ────────────────────────────────────────────
import time

@app.middleware("http")
async def security_and_logging_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = round((time.time() - start_time) * 1000, 2)

    # Security HTTP Response Headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

    print(f"-> [API Security] {request.method} {request.url.path} -> {response.status_code} ({duration}ms)")
    return response

# ─── Static Files (uploaded receipts, budget docs) ────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(purchase_orders.router)
app.include_router(comments.router)
app.include_router(newsletter.router)
app.include_router(budget_reports.router)
app.include_router(audit_logs.router)
app.include_router(reports.router)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "system": "eSKala API",
        "version": "1.0.0",
        "city": "Santa Rosa City, Laguna",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy", "database": "connected"}
