-- Migration: Remove legacy MANUAL_ADJUSTMENT transaction type
-- Date: 2026-03-01
-- Description: Removes the legacy MANUAL_ADJUSTMENT transaction type, migrating existing records to AJUSTE_PRODUCTOS

-- First, migrate any existing MANUAL_ADJUSTMENT records to AJUSTE_PRODUCTOS
UPDATE production_logs 
SET transaction_type = 'AJUSTE_PRODUCTOS' 
WHERE transaction_type = 'MANUAL_ADJUSTMENT';

-- Remove the existing constraint
ALTER TABLE production_logs ALTER COLUMN transaction_type DROP DEFAULT;
ALTER TABLE production_logs DROP CONSTRAINT IF EXISTS production_logs_transaction_type_check;

-- Recreate the constraint without MANUAL_ADJUSTMENT
ALTER TABLE production_logs ADD CONSTRAINT production_logs_transaction_type_check 
CHECK (transaction_type IN ('INCOMING_MATERIAL', 'PRODUCTION_RUN', 'DISPATCH', 'AJUSTE_MATERIA_PRIMA', 'AJUSTE_PRODUCTOS', 'PRECIO'));

-- Set new default value to AJUSTE_PRODUCTOS
ALTER TABLE production_logs ALTER COLUMN transaction_type SET DEFAULT 'AJUSTE_PRODUCTOS';

COMMIT;