-- Add is_gift_card field to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_gift_card boolean DEFAULT false;

-- Add gift_card_email field to orders table to store recipient email
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS gift_card_email text;

-- Create index for gift card products
CREATE INDEX IF NOT EXISTS idx_products_is_gift_card ON products(is_gift_card) WHERE is_gift_card = true;