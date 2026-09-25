BEGIN;

-- Find author rows that share a biography or profile image. Prefer the
-- Bengali-named row as the single displayed profile.
CREATE TEMP TABLE author_merge ON COMMIT DROP AS
WITH candidates AS (
    SELECT
        source.author_id AS old_id,
        COALESCE(
            (
                SELECT MIN(target.author_id)
                FROM authors target
                WHERE target.name ~ '[অ-৹]'
                  AND (
                      (source.photo_url IS NOT NULL
                       AND target.photo_url = source.photo_url)
                      OR
                      (source.bio IS NOT NULL
                       AND target.bio = source.bio)
                  )
            ),
            (
                SELECT MIN(target.author_id)
                FROM authors target
                WHERE (
                    (source.photo_url IS NOT NULL
                     AND target.photo_url = source.photo_url)
                    OR
                    (source.bio IS NOT NULL
                     AND target.bio = source.bio)
                )
            )
        ) AS canonical_id
    FROM authors source
)
SELECT old_id, canonical_id
FROM candidates
WHERE canonical_id IS NOT NULL
  AND old_id <> canonical_id;

UPDATE authors AS canonical
SET bio = COALESCE(canonical.bio, duplicate.bio),
    photo_url = COALESCE(canonical.photo_url, duplicate.photo_url)
FROM author_merge merge_rows
JOIN authors duplicate ON duplicate.author_id = merge_rows.old_id
WHERE canonical.author_id = merge_rows.canonical_id;

INSERT INTO book_author (book_id, author_id)
SELECT book_author.book_id, merge_rows.canonical_id
FROM book_author
JOIN author_merge merge_rows
  ON merge_rows.old_id = book_author.author_id
ON CONFLICT DO NOTHING;

INSERT INTO author_aliases (alias_name, author_id)
SELECT LOWER(TRIM(authors.name)), merge_rows.canonical_id
FROM authors
JOIN author_merge merge_rows
  ON merge_rows.old_id = authors.author_id
ON CONFLICT (alias_name) DO UPDATE
SET author_id = EXCLUDED.author_id;

DELETE FROM authors
WHERE author_id IN (SELECT old_id FROM author_merge);

COMMIT;
