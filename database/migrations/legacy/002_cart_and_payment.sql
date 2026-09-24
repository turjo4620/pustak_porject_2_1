-- Canonical cart setup.
-- This script is non-destructive and matches database/schema/schema.sql.

BEGIN;

ALTER TABLE cart
    ALTER COLUMN user_id TYPE bigint USING user_id::bigint;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'cart_user_id_fkey'
    ) THEN
        ALTER TABLE cart
            ADD CONSTRAINT cart_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_cart_item_cart_id
    ON cart_item(cart_id);

COMMIT;
