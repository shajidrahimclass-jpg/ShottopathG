-- Fix banners table policies
DROP POLICY IF EXISTS "Admins can manage banners" ON banners;

-- Create separate policies for banners (authenticated users can manage)
CREATE POLICY "Authenticated users can insert banners"
  ON banners FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update banners"
  ON banners FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete banners"
  ON banners FOR DELETE
  TO authenticated
  USING (true);

-- Orders policies are fine (using is_admin function which checks profiles table)
-- But let's make sure the WITH CHECK clause is also set
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));