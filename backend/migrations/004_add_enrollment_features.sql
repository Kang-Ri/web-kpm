-- =====================================================
-- Migration: Add Student Enrollment Features
-- Date: 2026-01-12
-- Purpose: Add visibility control and performance indexes
-- =====================================================

USE web_kpm;

-- =====================================================
-- 1. ADD VISIBILITY TOGGLE TO PARENTPRODUCT1
-- =====================================================

ALTER TABLE parentProduct1 
ADD COLUMN tampilDiDashboard BOOLEAN DEFAULT TRUE 
  COMMENT 'Show this parent1 in student enrollment dashboard' 
  AFTER status;

-- Add index for performance
CREATE INDEX idx_parent1_visibility ON parentProduct1(tampilDiDashboard);

-- =====================================================
-- 2. ADD INDEX ON JENJANGKELASIZIN FOR FILTERING
-- =====================================================

-- jenjangKelasIzin already exists in parentProduct2
-- Adding index for better query performance

CREATE INDEX idx_parent2_jenjang ON parentProduct2(jenjangKelasIzin);

-- =====================================================
-- 3. VERIFY CHANGES
-- =====================================================

-- Check new column in parentProduct1
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  COLUMN_TYPE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'web_kpm' 
  AND TABLE_NAME = 'parentProduct1' 
  AND COLUMN_NAME = 'tampilDiDashboard';

-- Check indexes on parentProduct1
SHOW INDEX FROM parentProduct1 WHERE Key_name = 'idx_parent1_visibility';

-- Check indexes on parentProduct2
SHOW INDEX FROM parentProduct2 WHERE Key_name = 'idx_parent2_jenjang';

-- Verify jenjangKelasIzin field exists
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  COLUMN_TYPE
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'web_kpm' 
  AND TABLE_NAME = 'parentProduct2' 
  AND COLUMN_NAME = 'jenjangKelasIzin';

-- =====================================================
-- 4. UPDATE EXISTING DATA (OPTIONAL)
-- =====================================================

-- Set all existing parent1 as visible by default
UPDATE parentProduct1 
SET tampilDiDashboard = TRUE 
WHERE tampilDiDashboard IS NULL;

-- =====================================================
-- 5. TEST QUERIES
-- =====================================================

-- Test: Get visible parent1 items
SELECT 
  idParent1,
  namaParent1,
  tautanProduk,
  status,
  tampilDiDashboard
FROM parentProduct1
WHERE tampilDiDashboard = TRUE
  AND status = 'Aktif'
ORDER BY tautanProduk, namaParent1;

-- Test: Get parent2 for specific grade level
SELECT 
  p2.idParent2,
  p2.namaParent2,
  p2.jenjangKelasIzin,
  p2.kapasitasMaksimal,
  p1.namaParent1
FROM parentProduct2 p2
JOIN parentProduct1 p1 ON p2.idParent1 = p1.idParent1
WHERE p2.jenjangKelasIzin = '10'
  AND p2.status = 'Aktif'
  AND p1.tampilDiDashboard = TRUE
ORDER BY p1.namaParent1, p2.namaParent2;

-- =====================================================
-- Migration Complete
-- =====================================================
SELECT 'Enrollment features migration completed successfully!' AS Status;
