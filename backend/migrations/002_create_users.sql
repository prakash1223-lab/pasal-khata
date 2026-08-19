-- Migration 002: Create users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID        REFERENCES shops(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255),
  role          VARCHAR(20)  NOT NULL DEFAULT 'staff'
                             CHECK (role IN ('owner', 'staff')),
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_shop_id ON users(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
