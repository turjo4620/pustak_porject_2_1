
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
