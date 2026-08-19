-- Migration 007: Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID          REFERENCES shops(id)     ON DELETE CASCADE,
  customer_id     UUID          REFERENCES customers(id) ON DELETE CASCADE,
  received_by     UUID          REFERENCES users(id)     ON DELETE SET NULL,
  amount          NUMERIC(12,2) NOT NULL,
  payment_method  VARCHAR(50)   DEFAULT 'cash'
                                CHECK (payment_method IN ('cash', 'esewa', 'khalti', 'bank')),
  note            TEXT,
  payment_date    TIMESTAMP     DEFAULT NOW(),
  created_at      TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_shop_id     ON payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date        ON payments(payment_date);
