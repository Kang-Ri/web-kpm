-- =====================================================
-- Migration: Add Snapshot Columns to Order Table
-- Date: 2025-12-08
-- Purpose: Implement snapshot pattern for historical data preservation
-- =====================================================

-- Step 1: Modify existing columns to allow NULL (for historical data)
ALTER TABLE `order` 
MODIFY COLUMN `idUser` INT NULL COMMENT 'FK ke Users (nullable jika user dihapus)',
MODIFY COLUMN `idProduk` INT NULL COMMENT 'FK ke Product (nullable jika produk dihapus)';

-- Step 2: Add Snapshot Produk columns
ALTER TABLE `order`
ADD COLUMN `namaProduk` VARCHAR(255) NOT NULL COMMENT 'Snapshot nama produk saat order dibuat' AFTER `idProduk`,
ADD COLUMN `hargaProduk` DECIMAL(10,2) NOT NULL COMMENT 'Snapshot harga produk saat order dibuat' AFTER `namaProduk`;

-- Step 3: Add Snapshot Pembeli columns
ALTER TABLE `order`
ADD COLUMN `namaPembeli` VARCHAR(255) NOT NULL COMMENT 'Nama pembeli (dari form response)' AFTER `hargaProduk`,
ADD COLUMN `emailPembeli` VARCHAR(255) NOT NULL COMMENT 'Email pembeli (dari form response)' AFTER `namaPembeli`,
ADD COLUMN `noHpPembeli` VARCHAR(20) NOT NULL COMMENT 'No HP pembeli (dari form response)' AFTER `emailPembeli`;

-- Step 4: Add Data Transaksi columns
ALTER TABLE `order`
ADD COLUMN `jumlahBeli` INT DEFAULT 1 COMMENT 'Jumlah produk yang dibeli' AFTER `noHpPembeli`,
ADD COLUMN `hargaTransaksi` DECIMAL(10,2) NOT NULL COMMENT 'Total harga sebelum diskon' AFTER `jumlahBeli`,
ADD COLUMN `diskon` DECIMAL(10,2) DEFAULT 0 COMMENT 'Diskon yang diberikan' AFTER `hargaTransaksi`,
ADD COLUMN `hargaFinal` DECIMAL(10,2) NOT NULL COMMENT 'Harga final setelah diskon' AFTER `diskon`;

-- Step 5: Update statusOrder ENUM (add 'Processing')
ALTER TABLE `order`
MODIFY COLUMN `statusOrder` ENUM('Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled') DEFAULT 'Pending' COMMENT 'Status order';

-- Step 6: Add Status Pembayaran column
ALTER TABLE `order`
ADD COLUMN `statusPembayaran` ENUM('Unpaid', 'Paid', 'Refunded', 'Failed') DEFAULT 'Unpaid' COMMENT 'Status pembayaran' AFTER `statusOrder`;

-- Step 7: Add Payment Gateway columns
ALTER TABLE `order`
ADD COLUMN `paymentMethod` VARCHAR(50) NULL COMMENT 'Metode pembayaran (Transfer, E-wallet, dll)' AFTER `midtransTransactionId`,
ADD COLUMN `paidAt` DATETIME NULL COMMENT 'Waktu pembayaran berhasil' AFTER `paymentMethod`;

-- Step 8: Rename totalHarga to match new structure (optional, keep for backward compatibility)
-- Note: We keep totalHarga but it will be deprecated in favor of hargaFinal
-- ALTER TABLE `order` CHANGE COLUMN `totalHarga` `totalHarga_deprecated` DECIMAL(10,2) NULL;

-- Step 9: Update tglOrder to NOT NULL
ALTER TABLE `order`
MODIFY COLUMN `tglOrder` DATETIME NOT NULL COMMENT 'Tanggal order dibuat (immutable)';

-- =====================================================
-- Step 10: Update Foreign Key Constraints
-- =====================================================

-- Drop existing foreign key constraints
ALTER TABLE `order` DROP FOREIGN KEY IF EXISTS `order_ibfk_1`;
ALTER TABLE `order` DROP FOREIGN KEY IF EXISTS `order_ibfk_2`;

-- Recreate with SET NULL on delete
ALTER TABLE `order`
ADD CONSTRAINT `order_ibfk_1` 
  FOREIGN KEY (`idUser`) REFERENCES `Users`(`idUser`) 
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `order`
ADD CONSTRAINT `order_ibfk_2` 
  FOREIGN KEY (`idProduk`) REFERENCES `product`(`idProduk`) 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- Step 11: Fill snapshot data for existing orders (if any)
-- =====================================================

-- Update existing orders with snapshot data from current product/user data
UPDATE `order` o
LEFT JOIN `product` p ON o.idProduk = p.idProduk
LEFT JOIN `Users` u ON o.idUser = u.idUser
SET 
  o.namaProduk = COALESCE(p.namaProduk, 'Produk Tidak Tersedia'),
  o.hargaProduk = COALESCE(p.hargaJual, 0),
  o.namaPembeli = COALESCE(u.namaLengkap, 'User Tidak Tersedia'),
  o.emailPembeli = COALESCE(u.email, 'no-email@example.com'),
  o.noHpPembeli = COALESCE('000000000000', '000000000000'),
  o.jumlahBeli = 1,
  o.hargaTransaksi = COALESCE(o.totalHarga, p.hargaJual, 0),
  o.diskon = 0,
  o.hargaFinal = COALESCE(o.totalHarga, p.hargaJual, 0)
WHERE o.namaProduk IS NULL;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check table structure
DESCRIBE `order`;

-- Check sample data
SELECT 
  idOrder, 
  namaProduk, 
  hargaProduk, 
  namaPembeli, 
  emailPembeli, 
  statusOrder, 
  statusPembayaran,
  hargaFinal
FROM `order` 
LIMIT 5;

-- =====================================================
-- Migration Complete
-- =====================================================
