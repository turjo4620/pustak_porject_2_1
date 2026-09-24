ALTER TABLE books DROP COLUMN discount_price CASCADE;


ALTER TABLE books DROP COLUMN discount_percentage ;
ALTER TABLE books ADD COLUMN discount_percentage INT DEFAULT 0;


UPDATE books
SET discount_percentage = (ARRAY[18,20,30,40])[floor(random()*4 + 1)];
