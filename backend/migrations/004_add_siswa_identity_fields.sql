-- =====================================================
-- Migration: Add Siswa Identity Fields
-- Date: 2025-12-14
-- Purpose: Add jenjangKelas and asalSekolah to siswa table
-- =====================================================

USE web_kpm;

-- Add jenjangKelas and asalSekolah columns
ALTER TABLE siswa
ADD COLUMN jenjangKelas ENUM('1','2','3','4','5','6','7','8','9','10','11','12') 
    COMMENT 'Jenjang kelas siswa (1-12)' 
    AFTER jenisKelamin,
ADD COLUMN asalSekolah VARCHAR(255) 
    COMMENT 'Asal sekolah siswa' 
    AFTER jenjangKelas;

-- Verify columns added
DESCRIBE siswa;

-- Show sample data structure
SELECT idSiswa, namaLengkap, jenjangKelas, asalSekolah, statusAktif 
FROM siswa 
LIMIT 5;

SELECT 'Siswa identity fields migration completed successfully!' AS Status;
