-- Legacy-compatible return setup.
-- Do not drop transactional tables here; the application uses the canonical
-- schema in database/schema/schema.sql and database/migrations.

BEGIN;

CREATE TABLE IF NOT EXISTS book_copy (
    copy_id BIGSERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id),
    status VARCHAR(50) NOT NULL DEFAULT 'in_stock',
    condition VARCHAR(50) NOT NULL DEFAULT 'new',
    barcode VARCHAR(100) UNIQUE
);

CREATE TABLE IF NOT EXISTS order_item (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id),
    copy_id BIGINT NOT NULL REFERENCES book_copy(copy_id),
    price_sold NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "return" (
    return_id BIGSERIAL PRIMARY KEY,
    order_item_id BIGINT NOT NULL REFERENCES order_item(order_item_id),
    reason VARCHAR(255),
    return_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'initiated',
    approved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refund (
    refund_id BIGSERIAL PRIMARY KEY,
    return_id BIGINT NOT NULL UNIQUE REFERENCES "return"(return_id),
    refund_amount NUMERIC(10, 2) NOT NULL,
    refund_date TIMESTAMP,
    refund_status VARCHAR(50)
);

COMMIT;
