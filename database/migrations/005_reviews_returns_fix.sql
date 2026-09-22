-- Migration: align live DB with backend code for reviews + returns/refunds
-- Fixes: "সার্ভারে একটি সমস্যা হয়েছে" on book review submit and user-dashboard returns/refunds.
--
-- Root causes:
--   * reviews table was missing is_hidden (used by user + admin services) and a
--     date column (admin orders by it, frontend renders review_date).
--   * "return" table was missing approved_at (selected/set by returnService) and
--     had reason NOT NULL while the service treats reason as optional.

BEGIN;

-- ── reviews ────────────────────────────────────────────────────────────────
ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS is_hidden   BOOLEAN   NOT NULL DEFAULT FALSE;

ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS review_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── return ─────────────────────────────────────────────────────────────────
ALTER TABLE "return"
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- reason is optional in the API layer; drop the NOT NULL constraint
ALTER TABLE "return"
    ALTER COLUMN reason DROP NOT NULL;

COMMIT;
