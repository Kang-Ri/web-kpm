-- Migration: Add idFormDaftarUlang to ParentProduct2
-- Purpose: Link ruang kelas to duplicated form instance

ALTER TABLE ParentProduct2 
ADD COLUMN idFormDaftarUlang INT NULL COMMENT 'ID form daftar ulang (duplicated from template)';

-- Add foreign key constraint
ALTER TABLE ParentProduct2
ADD CONSTRAINT fk_parentproduct2_form
FOREIGN KEY (idFormDaftarUlang) REFERENCES form(idForm)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Index for performance
CREATE INDEX idx_parentproduct2_idFormDaftarUlang ON ParentProduct2(idFormDaftarUlang);
