-- Add default meta image to app_settings for fallback social sharing
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS default_meta_image TEXT;

-- Add comment for documentation
COMMENT ON COLUMN app_settings.default_meta_image IS 'Default image for social media sharing when product/page does not have specific meta image';