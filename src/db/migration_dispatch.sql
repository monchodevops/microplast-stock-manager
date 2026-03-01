-- =========================================================
-- MIGRATION: Módulo de Remitos / Órdenes de Despacho
-- Fecha: 2026-02-26
-- Descripción: Crea las tablas para el módulo de salidas de
--   stock con arquitectura Cabecera-Detalle (Master-Detail).
-- =========================================================

-- 1. Ampliar el enum de transaction_type para incluir DISPATCH
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'DISPATCH';

-- 2. Tabla Cabecera: dispatch_orders
--    Almacena el encabezado de cada remito generado.
CREATE TABLE IF NOT EXISTS dispatch_orders (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number     TEXT          UNIQUE NOT NULL,  -- Ej: REM-20260228-153022 (YYYYMMDD-HHMMSS)
  client_reason    TEXT          NOT NULL,
  delivery_person  TEXT          NOT NULL,
  total_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla Detalle: dispatch_order_items
--    Almacena cada línea de producto dentro de un remito.
--    historical_unit_price preserva el precio exacto al momento
--    de la emisión, garantizando inmutabilidad financiera.
CREATE TABLE IF NOT EXISTS dispatch_order_items (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_order_id     UUID          NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
  finished_good_id      UUID          NOT NULL REFERENCES finished_goods_stock(id),
  quantity              INTEGER       NOT NULL CHECK (quantity > 0),
  historical_unit_price NUMERIC(12,2) NOT NULL,
  subtotal              NUMERIC(12,2) NOT NULL,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_dispatch_items_order  ON dispatch_order_items(dispatch_order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_items_good   ON dispatch_order_items(finished_good_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_orders_date  ON dispatch_orders(created_at DESC);
