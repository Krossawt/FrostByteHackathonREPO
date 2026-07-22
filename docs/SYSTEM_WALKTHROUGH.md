# eSKala — System Walkthrough & Comprehensive Specification
**Santa Rosa City, Laguna · Sangguniang Kabataan Financial Transparency & Governance Portal**

---

## 1. Executive Summary & Meeting Specification Alignment

**eSKala** is the official web-based Sangguniang Kabataan (SK) financial transparency, project reporting, and citizen engagement system for the **City Government of Santa Rosa, Laguna**.

Governed by **Republic Act 10742** (*SK Reform Act of 2015*) as amended by **Republic Act 11768**, this specification reflects the **Final Meeting Agreement** for system modules, 6 user roles, 5-stage project approval workflows, finance MIS, OCR automation, audit trail, suggestion module, and database relationships.

---

## 2. Overall Design Concept & Visual Language

### 2.1 Design DNA (Inspired by Landing & Login Pages)
- **Sharp Geometry**: Professional, legal-grade aesthetics with sharp-cornered cards (`border-radius: 0`), clean panels, and structured borders (`var(--border)`).
- **Color Palette**:
  - **Primary Maroon**: `#760031` (Authority, governance, and brand core)
  - **Dark Maroon**: `#520022` & **Mid Maroon**: `#9a0040`
  - **Yellow Gold**: `#FEEC41` (Youth dynamism and highlights)
  - **Parchment Canvas**: `#F8F6F0` (Clean graph-paper background)
- **Interactive Ambient Effects**:
  - **Cursor-Reactive Background Glow**: Real-time radial gradient tracking cursor movements (`--cursor-x`, `--cursor-y`).
  - **Scroll-Reactive Parallax Layer**: Subtle movement of background gridlines as the user scrolls.

### 2.2 Global Navigation Header
- **4 Official Brand Logos**: `eSKalaLogo.svg` (Main Logo), `SantaRosa.svg` (City Seal), `CYDOlogo.svg` (City Youth Development Office), and `bagongPilipinasLogo.svg` (Bagong Pilipinas).
- **User Chip & Role Badge**: Displays active user name, barangay, and position (e.g., `Patricia · SK Chairperson`).
- **Super Admin Barangay Selector**: Top header dropdown for Super Admins to switch between managing specific barangay units or viewing the All-Barangay City Overview.
- **Log Out Button**: Instant session termination.

### 2.3 Global Footer
- Brand descriptor, legal version tag (`eSKala v1.0`), Santa Rosa CYDO contact address/phone/email, legal links (Terms & Conditions, Privacy Policy, RA 10742, Full Disclosure Policy), and compliance badges.

---

## 3. System Modules & 6 User Roles

### 3.1 The 6 System Roles
1. **Super Admin**: System administrator with full account creation, newsletter CRUD, and city-wide audit log oversight.
2. **SK Chairperson**: Creates projects, approves/rejects purchase orders, approves final projects for publication, and replies to comments.
3. **SK Secretary**: Creates projects, updates project details, submits projects to Treasurer, and replies to comments.
4. **SK Treasurer**: Adds financial breakdowns, purchase orders, uploads purchase order receipts, submits financial updates to Chairperson, and replies to comments.
5. **Guest (Citizen)**: Self-registered citizen of Santa Rosa City who views dashboards, submits project comments/suggestions, and replies to comments.
6. **System (Internal Automation)**: Automated background service handling OCR receipt scanning, annual budget report scanning, audit log generation, and newsletter publication upon project posting.

---

## 4. Module Specifications

### Module 1 — System Administrator & Account Management
- **Super Admin Permissions**:
  - Create SK Treasurer, Chairperson, Secretary, and Guest/Citizen accounts.
  - View all user accounts with barangay filtering.
  - Soft-delete or suspend user accounts (`userIsActive`, `userIsDeleted`).
  - Create, Read, Update, Archive Newsletter entries.

### Module 2 — Reports Module
- **Public & Universal Access**:
  - View Landing Page, Overall Dashboard, Selected Barangay Data, Project Details, Budget Breakdown, SK Officials (Current & Past), Santa Rosa History, eSKala History.
  - Export Project Financial Documents as ZIP archives.
- **Role Dashboards**:
  - Super Admin Dashboard (Citywide command).
  - Treasurer Dashboard (Finance & purchase orders).
  - Chairperson Dashboard (Approval queue & project overview).
  - Secretary Dashboard (Project drafting & submission queue).

### Module 3 — Finance MIS (Management Information System)
- **SK Treasurer**:
  - Upload Purchase Order Receipts (scanned via OCR).
  - Add Purchase Orders (Quantity, Unit Price, Total Amount, Order Name, Physical vs. Service order type).
  - Update Purchase Order Values.
- **SK Chairperson**:
  - Review purchase orders submitted by Treasurer.
  - Approve or Reject Purchase Orders.

### Module 4 — Automated OCR Module (System Role)
- **Automated Processing**:
  - System automatically scans uploaded Purchase Order Receipts to extract vendor, date, and price.
  - System automatically scans uploaded Annual Budget Reports to extract budget year, value, and barangay.
  - **Manual Override Capability**: Allows Treasurer/Chairperson to verify and correct machine OCR output.

### Module 5 — Audit Trail & System Activity
- **Super Admin**: View Newsletter CRUD logs and Account CRUD logs.
- **Universal Access**: View Account CRUD logs.
- **Automatic Audit Trigger**: Uploading Annual Budget Reports or modifying projects automatically creates immutable audit log entries.
- **Exporting**: Export audit logs to PDF/CSV for DILG/COA audit compliance.

### Module 6 — Suggestion & Community Feedback Module
- **Guest / Citizen**: Submit comments and project suggestions.
- **Universal Access**: View all comments.
- **Threaded Replies**: Chairperson, Secretary, Treasurer, and Citizens can reply to existing comments (using `parentCommentID`).

### Module 7 — Repository & Project 5-Stage Approval Workflow
- **Stage 1 (Drafted)**: Created by Chairperson or Secretary (`projectBreakdown = NULL`, `status = Drafted`).
- **Stage 2 (Finance Update)**: Chairperson or Secretary submits project to Treasurer (`status = Finance Update`).
- **Stage 3 (Finance Update)**: Treasurer adds purchase orders & `projectBreakdown` (`status = Finance Update`).
- **Stage 4 (For Approval)**: Treasurer submits project back to Chairperson (`status = For Approval`).
- **Stage 5 (Posted)**: Chairperson approves project (`status = Posted`).
  - **System Automation**: Automatically publishes project to public dashboard AND generates a Newsletter entry!

---

## 5. Mock Data Coverage (Santa Rosa City, Laguna)

The mock dataset (`frontend/src/data/mockData.ts`) covers **all 18 official barangays**:
1. Aplaya
2. Balibago
3. Caingin
4. Dila
5. Dita
6. Don Jose
7. Ibaba
8. Kanluran
9. Labas
10. Macabling
11. Malitlit
12. Malusak
13. Market Area
14. Pooc
15. Pulong Santa Cruz
16. Santo Domingo
17. Sinalhan
18. Tagapo
