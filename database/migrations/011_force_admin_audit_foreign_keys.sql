BEGIN;

ALTER TABLE books
  DROP CONSTRAINT IF EXISTS fk_books_admin,
  DROP CONSTRAINT IF EXISTS books_created_by_admin_fkey,
  DROP CONSTRAINT IF EXISTS books_updated_by_admin_fkey;

ALTER TABLE authors
  DROP CONSTRAINT IF EXISTS authors_created_by_admin_fkey,
  DROP CONSTRAINT IF EXISTS authors_updated_by_admin_fkey;

ALTER TABLE publications
  DROP CONSTRAINT IF EXISTS publications_created_by_admin_fkey,
  DROP CONSTRAINT IF EXISTS publications_updated_by_admin_fkey;

ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS categories_created_by_admin_fkey,
  DROP CONSTRAINT IF EXISTS categories_updated_by_admin_fkey;

ALTER TABLE coupons
  DROP CONSTRAINT IF EXISTS coupons_created_by_admin_fkey,
  DROP CONSTRAINT IF EXISTS coupons_updated_by_admin_fkey;

ALTER TABLE books
  ADD CONSTRAINT books_created_by_admin_fkey
    FOREIGN KEY (created_by) REFERENCES admin (user_id),
  ADD CONSTRAINT books_updated_by_admin_fkey
    FOREIGN KEY (updated_by) REFERENCES admin (user_id);

ALTER TABLE authors
  ADD CONSTRAINT authors_created_by_admin_fkey
    FOREIGN KEY (created_by) REFERENCES admin (user_id),
  ADD CONSTRAINT authors_updated_by_admin_fkey
    FOREIGN KEY (updated_by) REFERENCES admin (user_id);

ALTER TABLE publications
  ADD CONSTRAINT publications_created_by_admin_fkey
    FOREIGN KEY (created_by) REFERENCES admin (user_id),
  ADD CONSTRAINT publications_updated_by_admin_fkey
    FOREIGN KEY (updated_by) REFERENCES admin (user_id);

ALTER TABLE categories
  ADD CONSTRAINT categories_created_by_admin_fkey
    FOREIGN KEY (created_by) REFERENCES admin (user_id),
  ADD CONSTRAINT categories_updated_by_admin_fkey
    FOREIGN KEY (updated_by) REFERENCES admin (user_id);

ALTER TABLE coupons
  ADD CONSTRAINT coupons_created_by_admin_fkey
    FOREIGN KEY (created_by) REFERENCES admin (user_id),
  ADD CONSTRAINT coupons_updated_by_admin_fkey
    FOREIGN KEY (updated_by) REFERENCES admin (user_id);

COMMIT;
