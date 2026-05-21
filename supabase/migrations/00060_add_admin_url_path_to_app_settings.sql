-- Add admin_url_path field to app_settings table
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS admin_url_path TEXT NOT NULL DEFAULT '/pass-43726fshf88w93uh78ww39/admin/39uwfwh98rw38ef';

-- Add comment explaining the field
COMMENT ON COLUMN app_settings.admin_url_path IS 'Custom URL path for accessing the admin panel. Must be unique and secure.';

-- Add check constraint to ensure the path starts with /
ALTER TABLE app_settings
ADD CONSTRAINT admin_url_path_format CHECK (admin_url_path ~ '^/[a-zA-Z0-9/_-]+$');

-- Update existing row with default value
UPDATE app_settings
SET admin_url_path = '/pass-43726fshf88w93uh78ww39/admin/39uwfwh98rw38ef'
WHERE admin_url_path IS NULL OR admin_url_path = '';
