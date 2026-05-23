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