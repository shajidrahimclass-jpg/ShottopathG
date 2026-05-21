-- Add duration column to delivery_locations table
ALTER TABLE delivery_locations 
ADD COLUMN duration TEXT DEFAULT '2-3 days';

-- Update existing locations with default durations
UPDATE delivery_locations 
SET duration = CASE 
  WHEN LOWER(name) LIKE '%dhaka%' AND LOWER(name) NOT LIKE '%outer%' THEN '1-2 days'
  WHEN LOWER(name) LIKE '%outer%' THEN '2-3 days'
  ELSE '3-5 days'
END;