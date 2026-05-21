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