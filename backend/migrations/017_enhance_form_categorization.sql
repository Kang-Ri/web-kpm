-- Migration 017: Enhance form table for categorization and product linking
-- Purpose: Distinguish between template forms and product-specific forms

-- Add columns to form table
ALTER TABLE form
ADD COLUMN formType ENUM('template', 'product', 'daftar_ulang') DEFAULT 'template' COMMENT 'Form category: template (master), product (duplicated), daftar_ulang (enrollment)',
ADD COLUMN idProdukLinked INT NULL COMMENT 'FK to product table - which product owns this form (for product-specific forms)',
ADD COLUMN idFormTemplate INT NULL COMMENT 'FK to form table - reference to original template (for tracking duplication source)';

-- Add foreign key constraints
ALTER TABLE form
ADD CONSTRAINT fk_form_product 
    FOREIGN KEY (idProdukLinked) REFERENCES product(idProduk) 
    ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_form_template 
    FOREIGN KEY (idFormTemplate) REFERENCES form(idForm) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_form_type ON form(formType);
CREATE INDEX idx_form_product ON form(idProdukLinked);
CREATE INDEX idx_form_template ON form(idFormTemplate);

-- Update existing forms to be templates (backward compatibility)
-- Any form that is currently referenced by ParentProduct2.idFormDaftarUlang should be 'daftar_ulang'
UPDATE form f
SET f.formType = 'daftar_ulang'
WHERE f.idForm IN (
    SELECT DISTINCT idFormDaftarUlang 
    FROM parentproduct2 
    WHERE idFormDaftarUlang IS NOT NULL
);

-- Log migration
INSERT INTO migration_log (migration_name, executed_at) 
VALUES ('017_enhance_form_categorization', NOW());
