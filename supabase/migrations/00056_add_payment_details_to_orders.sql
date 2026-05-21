-- Add payment_details column to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_details TEXT;

COMMENT ON COLUMN orders.payment_details IS 'Additional payment details or notes from the payment gateway';