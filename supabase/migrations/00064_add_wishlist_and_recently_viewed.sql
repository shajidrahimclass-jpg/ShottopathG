-- Create wishlist and recently_viewed tables

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Recently viewed table
CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON recently_viewed(viewed_at DESC);

-- RLS Policies for wishlist
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
  ON wishlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add to their own wishlist
CREATE POLICY "Users can add to own wishlist"
  ON wishlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own wishlist
CREATE POLICY "Users can remove from own wishlist"
  ON wishlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all wishlists
CREATE POLICY "Admins can view all wishlists"
  ON wishlist FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for recently_viewed
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

-- Users can view their own recently viewed
CREATE POLICY "Users can view own recently viewed"
  ON recently_viewed FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add to their own recently viewed
CREATE POLICY "Users can add to own recently viewed"
  ON recently_viewed FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recently viewed
CREATE POLICY "Users can update own recently viewed"
  ON recently_viewed FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own recently viewed
CREATE POLICY "Users can delete own recently viewed"
  ON recently_viewed FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update viewed_at timestamp
CREATE OR REPLACE FUNCTION update_recently_viewed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.viewed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update viewed_at on conflict
CREATE TRIGGER update_recently_viewed_timestamp_trigger
  BEFORE UPDATE ON recently_viewed
  FOR EACH ROW
  EXECUTE FUNCTION update_recently_viewed_timestamp();
