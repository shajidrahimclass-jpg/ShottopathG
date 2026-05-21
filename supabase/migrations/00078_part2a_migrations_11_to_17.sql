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