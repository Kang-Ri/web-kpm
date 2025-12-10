-- =====================================================
-- Migration: Add Missing Columns to Order Table
-- Date: 2025-12-09
-- Purpose: Add missing snapshot columns (only what's needed)
-- =====================================================

USE web_kpm;

-- Step 1: Add emailPembeli (MISSING)
ALTER TABLE `order`
ADD COLUMN `emailPembeli` VARCHAR(255) NOT NULL DEFAULT 'no-email@example.com' COMMENT 'Email pembeli (dari form response)' AFTER `namaPembeli`;

-- Step 2: Add jumlahBeli (MISSING)
ALTER TABLE `order`
ADD COLUMN `jumlahBeli` INT DEFAULT 1 COMMENT 'Jumlah produk yang dibeli' AFTER `hargaTransaksi`;

-- Step 3: Add diskon (MISSING)
ALTER TABLE `order`
ADD COLUMN `diskon` DECIMAL(10,2) DEFAULT 0 COMMENT 'Diskon yang diberikan' AFTER `jumlahBeli`;

-- Step 4: Add hargaFinal (MISSING)
ALTER TABLE `order`
ADD COLUMN `hargaFinal` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Harga final setelah diskon' AFTER `diskon`;

-- Step 5: Add statusPembayaran (MISSING)
ALTER TABLE `order`
ADD COLUMN `statusPembayaran` ENUM('Unpaid', 'Paid', 'Refunded', 'Failed') DEFAULT 'Unpaid' COMMENT 'Status pembayaran' AFTER `statusOrder`;

-- Step 6: Add paymentMethod (MISSING)
ALTER TABLE `order`
ADD COLUMN `paymentMethod` VARCHAR(50) NULL COMMENT 'Metode pembayaran' AFTER `midtransTransactionId`;

-- Step 7: Add paidAt (MISSING)
ALTER TABLE `order`
ADD COLUMN `paidAt` DATETIME NULL COMMENT 'Waktu pembayaran berhasil' AFTER `paymentMethod`;

-- Step 8: Add tglOrder (MISSING)
ALTER TABLE `order`
ADD COLUMN `tglOrder` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Tanggal order dibuat (immutable)' AFTER `paidAt`;

-- =====================================================
-- Step 9: Modify existing columns (increase size)
-- =====================================================

-- Modify noHpPembeli: VARCHAR(15) -> VARCHAR(20)
ALTER TABLE `order`
MODIFY COLUMN `noHpPembeli` VARCHAR(20) NOT NULL COMMENT 'No HP pembeli (dari form response)';

-- Modify namaPembeli: VARCHAR(100) -> VARCHAR(255)
ALTER TABLE `order`
MODIFY COLUMN `namaPembeli` VARCHAR(255) NOT NULL COMMENT 'Nama pembeli (dari form response)';

-- Modify statusOrder: add 'Processing'
ALTER TABLE `order`
MODIFY COLUMN `statusOrder` ENUM('Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled', 'Menunggu Pembayaran') DEFAULT 'Pending' COMMENT 'Status order';

-- =====================================================
-- Step 10: Update existing data
-- =====================================================

-- Set default values for new columns in existing records
UPDATE `order`
SET 
  `hargaFinal` = `hargaTransaksi`,
  `tglOrder` = `createdAt`
WHERE `hargaFinal` = 0;

-- =====================================================
-- Verification
-- =====================================================

-- Check table structure
DESCRIBE `order`;

-- =====================================================
-- Migration Complete
-- =====================================================
SELECT 'Migration completed successfully!' AS Status;
