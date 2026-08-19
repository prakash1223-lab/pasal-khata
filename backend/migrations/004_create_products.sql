-- Migration 004: Create products table
CREATE TABLE IF NOT EXISTS products (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id          UUID          REFERENCES shops(id) ON DELETE CASCADE,
  name             VARCHAR(255)  NOT NULL,
  category         VARCHAR(100),
  price            NUMERIC(10,2) NOT NULL,
  stock_quantity   INTEGER       DEFAULT 0,
  unit             VARCHAR(50)   DEFAULT 'piece',
  is_active        BOOLEAN       DEFAULT true,
  created_at       TIMESTAMP     DEFAULT NOW(),
  updated_at       TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
