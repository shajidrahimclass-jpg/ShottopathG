-- Add meta fields to products table for SEO and social sharing
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_image TEXT;

-- Add comment for documentation
COMMENT ON COLUMN products.meta_description IS 'SEO meta description for product page (150-160 characters recommended)';
COMMENT ON COLUMN products.meta_image IS 'Image URL for social media sharing (Open Graph and Twitter Cards)';