-- Add site_description field to app_settings table
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS site_description TEXT;

-- Update existing settings with default description
UPDATE app_settings 
SET site_description = 'Shottopoth - Your trusted e-commerce platform for quality products and seamless shopping experience.'
WHERE site_description IS NULL;