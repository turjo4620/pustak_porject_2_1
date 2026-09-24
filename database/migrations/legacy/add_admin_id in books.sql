-- 1: t
ALTER TABLE books 
ADD COLUMN admin_id INT DEFAULT 1786484073;

--  2: 
UPDATE books 
SET admin_id = 1786484073;

-- 3 
ALTER TABLE books
ADD CONSTRAINT fk_books_admin
FOREIGN KEY (admin_id) REFERENCES admin(user_id);