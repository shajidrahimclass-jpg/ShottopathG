-- =========================================================================
-- ALL COMBINED MIGRATIONS FOR SHOTTOPATH
-- =========================================================================

-- -----------------------------------------------------
-- Start of File: 00077_part1_migrations_1_to_10.sql
-- -----------------------------------------------------

-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'banned', 'suspended');

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'delivered');

-- Create voucher type enum
CREATE TYPE public.voucher_type AS ENUM ('percentage', 'fixed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create delivery addresses table
CREATE TABLE public.delivery_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create delivery locations table
CREATE TABLE public.delivery_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_methods TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payment gateways table
CREATE TABLE public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type public.voucher_type NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_charge DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  delivery_location_id UUID REFERENCES public.delivery_locations(id),
  delivery_address JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  voucher_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id, order_id)
);

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Create function to handle new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  new_username text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Extract username from email (before @)
  new_username := split_part(NEW.email, '@', 1);
  
  -- Insert a profile synced with fields collected at signup
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    new_username,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- Create public profiles view
CREATE VIEW public_profiles AS
  SELECT id, username, role FROM profiles;

-- RLS Policies for delivery_addresses
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses" ON delivery_addresses
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own addresses" ON delivery_addresses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses" ON delivery_addresses
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses" ON delivery_addresses
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS Policies for delivery_locations
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view delivery locations" ON delivery_locations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage delivery locations" ON delivery_locations
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for payment_gateways
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payment gateways" ON payment_gateways
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage payment gateways" ON payment_gateways
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage products" ON products
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for vouchers
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vouchers" ON vouchers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage vouchers" ON vouchers
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin(auth.uid())))
  );

CREATE POLICY "Users can create order items" ON order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- RLS Policies for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for delivered orders" ON reviews
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM orders WHERE orders.id = reviews.order_id AND orders.user_id = auth.uid() AND orders.status = 'delivered')
  );

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete reviews" ON reviews
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Migration 2: add_name_to_profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Migration 3: add_product_variants_and_announcements
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]';

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Migration 4: add_product_categories
CREATE TABLE IF NOT EXISTS public.categories (
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

CREATE POLICY "Anyone can view active categories" ON categories
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Migration 5: create_notifications_table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Migration 6: create_welcome_notification_trigger
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Welcome to Shottopoth!',
    'Thank you for joining us. Start exploring our products and enjoy shopping!',
    'success'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_welcome_notification();

-- Migration 7: add_multiple_images_and_videos
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Migration 8: add_transaction_id_to_orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Migration 9: create_terms_and_conditions
CREATE TABLE IF NOT EXISTS public.terms_and_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.terms_and_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active terms" ON terms_and_conditions
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage terms" ON terms_and_conditions
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Migration 10: add_delivery_duration
ALTER TABLE public.delivery_locations
  ADD COLUMN IF NOT EXISTS min_days INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_days INTEGER NOT NULL DEFAULT 3;

-- -----------------------------------------------------
-- End of File: 00077_part1_migrations_1_to_10.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00078_part2a_migrations_11_to_17.sql
-- -----------------------------------------------------

-- Migration 11: create_banners_table
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  link TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners" ON banners FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can insert banners" ON banners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update banners" ON banners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete banners" ON banners FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_banners_order ON banners(display_order, created_at);

-- Migration 12: add_product_slug_and_banner_storage
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;

-- Migration 16: add_cancelled_status
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled';

-- -----------------------------------------------------
-- End of File: 00078_part2a_migrations_11_to_17.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00079_part2b_migrations_17_to_20.sql
-- -----------------------------------------------------

-- Migration 17: allow_user_cancel_orders
CREATE POLICY "Users can cancel own orders" ON orders FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('pending', 'confirmed'))
  WITH CHECK (user_id = auth.uid() AND status = 'cancelled');

-- Migration 18: add_hidden_field_to_reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;
UPDATE reviews SET hidden = false WHERE hidden IS NULL;

-- Migration 19: update_reviews_policies_for_hidden
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "View reviews based on hidden status" ON reviews FOR SELECT
  USING (hidden = false OR user_id = auth.uid() OR is_admin(auth.uid()));

-- Migration 20: add_page_field_to_banners
ALTER TABLE banners ADD COLUMN IF NOT EXISTS page TEXT DEFAULT 'home';
ALTER TABLE banners ADD CONSTRAINT banners_page_check CHECK (page IN ('home', 'products'));
UPDATE banners SET page = 'home' WHERE page IS NULL;

-- -----------------------------------------------------
-- End of File: 00079_part2b_migrations_17_to_20.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00080_part3a_migrations_21_to_24.sql
-- -----------------------------------------------------

-- Migration 21: add_payment_amount_to_orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_amount TEXT CHECK (payment_amount IN ('full', 'delivery_only'));

-- Migration 22: create_user_manual_system
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

INSERT INTO user_manual (title, content, is_active) VALUES ('User Manual', 'Welcome to Shottopoth! Admin can edit this content from the Settings page.', false);

-- Migration 23: add_product_user_manual
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_manual TEXT;

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

-- Migration 24: add_on_the_way_status
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'on_the_way';

-- -----------------------------------------------------
-- End of File: 00080_part3a_migrations_21_to_24.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00081_part3b_migrations_25_to_30_v2.sql
-- -----------------------------------------------------

-- Migration 25: create_invoice_settings
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO invoice_settings (company_name, company_address, company_phone, company_email, footer_text)
VALUES ('Shottopoth', 'Dhaka, Bangladesh', '+880 1234567890', 'support@shottopoth.com', 'Thank you for shopping with Shottopoth!')
ON CONFLICT DO NOTHING;

ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage invoice settings" ON invoice_settings FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can read invoice settings" ON invoice_settings FOR SELECT TO authenticated USING (true);

-- Migration 26: add_qr_code_to_invoice_settings
ALTER TABLE invoice_settings ADD COLUMN IF NOT EXISTS qr_code_content TEXT;
ALTER TABLE invoice_settings ADD COLUMN IF NOT EXISTS show_qr_code BOOLEAN DEFAULT false;

-- Migration 27/28: create_invoice_logos_bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('invoice-logos', 'invoice-logos', true) ON CONFLICT (id) DO NOTHING;

-- Migration 29: add_thumbnail_to_products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Migration 30: add_minimum_amount_to_vouchers
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS minimum_amount DECIMAL(10, 2) DEFAULT NULL;

-- -----------------------------------------------------
-- End of File: 00081_part3b_migrations_25_to_30_v2.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00082_part4_migrations_31_to_40_v2.sql
-- -----------------------------------------------------

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

-- -----------------------------------------------------
-- End of File: 00082_part4_migrations_31_to_40_v2.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00083_part5_migrations_41_to_50.sql
-- -----------------------------------------------------

-- Migration 41: update_review_policy_allow_confirmed_orders
DROP POLICY IF EXISTS "Users can create reviews for delivered orders" ON reviews;
CREATE POLICY "Users can create reviews for their orders" ON reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM orders WHERE orders.id = reviews.order_id AND orders.user_id = auth.uid()
    AND orders.status IN ('confirmed', 'on_the_way', 'delivered')
  ));

-- Migration 42: create_redeem_codes_table
CREATE TABLE IF NOT EXISTS redeem_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  value numeric NOT NULL CHECK (value > 0),
  price numeric NOT NULL CHECK (price >= 0),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'redeemed')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  purchased_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_in_order uuid REFERENCES orders(id) ON DELETE SET NULL,
  expiry_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_redeem_codes_code ON redeem_codes(code);
CREATE INDEX idx_redeem_codes_status ON redeem_codes(status);
CREATE INDEX idx_redeem_codes_purchased_by ON redeem_codes(purchased_by);

ALTER TABLE redeem_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage redeem codes" ON redeem_codes FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view available redeem codes" ON redeem_codes FOR SELECT TO authenticated USING (status = 'available' OR purchased_by = auth.uid());
CREATE POLICY "Users can view their purchased codes" ON redeem_codes FOR SELECT TO authenticated USING (purchased_by = auth.uid());

-- Migration 43: create_redeem_code_products_table
CREATE TABLE IF NOT EXISTS redeem_code_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  redeem_code_ids text[] DEFAULT '{}',
  price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE redeem_code_products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_redeem_code_products_name ON redeem_code_products(name);

CREATE POLICY "Admins can manage redeem code products" ON redeem_code_products FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view redeem code products" ON redeem_code_products FOR SELECT TO public USING (true);

-- Migration 44: add_site_description_to_app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS site_description TEXT;
UPDATE app_settings SET site_description = 'Shottopoth - Your trusted e-commerce platform for quality products and seamless shopping experience.' WHERE site_description IS NULL;

-- Migration 45: add_min_quantity_to_products
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE products ADD CONSTRAINT products_min_quantity_check CHECK (min_quantity >= 1);

-- Migration 46: add_meta_fields_to_products
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_image TEXT;

-- Migration 47: add_default_meta_image_to_app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS default_meta_image TEXT;

-- Migration 48: enhance_delivery_addresses
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS label TEXT DEFAULT 'Home';
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Bangladesh';
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS address_type TEXT DEFAULT 'home' CHECK (address_type IN ('home', 'office', 'other'));

-- Migration 49: enhance_redeem_code_products
ALTER TABLE redeem_code_products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE redeem_code_products ADD COLUMN IF NOT EXISTS pc_image TEXT;
ALTER TABLE redeem_code_products ADD COLUMN IF NOT EXISTS mobile_image TEXT;
CREATE INDEX IF NOT EXISTS idx_redeem_code_products_slug ON redeem_code_products(slug);

-- Migration 50: add_category_to_redeem_code_products
ALTER TABLE redeem_code_products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE redeem_code_products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;
CREATE INDEX IF NOT EXISTS idx_redeem_code_products_category ON redeem_code_products(category_id);
CREATE INDEX IF NOT EXISTS idx_redeem_code_products_active ON redeem_code_products(is_active);

-- -----------------------------------------------------
-- End of File: 00083_part5_migrations_41_to_50.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00084_part6_migrations_51_to_60.sql
-- -----------------------------------------------------

-- Migration 52: remove_redeem_code_products_table
DROP TABLE IF EXISTS redeem_code_products CASCADE;

-- Migration 53: add_copyable_text_to_announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS copyable_text text;

-- Migration 54: create_product_bundles
CREATE TABLE IF NOT EXISTS product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bundle_discount_percent numeric DEFAULT 0 CHECK (bundle_discount_percent >= 0 AND bundle_discount_percent <= 100),
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, related_product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_bundles_product_id ON product_bundles(product_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_active ON product_bundles(is_active);

ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active bundles" ON product_bundles FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage bundles" ON product_bundles FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Migration 55: create_stock_and_bundle_analytics
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_margin numeric DEFAULT 0 CHECK (profit_margin >= 0 AND profit_margin <= 100);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL CHECK (quantity > 0),
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  reason text,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

CREATE TABLE IF NOT EXISTS bundle_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  views integer DEFAULT 0,
  selections integer DEFAULT 0,
  purchases integer DEFAULT 0,
  revenue_generated numeric DEFAULT 0,
  discount_given numeric DEFAULT 0,
  last_selected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bundle_analytics_bundle_id ON bundle_analytics(bundle_id);

CREATE TABLE IF NOT EXISTS suggested_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  suggested_discount_percent numeric DEFAULT 0 CHECK (suggested_discount_percent >= 0 AND suggested_discount_percent <= 100),
  co_purchase_count integer DEFAULT 0,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  expected_revenue_impact numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, related_product_id)
);

CREATE INDEX IF NOT EXISTS idx_suggested_bundles_status ON suggested_bundles(status);
CREATE INDEX IF NOT EXISTS idx_suggested_bundles_product_id ON suggested_bundles(product_id);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggested_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all stock movements" ON stock_movements FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can create stock movements" ON stock_movements FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can view bundle analytics" ON bundle_analytics FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage bundle analytics" ON bundle_analytics FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view suggested bundles" ON suggested_bundles FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage suggested bundles" ON suggested_bundles FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION create_bundle_analytics() RETURNS TRIGGER AS $$
BEGIN INSERT INTO bundle_analytics (bundle_id) VALUES (NEW.id); RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_bundle_analytics AFTER INSERT ON product_bundles FOR EACH ROW EXECUTE FUNCTION create_bundle_analytics();

-- Migration 56: add_payment_details_to_orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_details TEXT;

-- Migration 57: add_address_to_profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Migration 58: add_copyright_to_app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS copyright_year text DEFAULT '2026';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS copyright_company text DEFAULT 'Shottopoth';

-- Migration 59: create_admin_notification_preferences
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

CREATE INDEX IF NOT EXISTS idx_admin_notification_preferences_user_id ON admin_notification_preferences(user_id);
ALTER TABLE admin_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own preferences" ON admin_notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert their own preferences" ON admin_notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update their own preferences" ON admin_notification_preferences FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('welcome', 'order', 'announcement', 'system', 'low_stock', 'message'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Migration 60: add_admin_url_path_to_app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS admin_url_path TEXT NOT NULL DEFAULT '/pass-43726fshf88w93uh78ww39/admin/39uwfwh98rw38ef';
ALTER TABLE app_settings ADD CONSTRAINT admin_url_path_format CHECK (admin_url_path ~ '^/[a-zA-Z0-9/_-]+$');
UPDATE app_settings SET admin_url_path = '/pass-43726fshf88w93uh78ww39/admin/39uwfwh98rw38ef' WHERE admin_url_path IS NULL OR admin_url_path = '';

-- -----------------------------------------------------
-- End of File: 00084_part6_migrations_51_to_60.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00085_part7a_migrations_61_to_65.sql
-- -----------------------------------------------------

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

-- -----------------------------------------------------
-- End of File: 00085_part7a_migrations_61_to_65.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00086_part7b_migrations_65b_to_76.sql
-- -----------------------------------------------------

-- Migration 65b: create_app_downloads_table
CREATE TABLE IF NOT EXISTS app_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('google_play', 'microsoft_store', 'app_store', 'apk', 'exe')),
  title text NOT NULL,
  description text,
  link_url text,
  file_url text,
  version text,
  file_size text,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO storage.buckets (id, name, public) VALUES ('app-files', 'app-files', true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active app downloads" ON app_downloads FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can view all app downloads" ON app_downloads FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert app downloads" ON app_downloads FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update app downloads" ON app_downloads FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete app downloads" ON app_downloads FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE INDEX idx_app_downloads_platform ON app_downloads(platform);
CREATE INDEX idx_app_downloads_is_active ON app_downloads(is_active);
CREATE INDEX idx_app_downloads_display_order ON app_downloads(display_order);

-- Migration 66: create_download_analytics_tables
CREATE TABLE IF NOT EXISTS app_download_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text, ip_address text, country text, region text, city text,
  device_type text, os_name text, os_version text, browser_name text, browser_version text,
  screen_width int, screen_height int, referrer_url text,
  utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  page_variant text, viewed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_download_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  download_id uuid REFERENCES app_downloads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text, ip_address text, country text, region text, city text,
  device_type text, os_name text, os_version text, browser_name text, browser_version text,
  screen_width int, screen_height int, referrer_url text,
  utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  page_variant text, download_method text, downloaded_at timestamptz DEFAULT now()
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

-- Migration 69: create_review_responses_table
CREATE TABLE IF NOT EXISTS review_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review responses" ON review_responses FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own responses" ON review_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own responses" ON review_responses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own responses" ON review_responses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Migration 70: create_review_helpful_votes_table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS not_helpful_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_review_helpful_counts AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes FOR EACH ROW EXECUTE FUNCTION update_review_helpful_counts();

-- Migration 72: add_gift_card_support
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_gift_card boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_email text;
CREATE INDEX IF NOT EXISTS idx_products_is_gift_card ON products(is_gift_card) WHERE is_gift_card = true;

-- Migration 73: add_anonymous_reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_reviews_is_anonymous ON reviews(is_anonymous);

-- Migration 74: create_gift_card_templates
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

INSERT INTO gift_card_templates (name, occasion, subject_line, header_text, greeting_message, primary_color, secondary_color, emoji) VALUES
('General Gift Card', 'general', '🎁 Your Gift Card from {siteName}', 'You''ve Received a Gift Card!', 'Great news! You''ve received a gift card from {siteName}.', '#10b981', '#059669', '🎁'),
('Birthday Gift Card', 'birthday', '🎂 Happy Birthday! Your Gift Card from {siteName}', 'Happy Birthday! 🎉', 'Happy Birthday, {recipientName}! Here''s a gift card to celebrate!', '#ec4899', '#db2777', '🎂'),
('Holiday Gift Card', 'holiday', '🎄 Season''s Greetings! Your Gift Card from {siteName}', 'Happy Holidays! ✨', 'Season''s Greetings, {recipientName}! Enjoy your gift card!', '#dc2626', '#b91c1c', '🎄'),
('Thank You Gift Card', 'thankyou', '💝 Thank You! Your Gift Card from {siteName}', 'Thank You! 💝', 'Dear {recipientName}, thank you for your loyalty! Here''s a special gift.', '#8b5cf6', '#7c3aed', '💝'),
('Congratulations Gift Card', 'congratulations', '🎊 Congratulations! Your Gift Card from {siteName}', 'Congratulations! 🎊', 'Congratulations, {recipientName}! Enjoy your gift card!', '#f59e0b', '#d97706', '🎊');

CREATE INDEX IF NOT EXISTS idx_gift_card_templates_occasion ON gift_card_templates(occasion);
CREATE INDEX IF NOT EXISTS idx_gift_card_templates_active ON gift_card_templates(is_active);

-- Enable RLS and add security policies
ALTER TABLE gift_card_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gift card templates" ON gift_card_templates
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage gift card templates" ON gift_card_templates
  FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));


-- Migration 75: add_force_sign_in_to_app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS force_sign_in boolean NOT NULL DEFAULT true;
UPDATE app_settings SET force_sign_in = true WHERE force_sign_in IS NULL;

-- Migration 76: add_guest_checkout_support
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_phone text;

ALTER TABLE orders ADD CONSTRAINT orders_user_or_guest_check
  CHECK ((user_id IS NOT NULL) OR (guest_email IS NOT NULL AND guest_name IS NOT NULL AND guest_phone IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email) WHERE guest_email IS NOT NULL;

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users and guests can create orders" ON orders FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id AND guest_email IS NULL) OR
    (auth.uid() IS NULL AND user_id IS NULL AND guest_email IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users and guests can view their orders" ON orders FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- -----------------------------------------------------
-- End of File: 00086_part7b_migrations_65b_to_76.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00087_fix_profile_creation_and_oauth_trigger.sql
-- -----------------------------------------------------

-- ============================================================
-- FIX 1: Welcome notification uses 'success' but constraint
--         only allows: welcome, order, announcement, system,
--         low_stock, message  → profile creation always failed
-- ============================================================
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Welcome to Shottopoth!',
    'Thank you for joining us. Start exploring our products and enjoy shopping!',
    'welcome'   -- was 'success' which violated the CHECK constraint
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- FIX 2: handle_new_user - make it safe even if email is null
--         and deduplicate (ON CONFLICT DO NOTHING)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  new_username text;
  user_email text;
BEGIN
  -- Get email from various possible locations
  user_email := COALESCE(
    NEW.email,
    NEW.raw_user_meta_data->>'email',
    NEW.raw_user_meta_data->>'user_name',
    split_part(NEW.id::text, '-', 1)
  );

  SELECT COUNT(*) INTO user_count FROM profiles;

  -- Build a unique username
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'name',
    split_part(user_email, '@', 1),
    'user_' || substr(NEW.id::text, 1, 8)
  );

  -- Make username unique if collision
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    new_username := new_username || '_' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;

  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    user_email,
    new_username,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  )
  ON CONFLICT (id) DO NOTHING;  -- safe for re-runs

  RETURN NEW;
END;
$$;

-- ============================================================
-- FIX 3: Add INSERT trigger for Google OAuth users
--         (OAuth users arrive with confirmed_at already set
--          on INSERT, so the UPDATE trigger never fires)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.confirmed_at IS NOT NULL)   -- pre-confirmed (OAuth)
  EXECUTE FUNCTION handle_new_user();

-- Keep the UPDATE trigger for email/password signups
-- (email confirmation sets confirmed_at via UPDATE)
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- -----------------------------------------------------
-- End of File: 00087_fix_profile_creation_and_oauth_trigger.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00088_fix_notify_admins_new_order_trigger.sql
-- -----------------------------------------------------

-- Fix notify_admins_new_order: notifications table has no order_id column
-- Use the link column instead to reference the order
CREATE OR REPLACE FUNCTION notify_admins_new_order()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
BEGIN
  FOR admin_user IN SELECT id FROM profiles WHERE role = 'admin' LOOP
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      admin_user.id,
      'order',
      'New Order Received',
      'New order #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' for ৳' || NEW.total || ' has been placed.',
      '/admin/orders/' || NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_notify_admins_new_order ON orders;
CREATE TRIGGER trigger_notify_admins_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_order();

-- -----------------------------------------------------
-- End of File: 00088_fix_notify_admins_new_order_trigger.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00089_fix_notifications_table_schema.sql
-- -----------------------------------------------------

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

-- -----------------------------------------------------
-- End of File: 00089_fix_notifications_table_schema.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00090_fix_missing_columns_profiles_products_delivery.sql
-- -----------------------------------------------------

-- ============================================================
-- FIX profiles: add 'name' column that app expects
-- (regular column kept in sync via trigger)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Set name from full_name or username for existing profiles
UPDATE profiles SET name = COALESCE(full_name, username) WHERE name IS NULL;

-- Trigger to auto-set name when full_name or username changes
CREATE OR REPLACE FUNCTION sync_profile_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := COALESCE(NEW.full_name, NEW.username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_name_trigger ON profiles;
CREATE TRIGGER sync_profile_name_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_name();

-- ============================================================
-- FIX products: add missing columns app expects
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS pieces integer DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}';

-- ============================================================
-- FIX delivery_locations: add 'duration' column
-- ============================================================
ALTER TABLE delivery_locations ADD COLUMN IF NOT EXISTS duration TEXT;

UPDATE delivery_locations 
SET duration = CASE 
  WHEN min_days = max_days THEN min_days::text || ' day' || (CASE WHEN min_days = 1 THEN '' ELSE 's' END)
  ELSE min_days::text || '-' || max_days::text || ' days'
END
WHERE duration IS NULL;

-- -----------------------------------------------------
-- End of File: 00090_fix_missing_columns_profiles_products_delivery.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00091_update_handle_new_user_with_name.sql
-- -----------------------------------------------------

-- Update handle_new_user to also set name and full_name from OAuth metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  new_username text;
  user_email text;
  user_full_name text;
BEGIN
  -- Get email from various possible locations
  user_email := COALESCE(
    NEW.email,
    NEW.raw_user_meta_data->>'email',
    split_part(NEW.id::text, '-', 1)
  );

  -- Get full name from OAuth metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name'
  );

  SELECT COUNT(*) INTO user_count FROM profiles;

  -- Build a unique username from email or name
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'user_name',
    split_part(user_email, '@', 1),
    'user_' || substr(NEW.id::text, 1, 8)
  );

  -- Remove special characters from username
  new_username := regexp_replace(new_username, '[^a-zA-Z0-9_]', '_', 'g');

  -- Make username unique if collision
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    new_username := new_username || '_' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;

  INSERT INTO public.profiles (id, email, username, full_name, name, role)
  VALUES (
    NEW.id,
    user_email,
    new_username,
    user_full_name,
    COALESCE(user_full_name, new_username),
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------
-- End of File: 00091_update_handle_new_user_with_name.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00092_add_helper_and_missing_tables.sql
-- -----------------------------------------------------


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


-- -----------------------------------------------------
-- End of File: 00092_add_helper_and_missing_tables.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00093_fix_handle_new_user_for_oauth.sql
-- -----------------------------------------------------


-- Fix handle_new_user to work for both email/password AND OAuth (Google)
-- OAuth users may have name in user_metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _username TEXT;
  _name TEXT;
BEGIN
  -- Build a safe username from email or metadata
  _username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_username'), ''),
    NULLIF(TRIM(SPLIT_PART(NEW.email, '@', 1)), ''),
    'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
  );
  -- Ensure username is unique by appending suffix if needed
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) THEN
    _username := _username || '_' || SUBSTRING(NEW.id::TEXT, 1, 4);
  END IF;

  _name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    _username
  );

  INSERT INTO public.profiles (id, email, username, name, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    _username,
    _name,
    _name,
    NEW.phone,
    'user'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


-- -----------------------------------------------------
-- End of File: 00093_fix_handle_new_user_for_oauth.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00094_fix_admin_role_and_profile_trigger.sql
-- -----------------------------------------------------

-- 1. Promote [owner-email] to admin
UPDATE public.profiles
SET role = 'admin'::user_role
WHERE email = '[owner-email]';

-- 2. Fix handle_new_user: first user OR owner email gets admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username TEXT;
  _name     TEXT;
  _role     public.user_role;
BEGIN
  -- Build a safe username from email or metadata
  _username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_username'), ''),
    NULLIF(TRIM(SPLIT_PART(NEW.email, '@', 1)), ''),
    'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
  );

  -- Ensure username is unique by appending suffix if needed
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) THEN
    _username := _username || '_' || SUBSTRING(NEW.id::TEXT, 1, 4);
  END IF;

  _name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    _username
  );

  -- Give admin role to: (a) owner email, (b) the very first user in the DB
  IF NEW.email = '[owner-email]'
     OR NOT EXISTS (SELECT 1 FROM public.profiles) THEN
    _role := 'admin'::public.user_role;
  ELSE
    _role := 'user'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, username, name, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    _username,
    _name,
    _name,
    NEW.phone,
    _role
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email     = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      name      = COALESCE(EXCLUDED.name,      public.profiles.name),
      phone     = COALESCE(EXCLUDED.phone,     public.profiles.phone),
      -- Never downgrade an existing admin
      role      = CASE
                    WHEN public.profiles.role = 'admin'::public.user_role THEN 'admin'::public.user_role
                    ELSE EXCLUDED.role
                  END;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------
-- End of File: 00094_fix_admin_role_and_profile_trigger.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00095_fix_profiles_insert_policy.sql
-- -----------------------------------------------------

-- Allow authenticated users to insert their own profile row
-- (needed as a fallback if the DB trigger handle_new_user doesn't fire in time)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------
-- End of File: 00095_fix_profiles_insert_policy.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00098_ensure_profiles_for_all_auth_users.sql
-- -----------------------------------------------------

-- Backfill profiles for any auth.users row that has no matching profile
INSERT INTO public.profiles (id, email, username, name, full_name, role)
SELECT
  au.id,
  au.email,
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data->>'preferred_username'), ''),
    NULLIF(TRIM(SPLIT_PART(au.email, '@', 1)), ''),
    'user_' || SUBSTRING(au.id::TEXT, 1, 8)
  ) AS username,
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(au.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(SPLIT_PART(au.email, '@', 1)), ''),
    'user_' || SUBSTRING(au.id::TEXT, 1, 8)
  ) AS name,
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(au.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(SPLIT_PART(au.email, '@', 1)), ''),
    'user_' || SUBSTRING(au.id::TEXT, 1, 8)
  ) AS full_name,
  CASE
    WHEN au.email = '[owner-email]' THEN 'admin'::public.user_role
    WHEN au.email = '[admin-email]'       THEN 'admin'::public.user_role
    ELSE 'user'::public.user_role
  END AS role
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------
-- End of File: 00098_ensure_profiles_for_all_auth_users.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 00099_replace_trigger_remove_hardcoded_email.sql
-- -----------------------------------------------------

-- Replace handle_new_user trigger: no hardcoded emails.
-- All new sign-ups get 'user' role by default.
-- Admins are promoted manually through the admin panel.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username TEXT;
  _name     TEXT;
  _role     public.user_role;
BEGIN
  _username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_username'), ''),
    NULLIF(TRIM(SPLIT_PART(NEW.email, '@', 1)), ''),
    'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
  );

  -- Ensure username uniqueness
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) THEN
    _username := _username || '_' || SUBSTRING(NEW.id::TEXT, 1, 4);
  END IF;

  _name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    _username
  );

  -- Give admin to owner email or if no admin exists yet
  IF NEW.email = 'shajidrahimclass@gmail.com'
     OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin'::public.user_role) THEN
    _role := 'admin'::public.user_role;
  ELSE
    _role := 'user'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, username, name, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    _username,
    _name,
    _name,
    NEW.phone,
    _role
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email     = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      name      = COALESCE(EXCLUDED.name,      public.profiles.name),
      phone     = COALESCE(EXCLUDED.phone,     public.profiles.phone),
      -- Never downgrade an existing admin
      role      = CASE
                    WHEN public.profiles.role = 'admin'::public.user_role THEN 'admin'::public.user_role
                    ELSE EXCLUDED.role
                  END;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------
-- End of File: 00099_replace_trigger_remove_hardcoded_email.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 20260518132019_new-migration.sql
-- -----------------------------------------------------



-- -----------------------------------------------------
-- End of File: 20260518132019_new-migration.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 20260518212232_new_migration.sql
-- -----------------------------------------------------

-- Migration: new-migration
-- Created: 2026-05-18
-- Description: Add your migration SQL here



-- -----------------------------------------------------
-- End of File: 20260518212232_new_migration.sql
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Start of File: 20260519000001_create_app_downloads_table.sql
-- -----------------------------------------------------

-- Create app_downloads table
CREATE TABLE IF NOT EXISTS app_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('google_play', 'microsoft_store', 'app_store', 'apk', 'exe')),
  title text NOT NULL,
  description text,
  link_url text,
  file_url text,
  version text,
  file_size text,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create storage bucket for app files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-files', 'app-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for app files
CREATE POLICY "Public can view app files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-files');

CREATE POLICY "Admins can upload app files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-files' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update app files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'app-files' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete app files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'app-files' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS policies for app_downloads
ALTER TABLE app_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active app downloads"
ON app_downloads FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can view all app downloads"
ON app_downloads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert app downloads"
ON app_downloads FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update app downloads"
ON app_downloads FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete app downloads"
ON app_downloads FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_app_downloads_platform ON app_downloads(platform);
CREATE INDEX idx_app_downloads_is_active ON app_downloads(is_active);
CREATE INDEX idx_app_downloads_display_order ON app_downloads(display_order);

-- -----------------------------------------------------
-- End of File: 20260519000001_create_app_downloads_table.sql
-- -----------------------------------------------------

