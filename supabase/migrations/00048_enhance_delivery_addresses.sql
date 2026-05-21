-- Enhance delivery_addresses table with more detailed fields
ALTER TABLE delivery_addresses
ADD COLUMN IF NOT EXISTS label TEXT DEFAULT 'Home',
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Bangladesh',
ADD COLUMN IF NOT EXISTS landmark TEXT,
ADD COLUMN IF NOT EXISTS address_type TEXT DEFAULT 'home' CHECK (address_type IN ('home', 'office', 'other'));

-- Add comment for documentation
COMMENT ON COLUMN delivery_addresses.label IS 'User-friendly label for the address (e.g., Home, Office, Parents House)';
COMMENT ON COLUMN delivery_addresses.street IS 'Street address line';
COMMENT ON COLUMN delivery_addresses.city IS 'City name';
COMMENT ON COLUMN delivery_addresses.state IS 'State or division';
COMMENT ON COLUMN delivery_addresses.zip_code IS 'Postal/ZIP code';
COMMENT ON COLUMN delivery_addresses.country IS 'Country name';
COMMENT ON COLUMN delivery_addresses.landmark IS 'Nearby landmark for easier delivery';
COMMENT ON COLUMN delivery_addresses.address_type IS 'Type of address: home, office, or other';
