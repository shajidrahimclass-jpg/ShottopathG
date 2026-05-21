-- Create product_bundles table to store bundle relationships
CREATE TABLE IF NOT EXISTS product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bundle_discount_percent numeric DEFAULT 0 CHECK (bundle_discount_percent >= 0 AND bundle_discount_percent <= 100),
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, related_product_id)
);

COMMENT ON TABLE product_bundles IS 'Stores product bundle relationships and discount information';
COMMENT ON COLUMN product_bundles.product_id IS 'The main product';
COMMENT ON COLUMN product_bundles.related_product_id IS 'The related product to bundle with';
COMMENT ON COLUMN product_bundles.bundle_discount_percent IS 'Discount percentage when products are bundled together (0-100)';
COMMENT ON COLUMN product_bundles.display_order IS 'Order in which related products should be displayed';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_bundles_product_id ON product_bundles(product_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_active ON product_bundles(is_active);

-- Enable RLS
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active bundles"
  ON product_bundles FOR SELECT
  TO public
  USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage bundles"
  ON product_bundles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );