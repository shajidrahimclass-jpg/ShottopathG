-- Create redeem code products table
CREATE TABLE IF NOT EXISTS redeem_code_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  redeem_code_ids text[] DEFAULT '{}',
  price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_redeem_code_products_name ON redeem_code_products(name);

-- RLS Policies
ALTER TABLE redeem_code_products ENABLE ROW LEVEL SECURITY;

-- Admin can manage all redeem code products
CREATE POLICY "Admins can manage redeem code products"
ON redeem_code_products
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Users can view redeem code products
CREATE POLICY "Users can view redeem code products"
ON redeem_code_products
FOR SELECT
TO public
USING (true);