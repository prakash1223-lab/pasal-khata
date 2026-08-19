-- Migration 009: Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id          UUID         REFERENCES shops(id)     ON DELETE CASCADE,
  supplier_id      UUID         REFERENCES suppliers(id) ON DELETE SET NULL,
  created_by       UUID         REFERENCES users(id)     ON DELETE SET NULL,
  invoice_number   VARCHAR(100),
  total_amount     NUMERIC(12,2) NOT NULL,
  paid_amount      NUMERIC(12,2) DEFAULT 0,
  udharo_amount    NUMERIC(12,2) DEFAULT 0,
  payment_status   VARCHAR(20)   DEFAULT 'partial'
                   CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
  notes            TEXT,
  purchase_date    TIMESTAMP     DEFAULT NOW(),
  created_at       TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_shop_id       ON purchases(shop_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id   ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
