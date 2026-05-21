-- Drop existing banner storage policies
DROP POLICY IF EXISTS "Admins can upload banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete banner images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view banner images" ON storage.objects;

-- Create simpler policies that allow all authenticated users
-- (Admin check is done at application level)
CREATE POLICY "Anyone can view banner images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banner images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Authenticated users can update banner images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'banners')
  WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Authenticated users can delete banner images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'banners');