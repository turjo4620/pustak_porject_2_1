-- Migration: add columns required by the Coupon Management feature
-- Run once against the pustak database.
-- All statements use IF NOT EXISTS / DO $$ guards so they are safe to re-run.

-- 1. discount_type  ('flat' | 'percentage')  — default 'flat' to keep existing rows valid
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS discount_type  VARCHAR(20)  DEFAULT 'flat'  NOT NULL;

-- 2. max_discount cap (applied when discount_type = 'percentage')
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS max_discount   DECIMAL(10,2);

-- 3. per_user_limit — how many times a single user may use this coupon
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS per_user_limit INTEGER DEFAULT 1;

-- 4. times_used — usage counter (replaces nothing; some schemas already have it)
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS times_used     INTEGER DEFAULT 0 NOT NULL;

-- 5. is_active boolean — replaces string status column in new code
--    Existing rows: treat status = 'Active' as true
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS is_active      BOOLEAN DEFAULT true NOT NULL;

DO $$
BEGIN
  -- Back-fill is_active from legacy status column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'status'
  ) THEN
    UPDATE coupons SET is_active = (status = 'Active') WHERE true;
  END IF;
END $$;

-- 6. created_at timestamp
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ DEFAULT NOW();

-- 7. coupon_code column on orders table (for per-user limit tracking)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_code    VARCHAR(50);
