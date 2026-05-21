-- Create app_download_page_views table
CREATE TABLE IF NOT EXISTS app_download_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text,
  ip_address text,
  country text,
  region text,
  city text,
  device_type text,
  os_name text,
  os_version text,
  browser_name text,
  browser_version text,
  screen_width int,
  screen_height int,
  referrer_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  page_variant text,
  viewed_at timestamptz DEFAULT now()
);

-- Create app_download_analytics table
CREATE TABLE IF NOT EXISTS app_download_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  download_id uuid REFERENCES app_downloads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text,
  ip_address text,
  country text,
  region text,
  city text,
  device_type text,
  os_name text,
  os_version text,
  browser_name text,
  browser_version text,
  screen_width int,
  screen_height int,
  referrer_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  page_variant text,
  download_method text,
  downloaded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_download_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_download_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for app_download_page_views
CREATE POLICY "Anyone can insert page views"
ON app_download_page_views FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can view all page views"
ON app_download_page_views FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS policies for app_download_analytics
CREATE POLICY "Anyone can insert download analytics"
ON app_download_analytics FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can view all download analytics"
ON app_download_analytics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view their own download analytics"
ON app_download_analytics FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_page_views_viewed_at ON app_download_page_views(viewed_at DESC);
CREATE INDEX idx_page_views_user_id ON app_download_page_views(user_id);
CREATE INDEX idx_page_views_country ON app_download_page_views(country);
CREATE INDEX idx_page_views_device_type ON app_download_page_views(device_type);
CREATE INDEX idx_page_views_referrer ON app_download_page_views(referrer_url);

CREATE INDEX idx_download_analytics_downloaded_at ON app_download_analytics(downloaded_at DESC);
CREATE INDEX idx_download_analytics_download_id ON app_download_analytics(download_id);
CREATE INDEX idx_download_analytics_user_id ON app_download_analytics(user_id);
CREATE INDEX idx_download_analytics_country ON app_download_analytics(country);
CREATE INDEX idx_download_analytics_device_type ON app_download_analytics(device_type);
CREATE INDEX idx_download_analytics_referrer ON app_download_analytics(referrer_url);

-- Create materialized view for quick analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS app_download_stats AS
SELECT 
  ad.id as download_id,
  ad.platform,
  ad.title,
  COUNT(DISTINCT ada.id) as total_downloads,
  COUNT(DISTINCT ada.user_id) as unique_users,
  COUNT(DISTINCT ada.country) as countries_count,
  MAX(ada.downloaded_at) as last_download_at
FROM app_downloads ad
LEFT JOIN app_download_analytics ada ON ad.id = ada.download_id
GROUP BY ad.id, ad.platform, ad.title;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_download_stats_download_id ON app_download_stats(download_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_download_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY app_download_stats;
END;
$$;