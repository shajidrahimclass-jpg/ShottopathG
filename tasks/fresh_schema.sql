-- ============================================================
-- Shottopath E-Commerce Platform — Full Fresh Schema
-- Target DB: rixikhernphntvuwfzcy.supabase.co
-- Apply via: Supabase Dashboard → SQL Editor → Run All
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'banned', 'suspended');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'on_the_way', 'delivered', 'cancelled');
CREATE TYPE public.voucher_type AS ENUM ('percentage', 'fixed');

-- ============================================================
-- HELPER FUNCTIONS (defined before tables that use them)
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS user_role LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE VIEW public_profiles AS
  SELECT id, username, role FROM profiles;

-- Sync name from full_name / username
CREATE OR REPLACE FUNCTION sync_profile_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := COALESCE(NEW.full_name, NEW.username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_profile_name_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_name();

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage categories" ON categories FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  thumbnail TEXT,
  pc_thumbnail TEXT,
  mobile_thumbnail TEXT,
  images TEXT[] DEFAULT '{}',
  pc_images TEXT[],
  mobile_images TEXT[],
  videos TEXT[] DEFAULT '{}',
  video_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category TEXT,
  category_id UUID REFERENCES public.categories(id),
  variants JSONB DEFAULT '[]',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  pieces INTEGER DEFAULT NULL,
  user_manual TEXT,
  meta_description TEXT,
  meta_image TEXT,
  is_gift_card BOOLEAN DEFAULT false,
  profit_margin NUMERIC DEFAULT 0 CHECK (profit_margin >= 0 AND profit_margin <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_min_quantity_check CHECK (min_quantity >= 1)
);

CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_gift_card ON products(is_gift_card) WHERE is_gift_card = true;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage products" ON products FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- DELIVERY LOCATIONS
-- ============================================================
CREATE TABLE public.delivery_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_methods TEXT[] NOT NULL DEFAULT '{}',
  duration TEXT,
  min_days INTEGER NOT NULL DEFAULT 1,
  max_days INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view delivery locations" ON delivery_locations FOR SELECT USING (true);
CREATE POLICY "Admins can manage delivery locations" ON delivery_locations FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- DELIVERY ADDRESSES
-- ============================================================
CREATE TABLE public.delivery_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT DEFAULT 'Home',
  street TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'Bangladesh',
  landmark TEXT,
  address_type TEXT DEFAULT 'home' CHECK (address_type IN ('home', 'office', 'other')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own addresses" ON delivery_addresses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own addresses" ON delivery_addresses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own addresses" ON delivery_addresses FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own addresses" ON delivery_addresses FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- PAYMENT GATEWAYS
-- ============================================================
CREATE TABLE public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view payment gateways" ON payment_gateways FOR SELECT USING (true);
CREATE POLICY "Admins can manage payment gateways" ON payment_gateways FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- VOUCHERS
-- ============================================================
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type public.voucher_type NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  minimum_amount DECIMAL(10,2) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active vouchers" ON vouchers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage vouchers" ON vouchers FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_charge DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  delivery_location_id UUID REFERENCES public.delivery_locations(id),
  delivery_address JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  payment_amount TEXT CHECK (payment_amount IN ('full', 'delivery_only')),
  payment_details TEXT,
  voucher_code TEXT,
  transaction_id TEXT,
  notes TEXT,
  gift_card_email TEXT,
  guest_email TEXT,
  guest_name TEXT,
  guest_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_user_or_guest_check
    CHECK ((user_id IS NOT NULL) OR (guest_email IS NOT NULL AND guest_name IS NOT NULL AND guest_phone IS NOT NULL))
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_guest_email ON orders(guest_email) WHERE guest_email IS NOT NULL;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users and guests can view their orders" ON orders FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users and guests can create orders" ON orders FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id AND guest_email IS NULL) OR
    (auth.uid() IS NULL AND user_id IS NULL AND guest_email IS NOT NULL)
  );
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can cancel own orders" ON orders FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('pending', 'confirmed'))
  WITH CHECK (user_id = auth.uid() AND status = 'cancelled');

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  selected_color TEXT,
  selected_size TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin(auth.uid()))));
CREATE POLICY "Users can create order items" ON order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- ============================================================
-- ORDER MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  image_url TEXT,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
  is_read BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX idx_order_messages_created_at ON order_messages(created_at DESC);
CREATE INDEX idx_order_messages_not_deleted ON order_messages(order_id, created_at) WHERE deleted_at IS NULL;

ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their order messages" ON order_messages FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can send messages for their orders" ON order_messages FOR INSERT
  WITH CHECK (sender_role = 'user' AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can read all messages" ON order_messages FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can send messages" ON order_messages FOR INSERT WITH CHECK (sender_role = 'admin' AND is_admin(auth.uid()));
CREATE POLICY "Admins can update message read status" ON order_messages FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Users can update their message read status" ON order_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can delete their own messages" ON order_messages FOR DELETE TO authenticated
  USING ((sender_role = 'user' AND order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()))
    OR (sender_role = 'admin' AND is_admin(auth.uid())));

ALTER PUBLICATION supabase_realtime ADD TABLE order_messages;

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  hidden BOOLEAN DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id, order_id)
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_is_anonymous ON reviews(is_anonymous);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View reviews based on hidden status" ON reviews FOR SELECT
  USING (hidden = false OR user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Users can create reviews for their orders" ON reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM orders WHERE orders.id = reviews.order_id AND orders.user_id = auth.uid()
    AND orders.status IN ('confirmed', 'on_the_way', 'delivered')
  ));
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Admins can delete reviews" ON reviews FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- REVIEW HELPFUL VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view review helpful votes" ON review_helpful_votes FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert their own votes" ON review_helpful_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own votes within 24 hours" ON review_helpful_votes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours') WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes" ON review_helpful_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_review_helpful_counts() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSE UPDATE reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id; END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_helpful AND NOT NEW.is_helpful THEN
      UPDATE reviews SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    ELSIF NOT OLD.is_helpful AND NEW.is_helpful THEN
      UPDATE reviews SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    ELSE UPDATE reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.review_id; END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_review_helpful_counts
  AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes
  FOR EACH ROW EXECUTE FUNCTION update_review_helpful_counts();

-- ============================================================
-- REVIEW RESPONSES
-- ============================================================
CREATE TABLE IF NOT EXISTS review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_review_responses_review_id ON review_responses(review_id);
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view review responses" ON review_responses FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own responses" ON review_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own responses" ON review_responses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own responses" ON review_responses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  copyable_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active announcements" ON announcements FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  link TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  page TEXT DEFAULT 'home',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT banners_page_check CHECK (page IN ('home', 'products'))
);

CREATE INDEX idx_banners_order ON banners(display_order, created_at);
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active banners" ON banners FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can insert banners" ON banners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update banners" ON banners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete banners" ON banners FOR DELETE TO authenticated USING (true);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read BOOLEAN NOT NULL DEFAULT false,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  link TEXT,
  data JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_type_check CHECK (type IN ('welcome', 'order', 'announcement', 'system', 'low_stock', 'message', 'chat'))
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_order_id ON notifications(order_id) WHERE order_id IS NOT NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Sync is_read ↔ read
CREATE OR REPLACE FUNCTION sync_notification_read()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_read := NEW.read;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_notification_read_trigger
  BEFORE INSERT OR UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION sync_notification_read();

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
-- QUICK REPLIES
-- ============================================================
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

-- ============================================================
-- TERMS AND CONDITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.terms_and_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.terms_and_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active terms" ON terms_and_conditions FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage terms" ON terms_and_conditions FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- USER MANUAL
-- ============================================================
CREATE TABLE user_manual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_manual_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_manual_id UUID NOT NULL REFERENCES user_manual(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, user_manual_id)
);

CREATE INDEX idx_user_manual_acceptances_user_id ON user_manual_acceptances(user_id);
CREATE INDEX idx_user_manual_acceptances_manual_id ON user_manual_acceptances(user_manual_id);

ALTER TABLE user_manual ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_manual_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active user manuals" ON user_manual FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage user manuals" ON user_manual FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view their own manual acceptances" ON user_manual_acceptances FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own manual acceptances" ON user_manual_acceptances FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all manual acceptances" ON user_manual_acceptances FOR SELECT USING (is_admin(auth.uid()));

-- ============================================================
-- PRODUCT USER MANUAL ACCEPTANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_user_manual_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE product_user_manual_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own product manual acceptances" ON product_user_manual_acceptances FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own product manual acceptances" ON product_user_manual_acceptances FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all product manual acceptances" ON product_user_manual_acceptances FOR SELECT USING (is_admin(auth.uid()));
CREATE INDEX idx_product_manual_acceptances_user_product ON product_user_manual_acceptances(user_id, product_id);

-- ============================================================
-- INVOICE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Shottopoth',
  company_logo TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  tax_id TEXT,
  terms_and_conditions TEXT,
  custom_notes TEXT,
  footer_text TEXT DEFAULT 'Thank you for shopping with us!',
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_routing_number TEXT,
  show_logo BOOLEAN DEFAULT false,
  show_tax_id BOOLEAN DEFAULT false,
  show_bank_details BOOLEAN DEFAULT false,
  qr_code_content TEXT,
  show_qr_code BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage invoice settings" ON invoice_settings FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can read invoice settings" ON invoice_settings FOR SELECT TO authenticated USING (true);

-- ============================================================
-- APP SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT DEFAULT 'Shottopoth',
  navbar_name TEXT DEFAULT 'Shottopoth',
  site_description TEXT,
  favicon_url TEXT,
  default_meta_image TEXT,
  copyright_year TEXT DEFAULT '2026',
  copyright_company TEXT DEFAULT 'Shottopoth',
  admin_url_path TEXT NOT NULL DEFAULT '/pass-43726fshf88w93uh78ww39/admin/39uwfwh98rw38ef',
  force_sign_in BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT admin_url_path_format CHECK (admin_url_path ~ '^/[a-zA-Z0-9/_-]+$')
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app settings" ON app_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can update app settings" ON app_settings FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- REFUNDS POLICY
-- ============================================================
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

CREATE OR REPLACE FUNCTION update_refunds_policy_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER refunds_policy_updated_at BEFORE UPDATE ON refunds_policy FOR EACH ROW EXECUTE FUNCTION update_refunds_policy_updated_at();

-- ============================================================
-- ADMIN NOTIFICATION PREFERENCES
-- ============================================================
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

CREATE INDEX idx_admin_notification_preferences_user_id ON admin_notification_preferences(user_id);
ALTER TABLE admin_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view their own preferences" ON admin_notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert their own preferences" ON admin_notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update their own preferences" ON admin_notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- REDEEM CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS redeem_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  value NUMERIC NOT NULL CHECK (value > 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'redeemed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_in_order UUID REFERENCES orders(id) ON DELETE SET NULL,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_redeem_codes_code ON redeem_codes(code);
CREATE INDEX idx_redeem_codes_status ON redeem_codes(status);
CREATE INDEX idx_redeem_codes_purchased_by ON redeem_codes(purchased_by);

ALTER TABLE redeem_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage redeem codes" ON redeem_codes FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view available redeem codes" ON redeem_codes FOR SELECT TO authenticated USING (status = 'available' OR purchased_by = auth.uid());
CREATE POLICY "Users can view their purchased codes" ON redeem_codes FOR SELECT TO authenticated USING (purchased_by = auth.uid());

-- ============================================================
-- PRODUCT BUNDLES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bundle_discount_percent NUMERIC DEFAULT 0 CHECK (bundle_discount_percent >= 0 AND bundle_discount_percent <= 100),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, related_product_id)
);

CREATE INDEX idx_product_bundles_product_id ON product_bundles(product_id);
CREATE INDEX idx_product_bundles_active ON product_bundles(is_active);

ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active bundles" ON product_bundles FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage bundles" ON product_bundles FOR ALL TO authenticated USING (is_admin(auth.uid()));

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
-- STOCK MOVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all stock movements" ON stock_movements FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can create stock movements" ON stock_movements FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

-- ============================================================
-- BUNDLE ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS bundle_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  selections INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  discount_given NUMERIC DEFAULT 0,
  last_selected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bundle_analytics_bundle_id ON bundle_analytics(bundle_id);
ALTER TABLE bundle_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view bundle analytics" ON bundle_analytics FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage bundle analytics" ON bundle_analytics FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION create_bundle_analytics() RETURNS TRIGGER AS $$
BEGIN INSERT INTO bundle_analytics (bundle_id) VALUES (NEW.id); RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trigger_create_bundle_analytics AFTER INSERT ON product_bundles FOR EACH ROW EXECUTE FUNCTION create_bundle_analytics();

-- ============================================================
-- SUGGESTED BUNDLES
-- ============================================================
CREATE TABLE IF NOT EXISTS suggested_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  suggested_discount_percent NUMERIC DEFAULT 0 CHECK (suggested_discount_percent >= 0 AND suggested_discount_percent <= 100),
  co_purchase_count INTEGER DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  expected_revenue_impact NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, related_product_id)
);

CREATE INDEX idx_suggested_bundles_status ON suggested_bundles(status);
CREATE INDEX idx_suggested_bundles_product_id ON suggested_bundles(product_id);
ALTER TABLE suggested_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view suggested bundles" ON suggested_bundles FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage suggested bundles" ON suggested_bundles FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- WISHLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wishlist" ON wishlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own wishlist" ON wishlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from own wishlist" ON wishlist FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wishlists" ON wishlist FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- RECENTLY VIEWED
-- ============================================================
CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_recently_viewed_user_id ON recently_viewed(user_id);
CREATE INDEX idx_recently_viewed_viewed_at ON recently_viewed(viewed_at DESC);
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recently viewed" ON recently_viewed FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own recently viewed" ON recently_viewed FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recently viewed" ON recently_viewed FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recently viewed" ON recently_viewed FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_recently_viewed_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.viewed_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_recently_viewed_timestamp_trigger BEFORE UPDATE ON recently_viewed FOR EACH ROW EXECUTE FUNCTION update_recently_viewed_timestamp();

-- ============================================================
-- GIFT CARD TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS gift_card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  occasion TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  header_text TEXT NOT NULL,
  greeting_message TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#10b981',
  secondary_color TEXT NOT NULL DEFAULT '#059669',
  emoji TEXT NOT NULL DEFAULT '🎁',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gift_card_templates_occasion ON gift_card_templates(occasion);
CREATE INDEX idx_gift_card_templates_active ON gift_card_templates(is_active);

-- ============================================================
-- APP DOWNLOADS
-- ============================================================
CREATE TABLE IF NOT EXISTS app_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('google_play', 'microsoft_store', 'app_store', 'apk', 'exe')),
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT,
  file_url TEXT,
  version TEXT,
  file_size TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_app_downloads_platform ON app_downloads(platform);
CREATE INDEX idx_app_downloads_is_active ON app_downloads(is_active);
CREATE INDEX idx_app_downloads_display_order ON app_downloads(display_order);

ALTER TABLE app_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active app downloads" ON app_downloads FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can view all app downloads" ON app_downloads FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert app downloads" ON app_downloads FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update app downloads" ON app_downloads FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete app downloads" ON app_downloads FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- ============================================================
-- APP DOWNLOAD ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS app_download_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT, ip_address TEXT, country TEXT, region TEXT, city TEXT,
  device_type TEXT, os_name TEXT, os_version TEXT, browser_name TEXT, browser_version TEXT,
  screen_width INT, screen_height INT, referrer_url TEXT,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_term TEXT, utm_content TEXT,
  page_variant TEXT, viewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_download_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  download_id UUID REFERENCES app_downloads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT, ip_address TEXT, country TEXT, region TEXT, city TEXT,
  device_type TEXT, os_name TEXT, os_version TEXT, browser_name TEXT, browser_version TEXT,
  screen_width INT, screen_height INT, referrer_url TEXT,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_term TEXT, utm_content TEXT,
  page_variant TEXT, download_method TEXT, downloaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_download_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_download_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert page views" ON app_download_page_views FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view all page views" ON app_download_page_views FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can insert download analytics" ON app_download_analytics FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view all download analytics" ON app_download_analytics FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can view their own download analytics" ON app_download_analytics FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_page_views_viewed_at ON app_download_page_views(viewed_at DESC);
CREATE INDEX idx_download_analytics_downloaded_at ON app_download_analytics(downloaded_at DESC);
CREATE INDEX idx_download_analytics_download_id ON app_download_analytics(download_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('app-9cyfgucqbpj5_shottopoth_images', 'app-9cyfgucqbpj5_shottopoth_images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('invoice-logos', 'invoice-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-images', 'chat-images', true, 1048576, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 1048576;
INSERT INTO storage.buckets (id, name, public) VALUES ('app-files', 'app-files', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view images" ON storage.objects FOR SELECT USING (bucket_id = 'app-9cyfgucqbpj5_shottopoth_images');
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'app-9cyfgucqbpj5_shottopoth_images');
CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'app-9cyfgucqbpj5_shottopoth_images');
CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'app-9cyfgucqbpj5_shottopoth_images');

-- ============================================================
-- AUTH TRIGGERS
-- ============================================================

-- Welcome notification (type must match CHECK constraint)
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.id, 'Welcome to Shottopoth!', 'Thank you for joining us. Start exploring our products and enjoy shopping!', 'welcome');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_welcome_notification();

-- Handle new user (supports email/password + OAuth)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
  new_username TEXT;
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', split_part(NEW.id::text, '-', 1));
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name');
  SELECT COUNT(*) INTO user_count FROM profiles;
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'user_name',
    split_part(user_email, '@', 1),
    'user_' || substr(NEW.id::text, 1, 8)
  );
  new_username := regexp_replace(new_username, '[^a-zA-Z0-9_]', '_', 'g');
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    new_username := new_username || '_' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;
  INSERT INTO public.profiles (id, email, username, full_name, name, phone, role)
  VALUES (
    NEW.id, user_email, new_username, user_full_name,
    COALESCE(user_full_name, new_username), NEW.phone,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- INSERT trigger for OAuth users (arrive with confirmed_at already set)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- UPDATE trigger for email/password signups
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ADMIN NOTIFICATION TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admins_new_order() RETURNS TRIGGER AS $$
DECLARE admin_user RECORD;
BEGIN
  FOR admin_user IN SELECT id FROM profiles WHERE role = 'admin' LOOP
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (admin_user.id, 'order', 'New Order Received',
      'New order #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' for ৳' || NEW.total || ' has been placed.',
      '/admin/orders/' || NEW.id);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_admins_new_order ON orders;
CREATE TRIGGER trigger_notify_admins_new_order AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION notify_admins_new_order();

CREATE OR REPLACE FUNCTION notify_admins_low_stock() RETURNS TRIGGER AS $$
DECLARE admin_user RECORD;
BEGIN
  IF NEW.stock <= 5 AND NEW.stock > 0 AND NEW.is_active = true THEN
    FOR admin_user IN SELECT id FROM profiles WHERE role = 'admin' LOOP
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (admin_user.id, 'system', 'Low Stock Alert',
        'Product "' || NEW.name || '" is running low. Only ' || NEW.stock || ' units remaining.');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_admins_low_stock ON products;
CREATE TRIGGER trigger_notify_admins_low_stock AFTER UPDATE OF stock ON products
  FOR EACH ROW WHEN (NEW.stock <= 5 AND NEW.stock <> OLD.stock)
  EXECUTE FUNCTION notify_admins_low_stock();

CREATE OR REPLACE FUNCTION notify_admins_new_message() RETURNS TRIGGER AS $$
DECLARE admin_user RECORD; sender_name TEXT;
BEGIN
  IF NEW.sender_role = 'user' THEN
    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.user_id;
    FOR admin_user IN SELECT id FROM profiles WHERE role = 'admin' LOOP
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (admin_user.id, 'system', 'New Customer Message',
        'New message from ' || COALESCE(sender_name, 'Customer') || ': ' ||
        CASE WHEN LENGTH(NEW.message) > 50 THEN SUBSTRING(NEW.message, 1, 50) || '...' ELSE NEW.message END);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_admins_new_message ON order_messages;
CREATE TRIGGER trigger_notify_admins_new_message AFTER INSERT ON order_messages FOR EACH ROW EXECUTE FUNCTION notify_admins_new_message();

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO public.delivery_locations (name, charge, payment_methods, duration, min_days, max_days) VALUES
  ('Dhaka', 50, ARRAY['cash_on_delivery', 'bkash', 'nagad'], '1-2 days', 1, 2),
  ('Dhaka Outer City', 100, ARRAY['bkash', 'nagad'], '2-3 days', 2, 3),
  ('Out of Dhaka', 150, ARRAY['bkash', 'nagad'], '3-5 days', 3, 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.payment_gateways (name, is_enabled, config) VALUES
  ('Cash on Delivery', true, '{}'),
  ('Bkash', true, '{}'),
  ('Nagad', true, '{}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO invoice_settings (company_name, company_address, company_phone, company_email, footer_text)
VALUES ('Shottopoth', 'Dhaka, Bangladesh', '+880 1234567890', 'support@shottopoth.com', 'Thank you for shopping with Shottopoth!')
ON CONFLICT DO NOTHING;

INSERT INTO app_settings (site_title, navbar_name, site_description, copyright_year, copyright_company, force_sign_in)
VALUES ('Shottopoth', 'Shottopoth', 'Shottopoth - Your trusted e-commerce platform for quality products and seamless shopping experience.', '2026', 'Shottopoth', true)
ON CONFLICT DO NOTHING;

INSERT INTO refunds_policy (title, content, is_active) VALUES (
  'Refunds Policy',
  '<h2>Refund and Return Policy</h2><p>We want you to be completely satisfied with your purchase. Items may be returned within 30 days of delivery for a full refund or exchange.</p>',
  true
) ON CONFLICT DO NOTHING;

INSERT INTO user_manual (title, content, is_active)
VALUES ('User Manual', 'Welcome to Shottopoth! Admin can edit this content from the Settings page.', false)
ON CONFLICT DO NOTHING;

INSERT INTO gift_card_templates (name, occasion, subject_line, header_text, greeting_message, primary_color, secondary_color, emoji) VALUES
('General Gift Card', 'general', '🎁 Your Gift Card from {siteName}', 'You''ve Received a Gift Card!', 'Great news! You''ve received a gift card from {siteName}.', '#10b981', '#059669', '🎁'),
('Birthday Gift Card', 'birthday', '🎂 Happy Birthday! Your Gift Card from {siteName}', 'Happy Birthday! 🎉', 'Happy Birthday, {recipientName}! Here''s a gift card to celebrate!', '#ec4899', '#db2777', '🎂'),
('Holiday Gift Card', 'holiday', '🎄 Season''s Greetings! Your Gift Card from {siteName}', 'Happy Holidays! ✨', 'Season''s Greetings, {recipientName}! Enjoy your gift card!', '#dc2626', '#b91c1c', '🎄'),
('Thank You Gift Card', 'thankyou', '💝 Thank You! Your Gift Card from {siteName}', 'Thank You! 💝', 'Dear {recipientName}, thank you for your loyalty! Here''s a special gift.', '#8b5cf6', '#7c3aed', '💝'),
('Congratulations Gift Card', 'congratulations', '🎊 Congratulations! Your Gift Card from {siteName}', 'Congratulations! 🎊', 'Congratulations, {recipientName}! Enjoy your gift card!', '#f59e0b', '#d97706', '🎊')
ON CONFLICT DO NOTHING;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
