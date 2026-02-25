-- Migration: Add unit_price to finished_goods_stock
-- Run this in the Supabase SQL Editor

ALTER TABLE finished_goods_stock
  ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;
