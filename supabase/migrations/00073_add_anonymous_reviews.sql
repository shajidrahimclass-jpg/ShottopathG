-- Add is_anonymous field to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Add index for filtering anonymous reviews
CREATE INDEX IF NOT EXISTS idx_reviews_is_anonymous ON reviews(is_anonymous);