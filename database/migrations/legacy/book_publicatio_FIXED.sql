--1

ALTER TABLE books ADD COLUMN publication_id INT REFERENCES publications(publication_id);


--2

UPDATE books b
SET publication_id = bp.publication_id
FROM book_publication_create bp
WHERE b.id = bp.book_id;

SELECT * from book_category


--3 
DROP TABLE book_publication_create;