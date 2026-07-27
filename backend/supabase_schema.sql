-- =============================================================================
-- eSKala — 100% COMPLETE SUPABASE POSTGRESQL DDL & SEED SCRIPT
-- Sangguniang Kabataan Financial Transparency Portal (Santa Rosa City, Laguna)
-- Run this script in the Supabase SQL Editor to initialize the database.
-- =============================================================================

-- ─── 1. DROP EXISTING TABLES & ENUMS IF RE-INITIALIZING ───────────────────────
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS annual_budget_reports CASCADE;
DROP TABLE IF EXISTS newsletter CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS order_type CASCADE;
DROP TYPE IF EXISTS comment_type CASCADE;

-- ─── 2. ENUM TYPES ────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
    'Super Admin',
    'SK Chairperson',
    'SK Secretary',
    'SK Treasurer',
    'Guest',
    'System'
);

CREATE TYPE project_status AS ENUM (
    'Drafted',
    'Finance Update',
    'For Approval',
    'Posted'
);

CREATE TYPE order_type AS ENUM (
    'Physical',
    'Service'
);

CREATE TYPE comment_type AS ENUM (
    'comment',
    'suggestion'
);

-- ─── 3. TABLE: USERS ───────────────────────────────────────────────────────────
CREATE TABLE users (
    "userID"              SERIAL PRIMARY KEY,
    "userName"            VARCHAR(100) NOT NULL,
    "userEmail"           VARCHAR(150) UNIQUE NOT NULL,
    "userHashedPassword"  VARCHAR(255) NOT NULL,
    "userIsStaRosa"       BOOLEAN DEFAULT TRUE,
    "userLocation"        VARCHAR(100) NOT NULL, -- Barangay or City
    "userDateCreated"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "userUpdatedAt"       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "userProfilePicture"  VARCHAR(500) DEFAULT 'profile_picture.png',
    "userRole"            user_role NOT NULL DEFAULT 'Guest',
    "userIsSK"            BOOLEAN DEFAULT FALSE,
    "userSKTermStart"     DATE,
    "userSKTermEnd"       DATE,
    "userIsActive"        BOOLEAN DEFAULT TRUE,
    "userIsDeleted"       BOOLEAN DEFAULT FALSE,
    "lastLogin"           TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users("userEmail");
CREATE INDEX idx_users_location ON users("userLocation");

-- ─── 4. TABLE: PROJECTS ────────────────────────────────────────────────────────
CREATE TABLE projects (
    "projectID"           SERIAL PRIMARY KEY,
    "projectName"         VARCHAR(255) NOT NULL,
    "projectDescription"  TEXT,
    "projectStartTime"    TIMESTAMP WITH TIME ZONE NOT NULL,
    "projectEndTime"      TIMESTAMP WITH TIME ZONE NOT NULL,
    "projectLocation"     VARCHAR(100) NOT NULL, -- Barangay
    "projectCreatedBy"    INTEGER REFERENCES users("userID") ON DELETE SET NULL,
    "projectBreakdown"    NUMERIC(12, 2),        -- Total financial breakdown filled by Treasurer
    "projectBudget"       NUMERIC(12, 2),        -- Proposed budget from proposal
    "projectProgress"     INTEGER DEFAULT 0 CHECK ("projectProgress" >= 0 AND "projectProgress" <= 100),
    "projectCategory"     VARCHAR(100),
    "projectStatus"       project_status NOT NULL DEFAULT 'Drafted',
    "isDeleted"           BOOLEAN DEFAULT FALSE,
    "createdAt"           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_location ON projects("projectLocation");
CREATE INDEX idx_projects_status ON projects("projectStatus");

-- ─── 5. TABLE: PURCHASE ORDERS ─────────────────────────────────────────────────
CREATE TABLE purchase_orders (
    "orderID"             VARCHAR(100) PRIMARY KEY,
    "projectID"           INTEGER NOT NULL REFERENCES projects("projectID") ON DELETE CASCADE,
    "orderName"           VARCHAR(255) NOT NULL,
    "orderType"           order_type NOT NULL DEFAULT 'Physical',
    "orderQty"            NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
    "orderPrice"          NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "orderTotalPrice"     NUMERIC(12, 2),
    "receiptImageURL"     VARCHAR(500),
    "ocrExtractedAmount"  NUMERIC(12, 2),
    "isOCRScanned"        BOOLEAN DEFAULT FALSE,
    "isManuallyOverridden" BOOLEAN DEFAULT FALSE,
    "isApproved"          BOOLEAN,
    "approvedBy"          INTEGER REFERENCES users("userID") ON DELETE SET NULL,
    "createdAt"           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_project ON purchase_orders("projectID");

-- ─── 6. TABLE: ATTACHMENTS ─────────────────────────────────────────────────────
CREATE TABLE attachments (
    "attachfile_ID"       SERIAL PRIMARY KEY,
    "attachfile_for"      INTEGER NOT NULL REFERENCES projects("projectID") ON DELETE CASCADE,
    "attachFileLink"      VARCHAR(500) NOT NULL,
    "attachFileName"      VARCHAR(255),
    "attachFileType"      VARCHAR(50),
    "hasOrderID"          BOOLEAN DEFAULT FALSE,
    "orderID"             VARCHAR(100) REFERENCES purchase_orders("orderID") ON DELETE SET NULL,
    "createdAt"           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 7. TABLE: COMMENTS ────────────────────────────────────────────────────────
CREATE TABLE comments (
    "commentID"           SERIAL PRIMARY KEY,
    "commentFor"          INTEGER NOT NULL REFERENCES projects("projectID") ON DELETE CASCADE,
    "parentCommentID"     INTEGER REFERENCES comments("commentID") ON DELETE CASCADE,
    "authorID"            INTEGER NOT NULL REFERENCES users("userID") ON DELETE CASCADE,
    "commentName"         VARCHAR(150) NOT NULL,
    "commentDetails"      TEXT NOT NULL,
    "commentType"         comment_type DEFAULT 'comment',
    "votesCount"          INTEGER DEFAULT 0,
    "commentTimestamp"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_project ON comments("commentFor");

-- ─── 8. TABLE: NEWSLETTER ──────────────────────────────────────────────────────
CREATE TABLE newsletter (
    "newsletterID"        SERIAL PRIMARY KEY,
    "projectID"           INTEGER REFERENCES projects("projectID") ON DELETE CASCADE,
    "title"               VARCHAR(255) NOT NULL,
    "summary"             TEXT,
    "fullContent"         TEXT,
    "imageURL"            VARCHAR(500),
    "category"            VARCHAR(80) DEFAULT 'City News',
    "projectLocation"     VARCHAR(100),
    "projectBreakdown"    NUMERIC(12, 2),
    "authorID"            INTEGER REFERENCES users("userID") ON DELETE SET NULL,
    "isPublished"         BOOLEAN DEFAULT TRUE,
    "isDeleted"           BOOLEAN DEFAULT FALSE,
    "publishedAt"         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdAt"           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 9. TABLE: ANNUAL BUDGET REPORTS ───────────────────────────────────────────
CREATE TABLE annual_budget_reports (
    "budgetID"            SERIAL PRIMARY KEY,
    "budgetBarangay"      VARCHAR(100) NOT NULL,
    "budgetUploadedBy"    INTEGER REFERENCES users("userID") ON DELETE SET NULL,
    "budgetYear"          INTEGER NOT NULL,
    "budgetValue"         NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "budgetFileURL"       VARCHAR(500),
    "budgetUploadedOn"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "isOCRScanned"        BOOLEAN DEFAULT FALSE,
    "isManuallyOverridden" BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_annual_budget_brgy ON annual_budget_reports("budgetBarangay");

-- ─── 10. TABLE: AUDIT LOGS ─────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    "logID"               SERIAL PRIMARY KEY,
    "actorID"             INTEGER REFERENCES users("userID") ON DELETE SET NULL,
    "actorName"           VARCHAR(150) NOT NULL,
    "actorRole"           VARCHAR(80),
    "barangay"            VARCHAR(100),
    "actionType"          VARCHAR(150) NOT NULL,
    "targetModule"        VARCHAR(100) NOT NULL,
    "targetID"            VARCHAR(50),
    "details"             TEXT,
    "timestamp"           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs("timestamp" DESC);

-- =============================================================================
-- SEED DATA (ACCOUNTS & DEMO DATA)
-- Passwords hashed using PBKDF2 HMAC SHA-256 for universal compatibility
-- =============================================================================

-- 1. SUPER ADMIN ACCOUNT (Password: Admin2026!)
INSERT INTO users ("userID", "userName", "userEmail", "userHashedPassword", "userRole", "userLocation", "userIsStaRosa", "userIsSK", "userIsActive", "userIsDeleted")
VALUES (1, 'SCC Super Admin', 'superadmin@eskala.ph', 'pbkdf2:550f2dbf77c8e967a6d8959d287bb16a:d40608757048cfbbd12ae52f9b842944b5cf666dca0b1c0eaae69bbabac95f24', 'Super Admin', 'Santa Rosa City', TRUE, FALSE, TRUE, FALSE);

-- 2. SK CHAIRPERSON — BALIBAGO (Password: Sk2026!)
INSERT INTO users ("userID", "userName", "userEmail", "userHashedPassword", "userRole", "userLocation", "userIsStaRosa", "userIsSK", "userSKTermStart", "userSKTermEnd", "userIsActive", "userIsDeleted")
VALUES (2, 'Patricia Ann C. Dizon', 'padizon.balibago@sk.gov.ph', 'pbkdf2:550f2dbf77c8e967a6d8959d287bb16a:d40608757048cfbbd12ae52f9b842944b5cf666dca0b1c0eaae69bbabac95f24', 'SK Chairperson', 'Balibago', TRUE, TRUE, '2023-11-30', '2025-11-29', TRUE, FALSE);

-- 3. SK SECRETARY — BALIBAGO (Password: Sk2026!)
INSERT INTO users ("userID", "userName", "userEmail", "userHashedPassword", "userRole", "userLocation", "userIsStaRosa", "userIsSK", "userSKTermStart", "userSKTermEnd", "userIsActive", "userIsDeleted")
VALUES (3, 'Marco D. Villanueva', 'mvillanueva.balibago@sk.gov.ph', 'pbkdf2:550f2dbf77c8e967a6d8959d287bb16a:d40608757048cfbbd12ae52f9b842944b5cf666dca0b1c0eaae69bbabac95f24', 'SK Secretary', 'Balibago', TRUE, TRUE, '2023-11-30', '2025-11-29', TRUE, FALSE);

-- 4. SK TREASURER — BALIBAGO (Password: Sk2026!)
INSERT INTO users ("userID", "userName", "userEmail", "userHashedPassword", "userRole", "userLocation", "userIsStaRosa", "userIsSK", "userSKTermStart", "userSKTermEnd", "userIsActive", "userIsDeleted")
VALUES (4, 'Kristine P. Lim', 'klim.balibago@sk.gov.ph', 'pbkdf2:550f2dbf77c8e967a6d8959d287bb16a:d40608757048cfbbd12ae52f9b842944b5cf666dca0b1c0eaae69bbabac95f24', 'SK Treasurer', 'Balibago', TRUE, TRUE, '2023-11-30', '2025-11-29', TRUE, FALSE);

-- 5. SK CHAIRPERSON — CAINGIN (Password: Sk2026!)
INSERT INTO users ("userID", "userName", "userEmail", "userHashedPassword", "userRole", "userLocation", "userIsStaRosa", "userIsSK", "userSKTermStart", "userSKTermEnd", "userIsActive", "userIsDeleted")
VALUES (5, 'Diego A. Mercado', 'dmercado.caingin@sk.gov.ph', 'pbkdf2:550f2dbf77c8e967a6d8959d287bb16a:d40608757048cfbbd12ae52f9b842944b5cf666dca0b1c0eaae69bbabac95f24', 'SK Chairperson', 'Caingin', TRUE, TRUE, '2023-11-30', '2025-11-29', TRUE, FALSE);

-- 6. CITIZEN TEST ACCOUNT (Password: Citizen2026!)
INSERT INTO users ("userID", "userName", "userEmail", "userHashedPassword", "userRole", "userLocation", "userIsStaRosa", "userIsSK", "userIsActive", "userIsDeleted")
VALUES (6, 'Juan dela Cruz', 'citizen@eskala.ph', 'pbkdf2:550f2dbf77c8e967a6d8959d287bb16a:d40608757048cfbbd12ae52f9b842944b5cf666dca0b1c0eaae69bbabac95f24', 'Guest', 'Balibago', TRUE, FALSE, TRUE, FALSE);

-- Reset User ID Sequence
SELECT setval(pg_get_serial_sequence('users', 'userID'), COALESCE(MAX("userID"), 1)) FROM users;

-- 7. INITIAL PROJECTS (BALIBAGO & CAINGIN)
INSERT INTO projects ("projectID", "projectName", "projectDescription", "projectStartTime", "projectEndTime", "projectLocation", "projectCreatedBy", "projectBreakdown", "projectBudget", "projectProgress", "projectCategory", "projectStatus")
VALUES
(1, 'Linggo ng Kabataan 2025: Youth Leadership Summit', 'Annual celebration featuring youth empowerment workshops, sports competitions, talent night, and civic engagement seminars across all 7 sitio areas of Barangay Balibago.', '2025-08-12 08:00:00+00', '2025-08-18 17:00:00+00', 'Balibago', 2, 450000.00, 450000.00, 100, 'Capacity Building', 'Posted'),
(2, 'Project KALIKASAN: Coastal & Riverbank Clean-Up Drive', 'Community-led environmental protection initiative targeting Laguna de Bay tributaries in Caingin, combined with tree planting and solid waste management education.', '2025-09-06 06:00:00+00', '2025-09-06 14:00:00+00', 'Caingin', 5, 120000.00, 120000.00, 100, 'Environment', 'Posted'),
(3, 'Free College Entrance Exam (CEE) Review Classes', 'Weekend review sessions for underprivileged Santa Rosa youth preparing for UPCAT, PUPCET, and PLM entrance examinations, equipped with free review kits.', '2025-10-04 08:00:00+00', '2025-11-29 12:00:00+00', 'Balibago', 2, 180000.00, 200000.00, 85, 'Education', 'Posted');

SELECT setval(pg_get_serial_sequence('projects', 'projectID'), COALESCE(MAX("projectID"), 1)) FROM projects;

-- 8. INITIAL NEWSLETTER ANNOUNCEMENTS
INSERT INTO newsletter ("newsletterID", "projectID", "title", "summary", "fullContent", "category", "projectLocation", "projectBreakdown", "authorID", "isPublished")
VALUES
(1, 1, 'Balibago Youth Leadership Summit 2025 Successfully Concluded', 'Over 350 SK youth leaders participated in the 7-day civic engagement summit.', 'Barangay Balibago SK conducted its annual Linggo ng Kabataan with resounding success. Highlights included financial literacy workshops, sports leagues, and a youth policy forum.', 'Youth Programs', 'Balibago', 450000.00, 1, TRUE),
(2, 2, 'Caingin Riverbank Clean-Up Gathers 200+ Volunteers', '2.5 tons of plastic waste collected along Laguna de Bay tributaries.', 'The Sangguniang Kabataan of Barangay Caingin mobilized youth volunteers for Project KALIKASAN, successfully clearing waste and planting 300 mangrove saplings.', 'Environment', 'Caingin', 120000.00, 1, TRUE);

SELECT setval(pg_get_serial_sequence('newsletter', 'newsletterID'), COALESCE(MAX("newsletterID"), 1)) FROM newsletter;

-- 9. INITIAL AUDIT LOG
INSERT INTO audit_logs ("actorID", "actorName", "actorRole", "barangay", "actionType", "targetModule", "targetID", "details")
VALUES (1, 'SCC Super Admin', 'Super Admin', 'Santa Rosa City', 'System Initialized', 'system', '1', 'eSKala Supabase Database DDL Schema and Initial Seed Successfully Installed.');
