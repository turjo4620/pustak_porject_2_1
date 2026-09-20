-- ═══════════════════════════════════════════════════════════════
-- Migration 004 — Returns & Refunds
--
-- Fixes the FK reference (original schema said order_items but the
-- live table is order_item, singular) and adds a refunded_at
-- timestamp that was missing from the original draft.
--
-- Safe to run multiple times — all CREATE TABLE statements use
-- IF NOT EXISTS.
-- ═══════════════════════════════════════════════════════════════

-- ── returns ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns (
    return_id     SERIAL       PRIMARY KEY,
    order_item_id INTEGER      NOT NULL
                  REFERENCES order_item(order_item_id)   -- ← singular; live table name
                  ON DELETE CASCADE,
    user_id       INTEGER      NOT NULL
                  REFERENCES users(user_id)
                  ON DELETE CASCADE,
    reason        TEXT,
    request_date  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status        VARCHAR(50)  NOT NULL DEFAULT 'Requested',
    --   lifecycle: 'Requested' → 'Approved' | 'Rejected'
    approved_at   TIMESTAMP,
    quantity      INTEGER      NOT NULL DEFAULT 1,

    -- prevent duplicate return requests for the same order_item
    CONSTRAINT uq_return_order_item UNIQUE (order_item_id)
);

-- ── refunds ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refunds (
    refund_id    SERIAL       PRIMARY KEY,
    return_id    INTEGER      NOT NULL
                 REFERENCES returns(return_id)
                 ON DELETE CASCADE,
    payment_id   INTEGER      REFERENCES payments(payment_id),
    amount       DECIMAL(10, 2) NOT NULL,
    status       VARCHAR(50)  NOT NULL DEFAULT 'Pending',
    --   lifecycle: 'Pending' → 'Processed' | 'Failed'
    refunded_at  TIMESTAMP
);

-- ── indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_returns_user_id
    ON returns (user_id);

CREATE INDEX IF NOT EXISTS idx_returns_order_item_id
    ON returns (order_item_id);

CREATE INDEX IF NOT EXISTS idx_refunds_return_id
    ON refunds (return_id);
