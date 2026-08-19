-- Migration 006: Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       UUID          REFERENCES sales(id)    ON DELETE CASCADE,
  product_id    UUID          REFERENCES products(id) ON DELETE SET NULL,
  product_name  VARCHAR(255)  NOT NULL,
  quantity      NUMERIC(10,2) NOT NULL,
  unit_price    NUMERIC(10,2) NOT NULL,
  total_price   NUMERIC(12,2) NOT NULL,
  created_at    TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id    ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
