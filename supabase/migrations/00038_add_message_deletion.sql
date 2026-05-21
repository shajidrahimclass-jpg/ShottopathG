-- Add deleted_at column to order_messages for soft delete
ALTER TABLE order_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for non-deleted messages
CREATE INDEX IF NOT EXISTS idx_order_messages_not_deleted ON order_messages(order_id, created_at) WHERE deleted_at IS NULL;

-- Update RLS policy to allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON order_messages FOR DELETE
TO authenticated
USING (
  (sender_role = 'user' AND order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()))
  OR
  (sender_role = 'admin' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);