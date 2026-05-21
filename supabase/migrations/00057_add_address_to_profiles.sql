-- Add address fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

COMMENT ON COLUMN profiles.phone IS 'User phone number for delivery';
COMMENT ON COLUMN profiles.address IS 'User default delivery address';
COMMENT ON COLUMN profiles.full_name IS 'User full name for delivery';