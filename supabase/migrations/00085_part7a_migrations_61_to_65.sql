-- Migration 61: create_refunds_policy_table
CREATE TABLE IF NOT EXISTS refunds_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Refunds Policy',
  content TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE refunds_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active refunds policy" ON refunds_policy FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage refunds policy" ON refunds_policy FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

INSERT INTO refunds_policy (title, content, is_active) VALUES (
  'Refunds Policy',
  '<h2>Refund and Return Policy</h2><p>We want you to be completely satisfied with your purchase.</p>',
  true
) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION update_refunds_policy_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refunds_policy_updated_at BEFORE UPDATE ON refunds_policy FOR EACH ROW EXECUTE FUNCTION update_refunds_policy_updated_at();

-- Migration 63: remove_preorder_system
DROP TABLE IF EXISTS pre_orders CASCADE;
ALTER TABLE products DROP COLUMN IF EXISTS pre_order_enabled;
ALTER TABLE products DROP COLUMN IF EXISTS expected_restock_date;

-- Migration 64: add_wishlist_and_recently_viewed
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON recently_viewed(viewed_at DESC);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist" ON wishlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own wishlist" ON wishlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from own wishlist" ON wishlist FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wishlists" ON wishlist FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own recently viewed" ON recently_viewed FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own recently viewed" ON recently_viewed FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recently viewed" ON recently_viewed FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recently viewed" ON recently_viewed FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_recently_viewed_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.viewed_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recently_viewed_timestamp_trigger BEFORE UPDATE ON recently_viewed FOR EACH ROW EXECUTE FUNCTION update_recently_viewed_timestamp();

-- Migration 65a: add_admin_notification_triggers
CREATE OR REPLACE FUNCTION notify_admins_low_stock() RETURNS TRIGGER AS $$
DECLARE admin_user RECORD;
BEGIN
  IF NEW.stock <= 5 AND NEW.stock > 0 AND NEW.is_active = true THEN
    FOR admin_user IN SELECT id FROM profiles WHERE role = 'admin' LOOP
      INSERT INTO notifications (user_id, type, title, message) VALUES (
        admin_user.id, 'system', 'Low Stock Alert',
        'Product "' || NEW.name || '" is running low. Only ' || NEW.stock || ' units remaining.'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_admins_low_stock ON products;
CREATE TRIGGER trigger_notify_admins_low_stock AFTER UPDATE OF stock ON products FOR EACH ROW
  WHEN (NEW.stock <= 5 AND NEW.stock <> OLD.stock) EXECUTE FUNCTION notify_admins_low_stock();

CREATE OR REPLACE FUNCTION notify_admins_new_message() RETURNS TRIGGER AS $$
DECLARE admin_user RECORD; sender_name TEXT;
BEGIN
  IF NEW.sender_role = 'user' THEN
    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.user_id;
    FOR admin_user IN SELECT id FROM profiles WHERE role = 'admin' LOOP
      INSERT INTO notifications (user_id, type, title, message) VALUES (
        admin_user.id, 'system', 'New Customer Message',
        'New message from ' || COALESCE(sender_name, 'Customer') || ': ' ||
        CASE WHEN LENGTH(NEW.message) > 50 THEN SUBSTRING(NEW.message, 1, 50) || '...' ELSE NEW.message END
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_admins_new_message ON order_messages;
CREATE TRIGGER trigger_notify_admins_new_message AFTER INSERT ON order_messages FOR EACH ROW EXECUTE FUNCTION notify_admins_new_message();

CREATE OR REPLACE FUNCTION notify_admins_new_order() RETURNS TRIGGER AS $$
DECLARE admin_user RECORD;
BEGIN
  FOR admin_user IN SELECT id FROM profiles WHERE role = 'admin' LOOP
    INSERT INTO notifications (user_id, type, title, message) VALUES (
      admin_user.id, 'order', 'New Order Received',
      'New order #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' for ৳' || NEW.total || ' has been placed.'
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_admins_new_order ON orders;
CREATE TRIGGER trigger_notify_admins_new_order AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION notify_admins_new_order();