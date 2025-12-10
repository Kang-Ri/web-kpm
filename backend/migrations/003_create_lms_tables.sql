-- =====================================================
-- Migration: Create LMS Tables
-- Date: 2025-12-09
-- Purpose: Implementasi LMS dengan siswa, kelas, dan materi
-- =====================================================

USE web_kpm;

-- =====================================================
-- 1. CREATE TABLE SISWA
-- =====================================================

CREATE TABLE siswa (
  idSiswa INT PRIMARY KEY AUTO_INCREMENT,
  idUser INT COMMENT 'FK ke Users (nullable)',
  
  -- Data Umum
  namaLengkap VARCHAR(255) NOT NULL,
  tempatLahir VARCHAR(100),
  tanggalLahir DATE,
  jenisKelamin ENUM('Laki-laki', 'Perempuan'),
  agama VARCHAR(50),
  
  -- Data Identitas
  nik VARCHAR(16) UNIQUE,
  nisn VARCHAR(10) UNIQUE,
  alamatLengkap TEXT,
  kota VARCHAR(100),
  provinsi VARCHAR(100),
  kodePos VARCHAR(10),
  
  -- Data Kontak
  noHp VARCHAR(20),
  email VARCHAR(255),
  
  -- Status
  statusAktif ENUM('Aktif', 'Non-Aktif') DEFAULT 'Aktif',
  
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (idUser) REFERENCES Users(idUser) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_siswa_user (idUser),
  INDEX idx_siswa_nik (nik),
  INDEX idx_siswa_nisn (nisn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. CREATE TABLE ORANG TUA
-- =====================================================

CREATE TABLE orangTua (
  idOrangTua INT PRIMARY KEY AUTO_INCREMENT,
  idSiswa INT NOT NULL COMMENT 'FK ke siswa',
  
  -- Data Ayah
  namaAyah VARCHAR(255),
  pekerjaanAyah VARCHAR(100),
  noHpAyah VARCHAR(20),
  
  -- Data Ibu
  namaIbu VARCHAR(255),
  pekerjaanIbu VARCHAR(100),
  noHpIbu VARCHAR(20),
  
  -- Data Wali (optional)
  namaWali VARCHAR(255),
  hubunganWali VARCHAR(50),
  noHpWali VARCHAR(20),
  
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (idSiswa) REFERENCES siswa(idSiswa) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_orangtua_siswa (idSiswa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. CREATE TABLE SISWA KELAS (Enrollment)
-- =====================================================

CREATE TABLE siswaKelas (
  idSiswaKelas INT PRIMARY KEY AUTO_INCREMENT,
  idSiswa INT NOT NULL COMMENT 'FK ke siswa',
  idParent2 INT NOT NULL COMMENT 'FK ke parentProduct2 (Ruang Kelas)',
  
  -- Status Daftar Ulang
  sudahDaftarUlang BOOLEAN DEFAULT FALSE,
  idOrderDaftarUlang INT COMMENT 'FK ke order (jika berbayar)',
  tanggalDaftarUlang DATETIME,
  
  -- Status Enrollment
  statusEnrollment ENUM('Pending', 'Aktif', 'Lulus', 'Dropout') DEFAULT 'Pending',
  tanggalMasuk DATETIME,
  tanggalKeluar DATETIME,
  
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (idSiswa) REFERENCES siswa(idSiswa) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (idParent2) REFERENCES parentProduct2(idParent2) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (idOrderDaftarUlang) REFERENCES `order`(idOrder) ON DELETE SET NULL ON UPDATE CASCADE,
  
  UNIQUE KEY unique_siswa_kelas (idSiswa, idParent2),
  INDEX idx_siswakelas_siswa (idSiswa),
  INDEX idx_siswakelas_parent2 (idParent2),
  INDEX idx_siswakelas_enrollment (statusEnrollment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. CREATE TABLE MATERI BUTTON (CTA)
-- =====================================================

CREATE TABLE materiButton (
  idButton INT PRIMARY KEY AUTO_INCREMENT,
  idProduk INT NOT NULL COMMENT 'FK ke product (materi)',
  
  namaButton VARCHAR(100) NOT NULL COMMENT 'Nama tombol CTA',
  linkTujuan TEXT NOT NULL COMMENT 'URL tujuan',
  deskripsiButton TEXT COMMENT 'Deskripsi tombol',
  
  -- Scheduling
  tanggalPublish DATETIME COMMENT 'Kapan tombol mulai aktif',
  tanggalExpire DATETIME COMMENT 'Kapan tombol tidak aktif (optional)',
  statusButton ENUM('Active', 'Inactive') DEFAULT 'Active',
  
  orderIndex INT DEFAULT 0 COMMENT 'Urutan tombol',
  
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (idProduk) REFERENCES product(idProduk) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_mateributton_produk (idProduk),
  INDEX idx_mateributton_status (statusButton),
  INDEX idx_mateributton_publish (tanggalPublish)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. CREATE TABLE AKSES MATERI
-- =====================================================

CREATE TABLE aksesMateri (
  idAkses INT PRIMARY KEY AUTO_INCREMENT,
  idSiswa INT NOT NULL COMMENT 'FK ke siswa',
  idProduk INT NOT NULL COMMENT 'FK ke product (materi)',
  idOrder INT COMMENT 'FK ke order (jika berbayar)',
  
  statusAkses ENUM('Locked', 'Unlocked') DEFAULT 'Locked',
  tanggalAkses DATETIME COMMENT 'Kapan akses diberikan',
  
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (idSiswa) REFERENCES siswa(idSiswa) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (idProduk) REFERENCES product(idProduk) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (idOrder) REFERENCES `order`(idOrder) ON DELETE SET NULL ON UPDATE CASCADE,
  
  UNIQUE KEY unique_siswa_materi (idSiswa, idProduk),
  INDEX idx_aksesmateri_siswa (idSiswa),
  INDEX idx_aksesmateri_produk (idProduk),
  INDEX idx_aksesmateri_status (statusAkses)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. UPDATE TABLE PARENTPRODUCT2 (Add Daftar Ulang)
-- =====================================================

ALTER TABLE parentProduct2
ADD COLUMN daftarUlangAktif BOOLEAN DEFAULT FALSE COMMENT 'Apakah daftar ulang diaktifkan' AFTER descParent2,
ADD COLUMN kategoriHargaDaftarUlang ENUM('Gratis', 'Seikhlasnya', 'Bernominal') DEFAULT 'Gratis' AFTER daftarUlangAktif,
ADD COLUMN hargaDaftarUlang DECIMAL(10,2) DEFAULT 0 COMMENT 'Harga daftar ulang' AFTER kategoriHargaDaftarUlang,
ADD COLUMN tahunAjaran VARCHAR(20) COMMENT 'Tahun ajaran untuk kelas' AFTER hargaDaftarUlang,
ADD COLUMN kapasitasMaksimal INT COMMENT 'Kapasitas maksimal siswa' AFTER tahunAjaran;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check all tables created
SHOW TABLES LIKE '%siswa%';
SHOW TABLES LIKE '%materi%';
SHOW TABLES LIKE '%akses%';

-- Check siswa structure
DESCRIBE siswa;

-- Check parentProduct2 new columns
DESCRIBE parentProduct2;

-- Check indexes
SHOW INDEX FROM siswaKelas;
SHOW INDEX FROM aksesMateri;

-- =====================================================
-- Sample Data (Optional)
-- =====================================================

-- Insert sample siswa
INSERT INTO siswa (idUser, namaLengkap, jenisKelamin, noHp, email, statusAktif) VALUES
(1, 'Ahmad Rizki Pratama', 'Laki-laki', '081234567890', 'ahmad.rizki@email.com', 'Aktif'),
(2, 'Siti Nurhaliza', 'Perempuan', '081234567891', 'siti.nur@email.com', 'Aktif');

-- Insert sample orang tua
INSERT INTO orangTua (idSiswa, namaAyah, namaIbu, noHpAyah, noHpIbu) VALUES
(1, 'Budi Pratama', 'Ani Wijaya', '081111111111', '081222222222'),
(2, 'Hasan Abdullah', 'Fatimah Zahra', '081333333333', '081444444444');

-- =====================================================
-- Migration Complete
-- =====================================================
SELECT 'LMS Tables Migration Completed Successfully!' AS Status;
