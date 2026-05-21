-- Create app_settings table for general application settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT DEFAULT 'Shottopoth',
  navbar_name TEXT DEFAULT 'Shottopoth',
  favicon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (site_title, navbar_name)
VALUES ('Shottopoth', 'Shottopoth')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings
CREATE POLICY "Anyone can read app settings"
  ON app_settings
  FOR SELECT
  TO public
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update app settings"
  ON app_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );