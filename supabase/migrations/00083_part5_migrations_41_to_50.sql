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