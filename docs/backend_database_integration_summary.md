# eSKala — Backend & Supabase Database Integration Summary

**Project**: Sangguniang Kabataan Financial Transparency Portal (Santa Rosa City, Laguna)  
**Date**: July 27, 2026  
**Status**: 100% Live Backend & Supabase Database Connected & Verified  

---

## 1. Overview & Architecture

The eSKala system is fully integrated with a Python **FastAPI** REST backend and a live **Supabase PostgreSQL** cloud database. The architecture enforces strict Role-Based Access Control (RBAC) across four distinct roles: **Super Admin**, **SK Chairperson**, **SK Secretary**, **SK Treasurer**, and **Citizen (Guest)**.

```
┌─────────────────────────────────────────────────────────────┐
│                 React + TypeScript Frontend                 │
│                      (Port 5173 / Vite)                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST HTTP (JWT Auth)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Python Backend                   │
│                      (Port 8000 / Uvicorn)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQLAlchemy ORM / psycopg2
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Supabase Cloud PostgreSQL DB                 │
│               (Port 6543 / Session Pooler)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Supabase PostgreSQL Schema & Database Configuration

- **Database Provider**: Supabase PostgreSQL (`PostgreSQL 17.6 on aarch64`)
- **Connection Mode**: Session Pooler on Port `6543` with `sslmode=require`
- **Schema Location**: `backend/supabase_schema.sql`

### Database Tables Summary

1. **`users`**: User profiles, roles (`Super Admin`, `SK Chairperson`, `SK Secretary`, `SK Treasurer`, `Guest`), password hashes (PBKDF2/bcrypt), term dates, and barangay affiliations.
2. **`projects`**: SK projects across 5 lifecycle stages (`Drafted` $\rightarrow$ `Finance Update` $\rightarrow$ `For Approval` $\rightarrow$ `Posted`), budget breakdowns, category tags, and progress percentages.
3. **`purchase_orders`**: Itemized physical and service order disbursements linked to projects, receipt upload URLs, OCR extracted amounts, and manual override tracking.
4. **`annual_budget_reports`**: Annual Barangay Youth Investment Program (ABYIP) budget postings by Barangay and Year.
5. **`comments`**: Threaded citizen feedback and suggestions on posted projects with upvoting functionality.
6. **`newsletter`**: Public announcements and project updates automatically published or posted by Super Admin.
7. **`attachments`**: Files and document attachments linked to project proposals and purchase orders.
8. **`audit_logs`**: Immutable, system-wide security audit trail tracking every action, user login, and document submission across Santa Rosa City.

---

## 3. Seed State & Initial Account Credentials

The database has been cleanly reset to contain **ONLY the mandatory Super Admin account**, allowing the Super Admin to provision SK officer accounts while permitting citizens to register publicly.

### Super Admin Credentials
| Field | Value |
| :--- | :--- |
| **Role** | `Super Admin` |
| **Email** | `superadmin@eskala.ph` |
| **Username** | `superadmin` |
| **Password** | `Admin2026!` |

---

## 4. API Endpoints & RBAC Security Summary

| Endpoint | Method | Role Access | Description |
| :--- | :---: | :---: | :--- |
| `/api/v1/auth/login` | `POST` | Public | Issue JWT access token for valid credentials |
| `/api/v1/auth/register` | `POST` | Public | Self-registration for Santa Rosa City citizens |
| `/api/v1/auth/me` | `GET` | Authenticated | Validate current JWT session and return profile |
| `/api/v1/users` | `GET` / `POST` | Super Admin | List all accounts or create new SK officer accounts |
| `/api/v1/users/{id}` | `PATCH` | Super Admin | Suspend, reactivate, or soft-delete accounts |
| `/api/v1/projects` | `GET` | Public | List posted projects (Citizens see ONLY `Posted` status) |
| `/api/v1/projects` | `POST` | SK Chair / Sec | Create new project proposal draft |
| `/api/v1/purchase-orders` | `POST` | SK Treasurer | Add itemized purchase order & receipt breakdown |
| `/api/v1/budget-reports` | `POST` | Super Admin | Post approved ABYIP budget for a specific barangay |
| `/api/v1/comments` | `GET` / `POST` | Public / Citizen | Threaded comments & suggestions on posted projects |
| `/api/v1/comments/{id}/vote` | `POST` | Citizen | Upvote citizen suggestion |
| `/api/v1/reports/summary` | `GET` | Public | Executive city-wide and per-barangay summary |
| `/api/v1/audit-logs` | `GET` | Super Admin | System audit trail log retrieval |

---

## 5. Frontend Integration & Service Layer

- **`frontend/src/services/api.ts`**: Unified HTTP client using native `fetch` with automatic Bearer token injection from `localStorage` / `sessionStorage`.
- **`frontend/src/services/auth.ts`**: Asynchronous authentication service handling login, registration, token persistence, and role redirection.
- **Page Integration**:
  - `SuperAdminHome.tsx`: Live executive summary fetching, barangay budget utilization, live audit logs, and live ABYIP posting.
  - `SKProjects.tsx`: Live project draft creation and status tracking.
  - `CitizenHome.tsx`: Live barangay financial summary and project browsing for citizens.
  - `Register.tsx`: Live citizen registration with backend verification.

---

## 6. How to Run Locally

### 1. Start FastAPI Backend
```powershell
c:\MyProjects\eSKala\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

### 2. Start Vite Frontend
```powershell
npm run dev
```

---

## 7. Verification Results

Automated backend test suite (`test_backend.py`) execution against live Supabase PostgreSQL:
- **11 Passed, 0 Failed**
- Frontend production compilation (`npm run build`): **✓ Built cleanly with 0 errors**.
