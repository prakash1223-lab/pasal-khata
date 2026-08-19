-- Migration 010: Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id   UUID          REFERENCES purchases(id) ON DELETE CASCADE,
  product_id    UUID          REFERENCES products(id)  ON DELETE SET NULL,
  product_name  VARCHAR(255)  NOT NULL,
  quantity      NUMERIC(10,2) NOT NULL,
  unit          VARCHAR(50),
  cost_price    NUMERIC(10,2) NOT NULL,
  total_price   NUMERIC(12,2) NOT NULL,
  created_at    TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
