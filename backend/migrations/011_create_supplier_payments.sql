-- Migration 011: Create supplier_payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID         REFERENCES shops(id)     ON DELETE CASCADE,
  supplier_id     UUID         REFERENCES suppliers(id) ON DELETE CASCADE,
  purchase_id     UUID         REFERENCES purchases(id) ON DELETE SET NULL,
  paid_by         UUID         REFERENCES users(id)     ON DELETE SET NULL,
  amount          NUMERIC(12,2) NOT NULL,
  payment_method  VARCHAR(50)   DEFAULT 'cash'
                  CHECK (payment_method IN ('cash', 'esewa', 'khalti', 'bank', 'cheque')),
  note            TEXT,
  payment_date    TIMESTAMP     DEFAULT NOW(),
  created_at      TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_shop_id     ON supplier_payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON supplier_payments(supplier_id);
