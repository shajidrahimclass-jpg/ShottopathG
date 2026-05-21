
-- Create helper function first
CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    message TEXT,
    image_url TEXT,
    is_admin_message BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR get_user_role(auth.uid()) = 'admin'::user_role);
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON chat_messages FOR UPDATE TO authenticated
    USING (auth.uid() = sender_id);
CREATE POLICY "Admins manage all messages" ON chat_messages FOR ALL TO authenticated
    USING (get_user_role(auth.uid()) = 'admin'::user_role);

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ============================================================
-- PRODUCT OPTIONS
-- ============================================================
CREATE TABLE product_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    price_modifier DECIMAL(10,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product options are public" ON product_options FOR SELECT USING (true);
CREATE POLICY "Admins manage product options" ON product_options FOR ALL TO authenticated
    USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- ============================================================
-- PRODUCT BUNDLE ITEMS
-- ============================================================
CREATE TABLE product_bundle_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(bundle_id, product_id)
);

ALTER TABLE product_bundle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bundle items are public" ON product_bundle_items FOR SELECT USING (true);
CREATE POLICY "Admins manage bundle items" ON product_bundle_items FOR ALL TO authenticated
    USING (get_user_role(auth.uid()) = 'admin'::user_role);
