-- Add profit_margin to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_margin numeric DEFAULT 0 CHECK (profit_margin >= 0 AND profit_margin <= 100);
COMMENT ON COLUMN products.profit_margin IS 'Profit margin percentage (0-100) used for calculating optimal bundle discounts';

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL CHECK (quantity > 0),
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  reason text,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE stock_movements IS 'Tracks all stock movements (in/out/adjustments) for inventory management';
COMMENT ON COLUMN stock_movements.movement_type IS 'Type of movement: in (stock added), out (stock removed), adjustment (correction)';
COMMENT ON COLUMN stock_movements.quantity IS 'Quantity of items moved';
COMMENT ON COLUMN stock_movements.previous_stock IS 'Stock level before movement';
COMMENT ON COLUMN stock_movements.new_stock IS 'Stock level after movement';
COMMENT ON COLUMN stock_movements.reason IS 'Reason for movement (e.g., purchase, sale, damage, return)';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

-- Create bundle_analytics table for tracking bundle performance
CREATE TABLE IF NOT EXISTS bundle_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  views integer DEFAULT 0,
  selections integer DEFAULT 0,
  purchases integer DEFAULT 0,
  revenue_generated numeric DEFAULT 0,
  discount_given numeric DEFAULT 0,
  last_selected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE bundle_analytics IS 'Tracks performance metrics for product bundles';
COMMENT ON COLUMN bundle_analytics.views IS 'Number of times bundle was shown to customers';
COMMENT ON COLUMN bundle_analytics.selections IS 'Number of times bundle was selected (added to cart)';
COMMENT ON COLUMN bundle_analytics.purchases IS 'Number of times bundle was actually purchased';
COMMENT ON COLUMN bundle_analytics.revenue_generated IS 'Total revenue from bundle purchases';
COMMENT ON COLUMN bundle_analytics.discount_given IS 'Total discount amount given through this bundle';

CREATE INDEX IF NOT EXISTS idx_bundle_analytics_bundle_id ON bundle_analytics(bundle_id);

-- Create suggested_bundles table for AI recommendations
CREATE TABLE IF NOT EXISTS suggested_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  suggested_discount_percent numeric DEFAULT 0 CHECK (suggested_discount_percent >= 0 AND suggested_discount_percent <= 100),
  co_purchase_count integer DEFAULT 0,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  expected_revenue_impact numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, related_product_id)
);

COMMENT ON TABLE suggested_bundles IS 'AI-generated bundle suggestions awaiting admin approval';
COMMENT ON COLUMN suggested_bundles.co_purchase_count IS 'Number of times products were bought together';
COMMENT ON COLUMN suggested_bundles.confidence_score IS 'AI confidence in suggestion (0-100)';
COMMENT ON COLUMN suggested_bundles.expected_revenue_impact IS 'Estimated revenue increase from this bundle';

CREATE INDEX IF NOT EXISTS idx_suggested_bundles_status ON suggested_bundles(status);
CREATE INDEX IF NOT EXISTS idx_suggested_bundles_product_id ON suggested_bundles(product_id);

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggested_bundles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_movements
CREATE POLICY "Admins can view all stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create stock movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for bundle_analytics
CREATE POLICY "Admins can view bundle analytics"
  ON bundle_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage bundle analytics"
  ON bundle_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for suggested_bundles
CREATE POLICY "Admins can view suggested bundles"
  ON suggested_bundles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage suggested bundles"
  ON suggested_bundles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically create bundle analytics when bundle is created
CREATE OR REPLACE FUNCTION create_bundle_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bundle_analytics (bundle_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_bundle_analytics
  AFTER INSERT ON product_bundles
  FOR EACH ROW
  EXECUTE FUNCTION create_bundle_analytics();