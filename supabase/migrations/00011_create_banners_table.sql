-- Create banners table for homepage carousel
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

-- Enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active banners
CREATE POLICY "Anyone can view active banners"
  ON banners
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage all banners
CREATE POLICY "Admins can manage banners"
  ON banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create index for ordering
CREATE INDEX idx_banners_order ON banners(display_order, created_at);