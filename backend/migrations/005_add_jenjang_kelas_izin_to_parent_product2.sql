-- Migration: Add jenjangKelasIzin field to ParentProduct2
-- Purpose: Store allowed class levels (jenjang kelas 1-12) for each Ruang Kelas

ALTER TABLE ParentProduct2 
ADD COLUMN jenjangKelasIzin JSON DEFAULT NULL 
COMMENT 'Array jenjang kelas yang diperbolehkan: ["1","2",...,"12"]';

-- Example value: ["1","2","3"] means only students in grades 1, 2, 3 can enroll
-- NULL or empty array means no restriction
