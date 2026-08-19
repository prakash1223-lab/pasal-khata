-- Migration 005: Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID          REFERENCES shops(id)      ON DELETE CASCADE,
  customer_id     UUID          REFERENCES customers(id)  ON DELETE SET NULL,
  created_by      UUID          REFERENCES users(id)      ON DELETE SET NULL,
  total_amount    NUMERIC(12,2) NOT NULL,
  paid_amount     NUMERIC(12,2) DEFAULT 0,
  baki_amount     NUMERIC(12,2) DEFAULT 0,
  payment_status  VARCHAR(20)   DEFAULT 'partial'
                                CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
  notes           TEXT,
  sale_date       TIMESTAMP     DEFAULT NOW(),
  created_at      TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_shop_id     ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date   ON sales(sale_date);
