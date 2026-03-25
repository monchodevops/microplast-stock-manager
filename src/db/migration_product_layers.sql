-- Migration: Add layers_config to product_definitions for multi-layer tank recipes
-- This is backward-compatible: NULL means mono-layer (no change to existing products).
-- Format (JSONB array): [{order: 1, consumption_kg: 15.0}, {order: 2, consumption_kg: 10.0}, ...]
-- Only products in the "Tanques" category will use this field.

ALTER TABLE product_definitions
  ADD COLUMN IF NOT EXISTS layers_config jsonb DEFAULT NULL;

-- Optional: add a comment to document the column
COMMENT ON COLUMN product_definitions.layers_config IS
  'Null for mono-layer products. JSON array of {order, consumption_kg} for bi/tri-layer Tanques.';
