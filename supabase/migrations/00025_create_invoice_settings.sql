-- Create invoice_settings table
CREATE TABLE IF NOT EXISTS invoice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Shottopoth',
  company_logo TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  tax_id TEXT,
  terms_and_conditions TEXT,
  custom_notes TEXT,
  footer_text TEXT DEFAULT 'Thank you for shopping with us!',
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_routing_number TEXT,
  show_logo BOOLEAN DEFAULT false,
  show_tax_id BOOLEAN DEFAULT false,
  show_bank_details BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO invoice_settings (
  company_name,
  company_address,
  company_phone,
  company_email,
  footer_text
) VALUES (
  'Shottopoth',
  'Dhaka, Bangladesh',
  '+880 1234567890',
  'support@shottopoth.com',
  'Thank you for shopping with Shottopoth!'
) ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read and update
CREATE POLICY "Admin can manage invoice settings"
  ON invoice_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Everyone can read (for displaying invoices)
CREATE POLICY "Anyone can read invoice settings"
  ON invoice_settings
  FOR SELECT
  TO authenticated
  USING (true);