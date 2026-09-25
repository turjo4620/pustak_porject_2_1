BEGIN;

CREATE TABLE IF NOT EXISTS author_aliases
(
    alias_name varchar(150) NOT NULL PRIMARY KEY,
    author_id integer NOT NULL REFERENCES authors (author_id) ON DELETE CASCADE
);

-- Keep the Bengali record as the canonical display record for each pair.
UPDATE authors AS canonical
SET bio = COALESCE(canonical.bio, duplicate.bio),
    photo_url = COALESCE(canonical.photo_url, duplicate.photo_url)
FROM authors AS duplicate
WHERE (canonical.author_id, duplicate.author_id) IN
    ((10, 24), (328, 501), (441, 221), (289, 290));

INSERT INTO book_author (book_id, author_id)
SELECT book_id, 10 FROM book_author WHERE author_id = 24
ON CONFLICT DO NOTHING;
INSERT INTO book_author (book_id, author_id)
SELECT book_id, 328 FROM book_author WHERE author_id = 501
ON CONFLICT DO NOTHING;
INSERT INTO book_author (book_id, author_id)
SELECT book_id, 441 FROM book_author WHERE author_id = 221
ON CONFLICT DO NOTHING;
INSERT INTO book_author (book_id, author_id)
SELECT book_id, 289 FROM book_author WHERE author_id = 290
ON CONFLICT DO NOTHING;

INSERT INTO author_aliases (alias_name, author_id)
SELECT LOWER(TRIM(name)), author_id FROM authors
ON CONFLICT (alias_name) DO NOTHING;

INSERT INTO author_aliases (alias_name, author_id) VALUES
    ('রবীন্দ্রনাথ ঠাকুর', 10),
    ('rabindranath tagore', 10),
    ('আগাথা ক্রিস্টি', 328),
    ('agatha christie', 328),
    ('পাওলো কোয়েলহো', 441),
    ('পাওলো কোয়েলহো', 441),
    ('paulo coelho', 441),
    ('ড্যান ব্রাউন', 289),
    ('dan brown', 289)
ON CONFLICT (alias_name) DO UPDATE SET author_id = EXCLUDED.author_id;

DELETE FROM authors WHERE author_id IN (24, 501, 221, 290);

COMMIT;
