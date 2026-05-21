-- Add images and videos columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- Migrate existing image_url to images array
UPDATE products 
SET images = ARRAY[image_url]::TEXT[]
WHERE image_url IS NOT NULL AND image_url != '' AND (images IS NULL OR array_length(images, 1) IS NULL);

-- Keep image_url for backward compatibility but it will show the first image
UPDATE products
SET image_url = images[1]
WHERE images IS NOT NULL AND array_length(images, 1) > 0;