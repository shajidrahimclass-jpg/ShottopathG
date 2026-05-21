-- Add force_sign_in column to app_settings table
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS force_sign_in boolean NOT NULL DEFAULT true;

-- Update existing record to have force_sign_in enabled by default
UPDATE app_settings SET force_sign_in = true WHERE force_sign_in IS NULL;