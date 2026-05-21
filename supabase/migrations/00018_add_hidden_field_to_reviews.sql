-- Add hidden field to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- Update existing reviews to not be hidden
UPDATE reviews SET hidden = false WHERE hidden IS NULL;