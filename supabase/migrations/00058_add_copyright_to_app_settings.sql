-- Add copyright fields to app_settings table
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS copyright_year text DEFAULT '2026',
ADD COLUMN IF NOT EXISTS copyright_company text DEFAULT 'Shottopoth';

COMMENT ON COLUMN app_settings.copyright_year IS 'Year displayed in footer copyright';
COMMENT ON COLUMN app_settings.copyright_company IS 'Company name displayed in footer copyright';