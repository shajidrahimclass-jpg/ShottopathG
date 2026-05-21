-- Create admin notification preferences table
CREATE TABLE IF NOT EXISTS admin_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  new_orders BOOLEAN DEFAULT TRUE,
  low_stock BOOLEAN DEFAULT TRUE,
  customer_messages BOOLEAN DEFAULT TRUE,
  system_events BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_notification_preferences_user_id ON admin_notification_preferences(user_id);

-- Enable RLS
ALTER TABLE admin_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for admin notification preferences
CREATE POLICY "Admins can view their own preferences"
  ON admin_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert their own preferences"
  ON admin_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update their own preferences"
  ON admin_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Update notifications table to support more types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('welcome', 'order', 'announcement', 'system', 'low_stock', 'message'));

-- Add link field for notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
