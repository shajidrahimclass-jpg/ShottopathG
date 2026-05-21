-- Migration 31: add_color_size_to_order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_color TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_size TEXT;

-- Migration 32: create_app_settings_table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT DEFAULT 'Shottopoth',
  navbar_name TEXT DEFAULT 'Shottopoth',
  favicon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (site_title, navbar_name) VALUES ('Shottopoth', 'Shottopoth') ON CONFLICT DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app settings" ON app_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can update app settings" ON app_settings FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- Migration 33: add_device_specific_images
ALTER TABLE products ADD COLUMN IF NOT EXISTS pc_images text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS mobile_images text[];

-- Migration 34: add_device_specific_thumbnails
ALTER TABLE products ADD COLUMN IF NOT EXISTS pc_thumbnail TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS mobile_thumbnail TEXT;

-- Migration 35: create_order_messages_table
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX idx_order_messages_created_at ON order_messages(created_at DESC);

ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their order messages" ON order_messages FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Users can send messages for their orders" ON order_messages FOR INSERT
  WITH CHECK (sender_role = 'user' AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Admins can read all messages" ON order_messages FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can send messages" ON order_messages FOR INSERT
  WITH CHECK (sender_role = 'admin' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update message read status" ON order_messages FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Users can update their message read status" ON order_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE order_messages;

-- Migration 36: add_chat_images_and_quick_replies
ALTER TABLE order_messages ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_quick_replies_created_by ON quick_replies(created_by);

CREATE POLICY "Admins can read quick replies" ON quick_replies FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can create quick replies" ON quick_replies FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update quick replies" ON quick_replies FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete quick replies" ON quick_replies FOR DELETE USING (is_admin(auth.uid()));

-- Migration 37: setup_chat_images_storage_v2
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-images', 'chat-images', true, 1048576, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 1048576;

-- Migration 38: add_message_deletion
ALTER TABLE order_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_order_messages_not_deleted ON order_messages(order_id, created_at) WHERE deleted_at IS NULL;

CREATE POLICY "Users can delete their own messages" ON order_messages FOR DELETE TO authenticated
  USING ((sender_role = 'user' AND order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()))
    OR (sender_role = 'admin' AND is_admin(auth.uid())));

-- Migration 39: add_notes_to_orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migration 40: add_image_url_to_announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT;