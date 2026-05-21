-- Create redeem codes table
CREATE TABLE IF NOT EXISTS redeem_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  value numeric NOT NULL CHECK (value > 0),
  price numeric NOT NULL CHECK (price >= 0),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'redeemed')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  purchased_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_in_order uuid REFERENCES orders(id) ON DELETE SET NULL,
  expiry_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_redeem_codes_code ON redeem_codes(code);
CREATE INDEX idx_redeem_codes_status ON redeem_codes(status);
CREATE INDEX idx_redeem_codes_purchased_by ON redeem_codes(purchased_by);

-- RLS Policies
ALTER TABLE redeem_codes ENABLE ROW LEVEL SECURITY;

-- Admin can manage all redeem codes
CREATE POLICY "Admins can manage redeem codes"
ON redeem_codes
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Users can view available redeem codes
CREATE POLICY "Users can view available redeem codes"
ON redeem_codes
FOR SELECT
TO authenticated
USING (status = 'available' OR purchased_by = auth.uid());

-- Users can view their purchased redeem codes
CREATE POLICY "Users can view their purchased codes"
ON redeem_codes
FOR SELECT
TO authenticated
USING (purchased_by = auth.uid());