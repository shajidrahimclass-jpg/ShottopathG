-- Add user_manual field to products table
ALTER TABLE products ADD COLUMN user_manual TEXT;

-- Create product_user_manual_acceptances table
CREATE TABLE IF NOT EXISTS product_user_manual_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE product_user_manual_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_user_manual_acceptances
-- Users can view their own acceptances
CREATE POLICY "Users can view their own acceptances"
  ON product_user_manual_acceptances FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own acceptances
CREATE POLICY "Users can create their own acceptances"
  ON product_user_manual_acceptances FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all acceptances
CREATE POLICY "Admins can view all acceptances"
  ON product_user_manual_acceptances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_product_manual_acceptances_user_product 
  ON product_user_manual_acceptances(user_id, product_id);