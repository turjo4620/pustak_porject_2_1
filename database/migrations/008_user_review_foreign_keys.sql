BEGIN;

-- Validate existing rows before adding the relationships.
DO $$
DECLARE
    orphan_count bigint;
BEGIN
    SELECT COUNT(*) INTO orphan_count
    FROM wishlist w
    LEFT JOIN users u ON u.user_id = w.user_id::bigint
    WHERE u.user_id IS NULL;

    IF orphan_count > 0 THEN
        RAISE EXCEPTION
            'Cannot add wishlist.user_id foreign key: % orphan rows',
            orphan_count;
    END IF;

    SELECT COUNT(*) INTO orphan_count
    FROM reviews r
    LEFT JOIN users u ON u.user_id = r.user_id::bigint
    WHERE u.user_id IS NULL;

    IF orphan_count > 0 THEN
        RAISE EXCEPTION
            'Cannot add reviews.user_id foreign key: % orphan rows',
            orphan_count;
    END IF;

    SELECT COUNT(*) INTO orphan_count
    FROM reviews r
    LEFT JOIN books b ON b.id = r.book_id
    WHERE b.id IS NULL;

    IF orphan_count > 0 THEN
        RAISE EXCEPTION
            'Cannot add reviews.book_id foreign key: % orphan rows',
            orphan_count;
    END IF;
END;
$$;

-- users.user_id is bigint, so its referencing columns must use bigint too.
ALTER TABLE wishlist
    DROP CONSTRAINT IF EXISTS wishlist_user_id_fkey;

ALTER TABLE reviews
    DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

ALTER TABLE reviews
    DROP CONSTRAINT IF EXISTS reviews_book_id_fkey;

ALTER TABLE wishlist
    ALTER COLUMN user_id TYPE bigint
    USING user_id::bigint;

ALTER TABLE reviews
    ALTER COLUMN user_id TYPE bigint
    USING user_id::bigint;

ALTER TABLE wishlist
    ADD CONSTRAINT wishlist_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE;

ALTER TABLE reviews
    ADD CONSTRAINT reviews_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE;

ALTER TABLE reviews
    ADD CONSTRAINT reviews_book_id_fkey
    FOREIGN KEY (book_id)
    REFERENCES books(id)
    ON DELETE CASCADE;

COMMIT;
