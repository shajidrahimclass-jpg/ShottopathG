-- Migration 17: allow_user_cancel_orders
CREATE POLICY "Users can cancel own orders" ON orders FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('pending', 'confirmed'))
  WITH CHECK (user_id = auth.uid() AND status = 'cancelled');

-- Migration 18: add_hidden_field_to_reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;
UPDATE reviews SET hidden = false WHERE hidden IS NULL;

-- Migration 19: update_reviews_policies_for_hidden
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "View reviews based on hidden status" ON reviews FOR SELECT
  USING (hidden = false OR user_id = auth.uid() OR is_admin(auth.uid()));

-- Migration 20: add_page_field_to_banners
ALTER TABLE banners ADD COLUMN IF NOT EXISTS page TEXT DEFAULT 'home';
ALTER TABLE banners ADD CONSTRAINT banners_page_check CHECK (page IN ('home', 'products'));
UPDATE banners SET page = 'home' WHERE page IS NULL;