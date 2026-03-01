-- Migration: Add new transaction types for dashboard
-- Date: 2026-03-01
-- Description: Adds AJUSTE_MATERIA_PRIMA, AJUSTE_PRODUCTOS, and PRECIO transaction types to better categorize activities

-- First, remove the existing enum constraint
ALTER TABLE production_logs ALTER COLUMN transaction_type DROP DEFAULT;
ALTER TABLE production_logs DROP CONSTRAINT IF EXISTS production_logs_transaction_type_check;

-- Recreate the enum with all values
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'AJUSTE_MATERIA_PRIMA';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'AJUSTE_PRODUCTOS';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'PRECIO';

-- Restore the constraint with all values
ALTER TABLE production_logs ADD CONSTRAINT production_logs_transaction_type_check 
CHECK (transaction_type IN ('INCOMING_MATERIAL', 'PRODUCTION_RUN', 'MANUAL_ADJUSTMENT', 'DISPATCH', 'AJUSTE_MATERIA_PRIMA', 'AJUSTE_PRODUCTOS', 'PRECIO'));

-- Set a default value
ALTER TABLE production_logs ALTER COLUMN transaction_type SET DEFAULT 'MANUAL_ADJUSTMENT';

-- Optional: Update existing records to use new specific types
-- (You can uncomment these if you want to migrate existing data)
-- UPDATE production_logs SET transaction_type = 'AJUSTE_MATERIA_PRIMA' 
-- WHERE transaction_type = 'INCOMING_MATERIAL' AND description LIKE '%Ajuste manual%';

-- UPDATE production_logs SET transaction_type = 'AJUSTE_PRODUCTOS' 
-- WHERE transaction_type = 'MANUAL_ADJUSTMENT';

COMMIT;