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