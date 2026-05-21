-- ============================================================
-- FIX profiles: add 'name' column that app expects
-- (regular column kept in sync via trigger)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Set name from full_name or username for existing profiles
UPDATE profiles SET name = COALESCE(full_name, username) WHERE name IS NULL;

-- Trigger to auto-set name when full_name or username changes
CREATE OR REPLACE FUNCTION sync_profile_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := COALESCE(NEW.full_name, NEW.username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_name_trigger ON profiles;
CREATE TRIGGER sync_profile_name_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_name();

-- ============================================================
-- FIX products: add missing columns app expects
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS pieces integer DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}';

-- ============================================================
-- FIX delivery_locations: add 'duration' column
-- ============================================================
ALTER TABLE delivery_locations ADD COLUMN IF NOT EXISTS duration TEXT;

UPDATE delivery_locations 
SET duration = CASE 
  WHEN min_days = max_days THEN min_days::text || ' day' || (CASE WHEN min_days = 1 THEN '' ELSE 's' END)
  ELSE min_days::text || '-' || max_days::text || ' days'
END
WHERE duration IS NULL;