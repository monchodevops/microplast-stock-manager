-- Migración para agregar el tipo de transacción 'MANUAL_ADJUSTMENT' al enum 'transaction_type'
-- Esto es necesario para registrar los ajustes manuales de stock de productos terminados.

ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'MANUAL_ADJUSTMENT';
