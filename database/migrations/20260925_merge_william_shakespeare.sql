BEGIN;

-- Keep the Bengali record as the only displayed author profile.
UPDATE authors AS canonical
SET bio = COALESCE(canonical.bio, duplicate.bio),
    photo_url = COALESCE(canonical.photo_url, duplicate.photo_url)
FROM authors AS duplicate
WHERE canonical.author_id = 243
  AND duplicate.author_id = 11;

INSERT INTO book_author (book_id, author_id)
SELECT book_id, 243
FROM book_author
WHERE author_id = 11
ON CONFLICT DO NOTHING;

INSERT INTO author_aliases (alias_name, author_id) VALUES
    ('উইলিয়াম শেক্সপীয়ার', 243),
    ('william shakespeare', 243)
ON CONFLICT (alias_name) DO UPDATE SET author_id = EXCLUDED.author_id;

DELETE FROM authors
WHERE author_id = 11;

COMMIT;
