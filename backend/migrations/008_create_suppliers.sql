-- Migration 008: Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id          UUID          REFERENCES shops(id) ON DELETE CASCADE,
  name             VARCHAR(255)  NOT NULL,
  company_name     VARCHAR(255),
  phone            VARCHAR(20),
  address          TEXT,
  email            VARCHAR(255),
  total_purchased  NUMERIC(12,2) DEFAULT 0,
  total_paid       NUMERIC(12,2) DEFAULT 0,
  udharo           NUMERIC(12,2) DEFAULT 0,
  notes            TEXT,
  is_active        BOOLEAN       DEFAULT true,
  created_at       TIMESTAMP     DEFAULT NOW(),
  updated_at       TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_shop_id ON suppliers(shop_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone   ON suppliers(phone);
