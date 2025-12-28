-- ============================================================================
-- MIGRATION: Daftar Ulang ke Product (Pure SQL Version)
-- Purpose: Migrasi data daftar ulang dari ParentProduct2 ke Product table
-- Run di MySQL Workbench
-- ============================================================================

-- STEP 1: Update ENUM jenisProduk (sama dengan migration 015)
-- ============================================================================
ALTER TABLE product 
MODIFY COLUMN jenisProduk 
ENUM('Materi', 'Produk', 'Daftar Ulang', 'Lainnya') 
DEFAULT 'Produk'
COMMENT 'Jenis produk: Materi, Produk, Daftar Ulang, atau Lainnya';

-- Verify ENUM update
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'product' 
  AND COLUMN_NAME = 'jenisProduk'
  AND TABLE_SCHEMA = DATABASE();

-- STEP 2: Insert Product untuk setiap ParentProduct2 dengan daftarUlangAktif = true
-- ============================================================================

INSERT INTO product (
    idParent2,
    namaProduk,
    descProduk,
    kategoriHarga,
    hargaModal,
    hargaJual,
    jenisProduk,
    authProduk,
    idForm,
    refCode,
    statusProduk,
    tanggalPublish
)
SELECT 
    p2.idParent2,
    CONCAT('Daftar Ulang ', p2.namaParent2) AS namaProduk,
    CONCAT('Pembayaran daftar ulang untuk ', p2.namaParent2) AS descProduk,
    COALESCE(p2.kategoriHargaDaftarUlang, 'Gratis') AS kategoriHarga,
    COALESCE(p2.hargaDaftarUlang, 0) AS hargaModal,
    COALESCE(p2.hargaDaftarUlang, 0) AS hargaJual,
    'Daftar Ulang' AS jenisProduk,
    'Khusus' AS authProduk,
    p2.idFormDaftarUlang,
    NULL AS refCode,
    'Publish' AS statusProduk,
    NOW() AS tanggalPublish
FROM ParentProduct2 p2
WHERE p2.daftarUlangAktif = 1
  AND NOT EXISTS (
      -- Prevent duplicate: skip if Product daftar ulang already exists
      SELECT 1 
      FROM product prod
      WHERE prod.idParent2 = p2.idParent2
        AND prod.jenisProduk = 'Daftar Ulang'
  );

-- STEP 3: Verify results
-- ============================================================================

-- Tampilkan Product Daftar Ulang yang baru dibuat
SELECT 
    p.idProduk,
    p.namaProduk,
    p.kategoriHarga,
    p.hargaJual,
    p.jenisProduk,
    p.statusProduk,
    p2.namaParent2 AS ruangKelas
FROM product p
JOIN ParentProduct2 p2 ON p.idParent2 = p2.idParent2
WHERE p.jenisProduk = 'Daftar Ulang'
ORDER BY p.idProduk DESC;

-- Hitung jumlah Product Daftar Ulang
SELECT 
    COUNT(*) AS totalProductDaftarUlang,
    SUM(CASE WHEN statusProduk = 'Publish' THEN 1 ELSE 0 END) AS published,
    SUM(CASE WHEN hargaJual > 0 THEN 1 ELSE 0 END) AS berbayar,
    SUM(CASE WHEN hargaJual = 0 THEN 1 ELSE 0 END) AS gratis
FROM product
WHERE jenisProduk = 'Daftar Ulang';

-- ============================================================================
-- NOTES:
-- 1. Script ini aman dijalankan multiple kali (ada check duplicate)
-- 2. Hanya create Product untuk ParentProduct2 dengan daftarUlangAktif = 1
-- 3. Field lama di ParentProduct2 TIDAK dihapus (backward compatibility)
-- ============================================================================
