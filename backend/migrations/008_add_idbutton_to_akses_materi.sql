-- Add idButton field to aksesMateri table for tracking button-level access

USE kpm_db;

ALTER TABLE aksesMateri 
ADD COLUMN idButton INT NULL 
COMMENT 'FK ke materiButton (opsional - tracking akses per button)' 
AFTER idProduk;

-- Add index for performance
CREATE INDEX idx_idButton ON aksesMateri(idButton);
