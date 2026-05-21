-- Add pc_image and mobile_image columns to redeem_code_products table
ALTER TABLE redeem_code_products
ADD COLUMN IF NOT EXISTS pc_image text,
ADD COLUMN IF NOT EXISTS mobile_image text;

-- Add slug column if it doesn't exist (for URL-friendly identifiers)
ALTER TABLE redeem_code_products
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_redeem_code_products_slug ON redeem_code_products(slug);

-- Update existing records to have slug based on name if slug is null
UPDATE redeem_code_products
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
WHERE slug IS NULL;