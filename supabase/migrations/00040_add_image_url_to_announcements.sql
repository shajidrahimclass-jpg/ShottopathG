-- Add image_url column to announcements table
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT;