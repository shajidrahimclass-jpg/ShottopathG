-- Drop old SELECT policy
DROP POLICY "Anyone can view reviews" ON reviews;

-- Create new SELECT policy that respects hidden flag
-- Public can see non-hidden reviews
-- Users can see their own reviews (even if hidden)
-- Admins can see all reviews
CREATE POLICY "View reviews based on hidden status"
  ON reviews FOR SELECT
  USING (
    hidden = false 
    OR user_id = auth.uid() 
    OR is_admin(auth.uid())
  );