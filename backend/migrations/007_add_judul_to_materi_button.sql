-- Add judulButton field to materiButton table

USE kpm_db;

ALTER TABLE materiButton 
ADD COLUMN judulButton VARCHAR(255) NULL 
COMMENT 'Judul/heading untuk button' 
AFTER idProduk;
