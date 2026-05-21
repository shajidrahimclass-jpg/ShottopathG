-- Fix notifications table to match what the app expects

-- 1. Add missing order_id column
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- 2. Add 'read' column (app uses 'read', DB has 'is_read')
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;

-- 3. Add updated_at column
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Fix type constraint to include 'chat' (app uses 'chat' type)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('welcome', 'order', 'announcement', 'system', 'low_stock', 'message', 'chat'));

-- 5. Keep is_read in sync with read via trigger
CREATE OR REPLACE FUNCTION sync_notification_read()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_read := NEW.read;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_notification_read_trigger ON notifications;
CREATE TRIGGER sync_notification_read_trigger
  BEFORE INSERT OR UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION sync_notification_read();

-- 6. Create index on order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications(order_id) WHERE order_id IS NOT NULL;