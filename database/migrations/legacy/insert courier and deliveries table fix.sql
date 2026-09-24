INSERT INTO courier (name) VALUES ('Pathao'), ('RedX'), ('Sundarban');
-- Add the new Foreign Key column
ALTER TABLE deliveries 
ADD COLUMN courier_id INTEGER REFERENCES courier(courier_id);
 
-- Drop the old 3NF-violating text column
ALTER TABLE deliveries 
DROP COLUMN courier_name;

select * from deliveries