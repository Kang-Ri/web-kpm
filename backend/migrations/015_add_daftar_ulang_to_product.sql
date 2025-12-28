-- Migration 015: Add 'Daftar Ulang' to Product.jenisProduk ENUM
-- Purpose: Enable Daftar Ulang as Product type for consistent payment architecture
-- Date: 2025-12-28

-- Add 'Daftar Ulang' to jenisProduk ENUM
ALTER TABLE product 
MODIFY COLUMN jenisProduk 
ENUM('Materi', 'Produk', 'Daftar Ulang', 'Lainnya') 
DEFAULT 'Produk'
COMMENT 'Jenis produk: Materi, Produk, Daftar Ulang, atau Lainnya';

-- Verify change
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'product' 
  AND COLUMN_NAME = 'jenisProduk'
  AND TABLE_SCHEMA = DATABASE();
