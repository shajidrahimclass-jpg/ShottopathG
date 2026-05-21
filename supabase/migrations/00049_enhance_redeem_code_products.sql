-- Enhance redeem_code_products table with additional fields
ALTER TABLE redeem_code_products
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS pc_image TEXT,
ADD COLUMN IF NOT EXISTS mobile_image TEXT;

-- Add index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_redeem_code_products_slug ON redeem_code_products(slug);

-- Add comment for documentation
COMMENT ON COLUMN redeem_code_products.slug IS 'URL-friendly identifier for the redeem code product';
COMMENT ON COLUMN redeem_code_products.pc_image IS 'Image URL optimized for desktop display';
COMMENT ON COLUMN redeem_code_products.mobile_image IS 'Image URL optimized for mobile display';
