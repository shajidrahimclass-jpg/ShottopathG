-- Create order_messages table for chat between users and admin
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX idx_order_messages_created_at ON order_messages(created_at DESC);
CREATE INDEX idx_order_messages_is_read ON order_messages(is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages for their own orders
CREATE POLICY "Users can read their order messages"
  ON order_messages
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_messages.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Users can send messages for their own orders
CREATE POLICY "Users can send messages for their orders"
  ON order_messages
  FOR INSERT
  WITH CHECK (
    sender_role = 'user' AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can read all messages
CREATE POLICY "Admins can read all messages"
  ON order_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can send messages
CREATE POLICY "Admins can send messages"
  ON order_messages
  FOR INSERT
  WITH CHECK (
    sender_role = 'admin' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update message read status
CREATE POLICY "Admins can update message read status"
  ON order_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can update their own message read status
CREATE POLICY "Users can update their message read status"
  ON order_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_messages.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Enable realtime for order_messages
ALTER PUBLICATION supabase_realtime ADD TABLE order_messages;