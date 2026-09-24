BEGIN;

-- The application uses users.user_id as bigint and books.id as integer.
-- Stop rather than silently corrupting data if existing rows cannot be linked.
DO $$
DECLARE
    orphan_count bigint;
BEGIN
    SELECT COUNT(*) INTO orphan_count
    FROM wishlist w
    LEFT JOIN users u ON u.user_id = w.user_id
    WHERE u.user_id IS NULL;
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'Cannot add wishlist.user_id foreign key: % orphan rows', orphan_count;
    END IF;

    SELECT COUNT(*) INTO orphan_count
    FROM reviews r
    LEFT JOIN users u ON u.user_id = r.user_id
    WHERE u.user_id IS NULL;
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'Cannot add reviews.user_id foreign key: % orphan rows', orphan_count;
    END IF;

    SELECT COUNT(*) INTO orphan_count
    FROM orders o
    LEFT JOIN users u ON u.user_id = o.user_id
    WHERE u.user_id IS NULL;
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'Cannot add orders.user_id foreign key: % orphan rows', orphan_count;
    END IF;

    SELECT COUNT(*) INTO orphan_count
    FROM cart c
    LEFT JOIN users u ON u.user_id = c.user_id
    WHERE u.user_id IS NULL;
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'Cannot add cart.user_id foreign key: % orphan rows', orphan_count;
    END IF;

    SELECT COUNT(*) INTO orphan_count
    FROM addresses a
    LEFT JOIN users u ON u.user_id = a.user_id
    WHERE u.user_id IS NULL;
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'Cannot add addresses.user_id foreign key: % orphan rows', orphan_count;
    END IF;

    SELECT COUNT(*) INTO orphan_count
    FROM book_copy bc
    LEFT JOIN books b ON b.id = bc.book_id
    WHERE b.id IS NULL;
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'Cannot align book_copy.book_id: % orphan rows', orphan_count;
    END IF;

    SELECT COUNT(*) INTO orphan_count
    FROM order_item oi
    LEFT JOIN orders o ON o.order_id = oi.order_id
    WHERE o.order_id IS NULL;
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'Cannot align order_item.order_id: % orphan rows', orphan_count;
    END IF;

    SELECT COUNT(*) INTO orphan_count
    FROM books b
    LEFT JOIN admin a ON a.user_id = b.admin_id
    WHERE b.admin_id IS NOT NULL AND a.user_id IS NULL;
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'Cannot add books.admin_id foreign key: % orphan rows', orphan_count;
    END IF;
END;
$$;

-- Prevent overflow before narrowing columns that reference books.id/orders.order_id.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM book_copy WHERE book_id > 2147483647 OR book_id < -2147483648)
       OR EXISTS (SELECT 1 FROM order_item WHERE order_id > 2147483647 OR order_id < -2147483648)
    THEN
        RAISE EXCEPTION 'Cannot align foreign keys: value exceeds integer range';
    END IF;
END;
$$;

ALTER TABLE book_copy DROP CONSTRAINT IF EXISTS book_copy_book_id_fkey;
ALTER TABLE order_item DROP CONSTRAINT IF EXISTS order_item_order_id_fkey;
ALTER TABLE books DROP CONSTRAINT IF EXISTS fk_books_admin;
ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_user_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE cart DROP CONSTRAINT IF EXISTS cart_user_id_fkey;
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;

ALTER TABLE book_copy
    ALTER COLUMN book_id TYPE integer USING book_id::integer;

ALTER TABLE order_item
    ALTER COLUMN order_id TYPE integer USING order_id::integer;

ALTER TABLE wishlist ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE reviews ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE orders ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE cart ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE addresses ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE books ALTER COLUMN admin_id TYPE bigint USING admin_id::bigint;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'book_copy_book_id_fkey') THEN
        ALTER TABLE book_copy ADD CONSTRAINT book_copy_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES books(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_order_id_fkey') THEN
        ALTER TABLE order_item ADD CONSTRAINT order_item_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES orders(order_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_books_admin') THEN
        ALTER TABLE books ADD CONSTRAINT fk_books_admin
            FOREIGN KEY (admin_id) REFERENCES admin(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_user_id_fkey') THEN
        ALTER TABLE wishlist ADD CONSTRAINT wishlist_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_fkey') THEN
        ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey') THEN
        ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_user_id_fkey') THEN
        ALTER TABLE cart ADD CONSTRAINT cart_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addresses_user_id_fkey') THEN
        ALTER TABLE addresses ADD CONSTRAINT addresses_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
    END IF;
END;
$$;

-- Older return scripts duplicated copy and user ownership on "return".
-- Verify those values are derivable before removing the redundant columns.
DO $$
DECLARE
    mismatch_count bigint;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'return' AND column_name = 'copy_id'
    ) THEN
        SELECT COUNT(*) INTO mismatch_count
        FROM "return" r
        JOIN order_item oi ON oi.order_item_id = r.order_item_id
        WHERE r.copy_id IS DISTINCT FROM oi.copy_id;
        IF mismatch_count > 0 THEN
            RAISE EXCEPTION 'Cannot remove return.copy_id: % inconsistent rows', mismatch_count;
        END IF;
        ALTER TABLE "return" DROP CONSTRAINT IF EXISTS return_copy_id_fkey;
        ALTER TABLE "return" DROP COLUMN copy_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'return' AND column_name = 'user_id'
    ) THEN
        SELECT COUNT(*) INTO mismatch_count
        FROM "return" r
        JOIN order_item oi ON oi.order_item_id = r.order_item_id
        JOIN orders o ON o.order_id = oi.order_id
        WHERE r.user_id IS DISTINCT FROM o.user_id;
        IF mismatch_count > 0 THEN
            RAISE EXCEPTION 'Cannot remove return.user_id: % inconsistent rows', mismatch_count;
        END IF;
        ALTER TABLE "return" DROP CONSTRAINT IF EXISTS return_user_id_fkey;
        ALTER TABLE "return" DROP COLUMN user_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'return' AND column_name = 'refund_status'
    ) THEN
        ALTER TABLE "return" DROP COLUMN refund_status;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'refund' AND column_name = 'original_amount'
    ) THEN
        ALTER TABLE refund DROP COLUMN original_amount;
    END IF;
END;
$$;

COMMIT;
