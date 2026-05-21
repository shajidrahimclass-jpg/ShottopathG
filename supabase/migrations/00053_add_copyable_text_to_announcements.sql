-- Add copyable_text field to announcements table
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS copyable_text text;

COMMENT ON COLUMN announcements.copyable_text IS 'Optional text that can be easily copied by users (e.g., promo codes, phone numbers, URLs)';