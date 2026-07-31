-- =============================================================================
-- eSKala — Migration: Citizen Account Management Fields
-- Description : Adds userPhoneNumber and userAddress to the users table.
--               Both columns are nullable so existing rows are unaffected.
-- Target DB   : PostgreSQL (Supabase)
-- Run once    : Execute this file against your database manually, or via
--               your migration runner (Alembic / psql).
-- =============================================================================

-- ─── UP (apply) ───────────────────────────────────────────────────────────────

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS "userPhoneNumber" VARCHAR(30)  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "userAddress"     VARCHAR(255) DEFAULT NULL;

-- Verify
-- SELECT column_name, data_type, character_maximum_length
-- FROM   information_schema.columns
-- WHERE  table_name = 'users'
--   AND  column_name IN ('userPhoneNumber', 'userAddress');


-- ─── DOWN (rollback — run only if you need to undo) ───────────────────────────

-- ALTER TABLE users
--     DROP COLUMN IF EXISTS "userPhoneNumber",
--     DROP COLUMN IF EXISTS "userAddress";
