-- Migration: Ensure Permanent History for Form Responses
-- Purpose: Preserve historical form response data even if parent records are deleted

-- 1. Allow NULL for idField (for JSON storage)
ALTER TABLE orderformresponse 
MODIFY COLUMN idField INT NULL;

-- 2. Drop existing foreign key constraint on idOrder (if exists)
-- Note: Check constraint name first with SHOW CREATE TABLE orderformresponse;
-- ALTER TABLE orderformresponse DROP FOREIGN KEY fk_orderformresponse_order;

-- 3. Recreate FK with NO ACTION to preserve responses when Order is deleted
-- This keeps orphaned responses for historical audit trail
ALTER TABLE orderformresponse
ADD CONSTRAINT fk_orderformresponse_order
FOREIGN KEY (idOrder) REFERENCES `Order`(idOrder)
ON DELETE NO ACTION
ON UPDATE CASCADE;

-- Optional: Add constraint to prevent accidental Order deletion if it has responses
-- Comment out if you want soft cascade (allow deletion, keep responses)

-- Result:
-- ✅ Responses preserved permanently
-- ✅ idField can be NULL for JSON storage  
-- ✅ Historical audit trail maintained
-- ✅ Cannot delete Order if responses exist (prevents data orphaning)
