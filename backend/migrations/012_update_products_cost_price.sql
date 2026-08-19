-- Migration 012: Add cost_price to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) DEFAULT 0;
