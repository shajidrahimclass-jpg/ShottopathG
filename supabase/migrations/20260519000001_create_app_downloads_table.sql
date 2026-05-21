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