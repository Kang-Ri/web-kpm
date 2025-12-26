-- Migration 010: Create Variable Templates Table
-- Purpose: Store standardized variable names for form fields

CREATE TABLE IF NOT EXISTS variableTemplates (
    idTemplate INT PRIMARY KEY AUTO_INCREMENT,
    namaVariable VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique variable name (e.g. nama_lengkap)',
    label VARCHAR(255) NOT NULL COMMENT 'Display label for dropdown',
    description TEXT COMMENT 'Optional description/hint',
    category ENUM('personal', 'academic', 'contact', 'other') DEFAULT 'other' COMMENT 'Grouping category',
    color VARCHAR(7) DEFAULT '#6B7280' COMMENT 'Hex color for visual coding',
    orderIndex INT DEFAULT 0 COMMENT 'Display order in dropdown',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Templates
INSERT INTO variableTemplates (namaVariable, label, category, color, orderIndex) VALUES
('nama_lengkap', 'Nama Lengkap', 'personal', '#3B82F6', 1),
('email', 'Email', 'contact', '#10B981', 2),
('no_hp', 'No HP/WhatsApp', 'contact', '#10B981', 3),
('tanggal_lahir', 'Tanggal Lahir', 'personal', '#3B82F6', 4),
('jenis_kelamin', 'Jenis Kelamin', 'personal', '#3B82F6', 5),
('alamat', 'Alamat', 'personal', '#3B82F6', 6),
('kelas', 'Kelas', 'academic', '#F59E0B', 7),
('nama_ortu', 'Nama Orang Tua', 'personal', '#8B5CF6', 8),
('pekerjaan_ortu', 'Pekerjaan Orang Tua', 'personal', '#8B5CF6', 9);
