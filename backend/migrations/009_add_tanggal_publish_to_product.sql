-- Add tanggalPublish field to product table

USE kpm_db;

ALTER TABLE product 
ADD COLUMN tanggalPublish DATETIME NULL 
COMMENT 'Tanggal publish materi' 
AFTER statusProduk;
