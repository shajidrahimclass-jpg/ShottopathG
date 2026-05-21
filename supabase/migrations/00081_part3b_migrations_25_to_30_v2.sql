-- Migration 25: create_invoice_settings
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

INSERT INTO invoice_settings (company_name, company_address, company_phone, company_email, footer_text)
VALUES ('Shottopoth', 'Dhaka, Bangladesh', '+880 1234567890', 'support@shottopoth.com', 'Thank you for shopping with Shottopoth!')
ON CONFLICT DO NOTHING;

ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage invoice settings" ON invoice_settings FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can read invoice settings" ON invoice_settings FOR SELECT TO authenticated USING (true);

-- Migration 26: add_qr_code_to_invoice_settings
ALTER TABLE invoice_settings ADD COLUMN IF NOT EXISTS qr_code_content TEXT;
ALTER TABLE invoice_settings ADD COLUMN IF NOT EXISTS show_qr_code BOOLEAN DEFAULT false;

-- Migration 27/28: create_invoice_logos_bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('invoice-logos', 'invoice-logos', true) ON CONFLICT (id) DO NOTHING;

-- Migration 29: add_thumbnail_to_products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Migration 30: add_minimum_amount_to_vouchers
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS minimum_amount DECIMAL(10, 2) DEFAULT NULL;