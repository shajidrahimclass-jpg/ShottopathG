-- Add device-specific thumbnail fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pc_thumbnail TEXT,
ADD COLUMN IF NOT EXISTS mobile_thumbnail TEXT;

-- Add comment for documentation
COMMENT ON COLUMN products.pc_thumbnail IS 'Thumbnail image optimized for PC/desktop display';
COMMENT ON COLUMN products.mobile_thumbnail IS 'Thumbnail image optimized for mobile display';
COMMENT ON COLUMN products.pc_images IS 'Gallery images optimized for PC/desktop display';
COMMENT ON COLUMN products.mobile_images IS 'Gallery images optimized for mobile display';