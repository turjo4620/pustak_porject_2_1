BEGIN;

-- books.admin_id is the existing creator column. Preserve its values by renaming it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'books'
      AND column_name = 'admin_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'books'
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE books RENAME COLUMN admin_id TO created_by;
  END IF;
END $$;

ALTER TABLE books ALTER COLUMN created_by DROP DEFAULT;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['books', 'authors', 'publications', 'categories', 'coupons'] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by bigint', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_by bigint', table_name);
    EXECUTE format(
      'UPDATE %I SET created_by = 1787655457, updated_by = 1787655457',
      table_name
    );
  END LOOP;
END $$;

COMMIT;
