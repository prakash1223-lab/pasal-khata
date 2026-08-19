CREATE TABLE IF NOT EXISTS activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id      UUID,
  user_name    VARCHAR(255),
  action       VARCHAR(100) NOT NULL,
  table_name   VARCHAR(100),
  record_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   VARCHAR(50),
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_shop_id    ON activity_log(shop_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
