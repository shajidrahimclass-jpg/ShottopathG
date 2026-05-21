-- Add QR code fields to invoice_settings
ALTER TABLE invoice_settings
ADD COLUMN IF NOT EXISTS qr_code_content TEXT,
ADD COLUMN IF NOT EXISTS show_qr_code BOOLEAN DEFAULT false;
