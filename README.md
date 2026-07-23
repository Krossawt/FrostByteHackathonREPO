<div align="center">

# 🏛️ eSKala
### **Sangguniang Kabataan Financial Transparency & Governance Portal**
*Santa Rosa City, Laguna · Republic of the Philippines*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.1-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00.svg?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Compliance](https://img.shields.io/badge/Compliance-RA%2010742%20%7C%20RA%2011768-760031.svg?style=for-the-badge)](https://www.officialgazette.gov.ph/2016/01/15/republic-act-no-10742/)

---

**eSKala** is the official web-based Sangguniang Kabataan (SK) financial transparency, project reporting, and citizen engagement platform for the **City Government of Santa Rosa, Laguna**.

Designed in compliance with **Republic Act 10742** (*SK Reform Act of 2015*) as amended by **Republic Act 11768**, eSKala bridges local youth governance and public accountability through automated financial workflows, receipt OCR verification, immutable audit logs, and direct citizen feedback.

</div>

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [System User Roles](#-system-user-roles)
- [5-Stage Project Approval Workflow](#-5-stage-project-approval-workflow)
- [Design DNA & Visual Language](#-design-dna--visual-language)
- [Tech Stack & Architecture](#-tech-stack--architecture)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Seeding](#database-seeding)
- [Pre-Seeded Test Credentials](#-pre-seeded-test-credentials)
- [API Documentation](#-api-documentation)
- [Barangay Coverage](#-barangay-coverage)
- [System Documentation](#-system-documentation)
- [Team & Acknowledgments](#-team--acknowledgments)

---

## ✨ Key Features

- 📊 **Financial MIS & Budget Tracking**: Real-time tracking of SK project budgets, line-item allocations, and purchase order expenditures.
- 🤖 **Automated OCR Scanning**: Intelligent OCR processing for Purchase Order receipts and Annual Budget Reports with built-in manual verification/override.
- 🔄 **5-Stage Approval Lifecycle**: Structured workflow ensuring multi-role checks from initial draft to final executive posting.
- 🛡️ **Immutable Audit Trail**: Automatic logging of system activities, budget uploads, and account changes with PDF export for DILG/COA audit compliance.
- 💬 **Citizen Feedback & Suggestions**: Interactive community feedback module with nested, multi-tier replies connecting youth constituents and SK officials.
- 📰 **Automated Newsletter Engine**: Automatic newsletter publication whenever a project reaches the final `Posted` stage, alongside Super Admin manual press releases.
- 🗺️ **Full 18 Barangay Coverage**: Comprehensive data modeling for all 18 official barangays of Santa Rosa City.

---

## 👥 System User Roles

| Role | Badge | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | `Super Admin` | Citywide administration, account creation/management, newsletter CRUD, full audit trail oversight, and barangay switching. |
| **SK Chairperson** | `Chairperson` | Project initiation, purchase order review (approve/reject), final executive publication approval, citizen engagement. |
| **SK Secretary** | `Secretary` | Project drafting, documentation management, submitting projects to Treasurer for financial setup. |
| **SK Treasurer** | `Treasurer` | Financial breakdowns, purchase order management, receipt uploading with OCR processing, budget submissions. |
| **Guest / Citizen** | `Citizen` | Self-registration, public dashboard viewing, project budget exploration, suggestion submission, ZIP report export. |
| **System Automation** | `System` | Automated background service handling receipt/budget OCR scanning, audit trail generation, and newsletter auto-posting. |

---

## 🔄 5-Stage Project Approval Workflow

eSKala enforces a strict 5-stage lifecycle to guarantee transparency and financial integrity:

```mermaid
flowchart LR
    A[Stage 1: Drafted] -->|Submitted by Secretary/Chair| B[Stage 2: Finance Update]
    B -->|Treasurer adds Purchase Orders| C[Stage 3: Finance Complete]
    C -->|Submitted for Review| D[Stage 4: For Approval]
    D -->|Chairperson Approves| E[Stage 5: Posted]
    E --> F[Public Dashboard]
    E --> G[Auto-Newsletter Post]

    style A fill:#f9f9f9,stroke:#333,stroke-width:1px
    style B fill:#e1f5fe,stroke:#0288d1,stroke-width:1px
    style C fill:#fff9c4,stroke:#fbc02d,stroke-width:1px
    style D fill:#ffe0b2,stroke:#f57c00,stroke-width:1px
    style E fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    style F fill:#760031,stroke:#520022,stroke-width:2px,color:#fff
    style G fill:#feec41,stroke:#fbc02d,stroke-width:2px,color:#000
```

1. **Stage 1 — Drafted**: Project concept initiated by SK Chairperson or SK Secretary.
2. **Stage 2 — Sent to Finance**: Project routed to SK Treasurer for cost breakdown.
3. **Stage 3 — Finance Update**: SK Treasurer attaches itemized purchase orders and uploads scanned receipts.
4. **Stage 4 — For Approval**: Financial package submitted back to SK Chairperson for review.
5. **Stage 5 — Posted**: Chairperson grants final approval. The project is published to the citizen dashboard and automatically creates a public newsletter post.

---

## 🎨 Design DNA & Visual Language

eSKala features a modern, legal-grade visual design tailored for public administration:

- **Primary Colors**:
  - 🟥 **Primary Maroon** (`#760031`): Executive authority and civic brand core.
  - 🍷 **Dark Maroon** (`#520022`) & **Mid Maroon** (`#9a0040`)
  - 🟨 **Yellow Gold** (`#FEEC41`): Highlights, call-to-actions, and youth energy.
  - 📜 **Parchment Canvas** (`#F8F6F0`): Clean, graph-paper inspired background texture.
- **Aesthetic Elements**:
  - **Sharp Geometry**: Flat, crisp corners (`border-radius: 0`) reflecting official legal document aesthetics.
  - **Cursor-Reactive Glow**: Interactive radial light tracking user movement in real-time.
  - **Parallax Scroll Effects**: Subtle movement of structural gridlines as users scroll through reports.
  - **Official Seals**: Embedded logos for eSKala, City of Santa Rosa, CYDO, and Bagong Pilipinas.

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router DOM v6
- **Styling**: Vanilla CSS Design Tokens, CSS Grid/Flexbox, Custom Radial Trackers
- **Icons & Assets**: Native SVG iconography & official Santa Rosa seals

### **Backend**
- **Framework**: Python 3.10+ with FastAPI
- **Web Server**: Uvicorn (ASGI)
- **Database ORM**: SQLAlchemy 2.0
- **Database Engine**: SQLite (Development) / PostgreSQL (Production ready)
- **Security & Auth**: OAuth2 with Password Hashing (Bcrypt) & PyJWT
- **Document Processing**: ReportLab (PDF Export Generation) & OCR Engine
- **Validation**: Pydantic v2 & Email Validator

---

## 📁 Repository Structure

```text
FrostByteHackathonREPO/
├── backend/                  # FastAPI Application Source Code
│   ├── main.py               # Application Entry Point & Middleware Configuration
│   ├── database.py           # Database Connection & Session Management
│   ├── models.py             # SQLAlchemy ORM Models (Users, Projects, Audit, etc.)
│   ├── schemas.py            # Pydantic Request/Response Validation Schemas
│   ├── auth.py               # Password Hashing & JWT Authentication Utilities
│   ├── seed.py               # Full 18-Barangay Comprehensive Seed Data Script
│   ├── routers/              # Modular API Route Handlers
│   │   ├── auth.py           # Auth Endpoints (/auth/login, /auth/register)
│   │   ├── users.py          # User CRUD & Account Management
│   │   ├── projects.py       # 5-Stage Project Workflow Endpoints
│   │   ├── purchase_orders.py# Finance MIS & Receipt Handling
│   │   ├── comments.py       # Threaded Community Suggestions
│   │   ├── newsletter.py     # Public & Admin News Announcements
│   │   ├── budget_reports.py # OCR Annual Budget Uploads
│   │   ├── audit_logs.py     # System Audit Log & PDF Exports
│   │   └── reports.py        # Citywide & Barangay Dashboard Aggregations
│   ├── static/               # Uploaded Receipts & Generated PDF Exports
│   ├── requirements.txt      # Python Dependencies
│   └── .env.example          # Environment Variables Template
├── frontend/                 # React + Vite Frontend Source Code
│   ├── src/
│   │   ├── main.tsx          # React Root Initialization
│   │   ├── App.tsx           # Router Configuration & Layout Provider
│   │   ├── index.css         # Global Design System Tokens & CSS Variables
│   │   ├── pages/            # View Components (Landing, Dashboards, SK Home, etc.)
│   │   ├── components/       # Shared UI Components (Header, Footer, Cards, Modals)
│   │   ├── data/             # Mock Datasets for Standalone Frontend Operations
│   │   ├── services/         # API Client Services & HTTP Fetchers
│   │   └── types.ts          # TypeScript Type Definitions
│   ├── package.json          # Frontend Dependencies & NPM Scripts
│   └── vite.config.ts        # Vite Server & Build Settings
├── docs/                     # Comprehensive System Specifications
│   ├── SYSTEM_WALKTHROUGH.md # Full Specification & Meeting Agreement Alignment
│   ├── DATABASE_ERD.md       # Relational Schema & Entity Relationship Diagram
│   └── BACKEND_INTEGRATION_GUIDE.md # Frontend-to-Backend Integration Guide
└── README.md                 # Project README File
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.0 or higher) & **npm**
- **Python** (v3.10 or higher) & **pip**
- **Git**

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

5. **Seed the database** (Populates all 18 Barangays, 54+ SK Officials, and mock projects):
   ```bash
   python seed.py
   ```

6. **Start the FastAPI server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will be live at `http://localhost:8000`.

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Launch the Vite development server**:
   ```bash
   npm run dev
   ```
   The frontend application will be live at `http://localhost:5173`.

---

## 🔑 Pre-Seeded Test Credentials

When the database is populated via `python seed.py`, the following test accounts become available:

| Role | Barangay / Context | Email Login | Default Password |
| :--- | :--- | :--- | :--- |
| 🛡️ **Super Admin** | Citywide Command | `superadmin@eskala.ph` | `Admin2026!` |
| 👑 **SK Chairperson** | Barangay Balibago | `padizon.balibago@sk.gov.ph` | `Chairperson2026!` |
| 📝 **SK Secretary** | Barangay Balibago | `mvillanueva.balibago@sk.gov.ph` | `Secretary2026!` |
| 💰 **SK Treasurer** | Barangay Balibago | `klim.balibago@sk.gov.ph` | `Treasurer2026!` |
| 🙋 **Guest / Citizen** | Citizen Account | `citizen@eskala.ph` | `Citizen2026!` |

> *Note: Credentials are pre-configured for testing all user roles across any of the 18 barangays.*

---

## 📚 API Documentation

Once the backend is running, interactive API documentation is automatically served at:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints Summary

- **Authentication**: `POST /auth/login`, `POST /auth/register`
- **Projects**: `GET /projects/`, `POST /projects/`, `PUT /projects/{id}`, `PATCH /projects/{id}/status`
- **Purchase Orders**: `GET /purchase-orders/`, `POST /purchase-orders/`, `POST /purchase-orders/upload-receipt`
- **Audit Logs**: `GET /audit-logs/`, `GET /audit-logs/export-pdf`
- **Reports**: `GET /reports/summary`, `GET /reports/barangay/{name}`
- **Newsletter**: `GET /newsletter/`, `POST /newsletter/`

---

## 📍 Barangay Coverage

eSKala supports all **18 Official Barangays** of Santa Rosa City, Laguna:

| | | |
| :--- | :--- | :--- |
| 📍 **Aplaya** | 📍 **Don Jose** | 📍 **Market Area** |
| 📍 **Balibago** | 📍 **Ibaba** | 📍 **Pooc** |
| 📍 **Caingin** | 📍 **Kanluran** | 📍 **Pulong Santa Cruz** |
| 📍 **Dila** | 📍 **Labas** | 📍 **Santo Domingo** |
| 📍 **Dita** | 📍 **Macabling** | 📍 **Sinalhan** |
| 📍 **Malitlit** | 📍 **Malusak** | 📍 **Tagapo** |

---

## 📄 System Documentation

For detailed architectural specs, data modeling, and integration standards, refer to the [`/docs`](file:///c:/Users/redaa/FrostByteHackathonREPO/docs) directory:

- 📖 [**SYSTEM_WALKTHROUGH.md**](file:///c:/Users/redaa/FrostByteHackathonREPO/docs/SYSTEM_WALKTHROUGH.md) — Comprehensive specification, design DNA, and feature matrix.
- 🗄️ [**DATABASE_ERD.md**](file:///c:/Users/redaa/FrostByteHackathonREPO/docs/DATABASE_ERD.md) — Complete Entity-Relationship Diagram and SQL schema details.
- 🔌 [**BACKEND_INTEGRATION_GUIDE.md**](file:///c:/Users/redaa/FrostByteHackathonREPO/docs/BACKEND_INTEGRATION_GUIDE.md) — REST API integration guide & data mapping rules.

---

## 🏆 Team & Acknowledgments

Developed with pride by **TEAM-MANG** for the **FrostByte Hackathon / Quintet Hackathon**.

Special thanks to:
- **City Government of Santa Rosa, Laguna**
- **City Youth Development Office (CYDO)**
- **Sangguniang Kabataan Federation of Santa Rosa**

---

<div align="center">
  <sub>Built with ❤️ for Youth Governance and Transparency · <strong>eSKala v1.0</strong></sub>
</div>
