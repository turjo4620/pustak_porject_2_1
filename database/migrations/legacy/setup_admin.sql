-- Pustak admin auxiliary setup.
-- Canonical users, reviews, addresses, books, book_copy, book_category,
-- cart, and cart_item tables are defined in database/schema/schema.sql.
-- This script must not recreate alternate versions of those tables.

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS admin_activity_log (
    log_id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id BIGINT,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_log_admin_id
    ON admin_activity_log(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_log_created_at
    ON admin_activity_log(created_at);

CREATE TABLE IF NOT EXISTS homepage_banners (
    banner_id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200),
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS featured_books (
    featured_id BIGSERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_featured_books_section
    ON featured_books(section);

CREATE INDEX IF NOT EXISTS idx_featured_books_active
    ON featured_books(is_active);

CREATE TABLE IF NOT EXISTS discounts (
    discount_id BIGSERIAL PRIMARY KEY,
    discount_name VARCHAR(200) NOT NULL,
    discount_type VARCHAR(50) NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL,
    applies_to VARCHAR(50),
    target_id INTEGER,
    min_purchase_amount NUMERIC(10, 2),
    max_discount_amount NUMERIC(10, 2),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
