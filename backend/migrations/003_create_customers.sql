-- Migration 003: Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id          UUID          REFERENCES shops(id) ON DELETE CASCADE,
  name             VARCHAR(255)  NOT NULL,
  phone            VARCHAR(20),
  address          TEXT,
  total_purchased  NUMERIC(12,2) DEFAULT 0,
  total_paid       NUMERIC(12,2) DEFAULT 0,
  baki             NUMERIC(12,2) DEFAULT 0,
  created_at       TIMESTAMP     DEFAULT NOW(),
  updated_at       TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone   ON customers(phone);

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
