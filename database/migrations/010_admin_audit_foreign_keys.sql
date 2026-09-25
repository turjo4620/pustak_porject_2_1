BEGIN;

DO $$
DECLARE
  table_name text;
  constraint_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['books', 'authors', 'publications', 'categories', 'coupons'] LOOP
    FOREACH constraint_name IN ARRAY ARRAY['created_by', 'updated_by'] LOOP
      IF NOT (
        table_name = 'books'
        AND constraint_name = 'created_by'
        AND EXISTS (
          SELECT 1
          FROM pg_constraint existing
          JOIN pg_class existing_table ON existing_table.oid = existing.conrelid
          WHERE existing.conname = 'fk_books_admin'
            AND existing_table.relname = 'books'
        )
      ) AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE c.conname = format('%s_%s_admin_fkey', table_name, constraint_name)
          AND t.relname = table_name
      ) THEN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES admin (user_id)',
          table_name,
          format('%s_%s_admin_fkey', table_name, constraint_name),
          constraint_name
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

COMMIT;
