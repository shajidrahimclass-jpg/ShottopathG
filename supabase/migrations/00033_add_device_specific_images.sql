-- Add device-specific image columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS pc_images text[],
ADD COLUMN IF NOT EXISTS mobile_images text[];

-- Add comments for documentation
COMMENT ON COLUMN products.pc_images IS 'Array of image URLs optimized for PC/desktop display';
COMMENT ON COLUMN products.mobile_images IS 'Array of image URLs optimized for mobile display';