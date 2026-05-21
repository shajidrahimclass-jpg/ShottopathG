-- Add page field to banners table to differentiate between home and products page
ALTER TABLE banners ADD COLUMN IF NOT EXISTS page TEXT DEFAULT 'home';

-- Add check constraint to ensure valid page values
ALTER TABLE banners ADD CONSTRAINT banners_page_check 
  CHECK (page IN ('home', 'products'));

-- Update existing banners to be home page banners
UPDATE banners SET page = 'home' WHERE page IS NULL;