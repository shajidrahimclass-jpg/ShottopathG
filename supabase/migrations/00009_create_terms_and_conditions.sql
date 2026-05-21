-- Create terms_and_conditions table
CREATE TABLE IF NOT EXISTS terms_and_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default terms
INSERT INTO terms_and_conditions (title, content, is_active)
VALUES (
  'Terms and Conditions',
  E'1. Payment must be completed before order confirmation.\n2. Transaction ID must be valid and verifiable.\n3. Orders cannot be cancelled after payment confirmation.\n4. Delivery time may vary based on location.\n5. Please ensure your delivery address is correct.\n6. Refunds will be processed according to our refund policy.',
  true
)
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE terms_and_conditions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active terms
CREATE POLICY "Anyone can read active terms"
  ON terms_and_conditions
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage terms
CREATE POLICY "Admins can manage terms"
  ON terms_and_conditions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );