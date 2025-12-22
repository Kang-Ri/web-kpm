-- Drop old unique constraint on namaProduk
-- Add composite unique constraint on (namaProduk, idParent2)

USE kpm_db;

-- Drop existing unique key on namaProduk
ALTER TABLE product DROP INDEX namaProduk;

-- Add composite unique index
ALTER TABLE product 
ADD UNIQUE INDEX unique_product_per_parent2 (namaProduk, idParent2);
