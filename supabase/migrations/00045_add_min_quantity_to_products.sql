-- Add min_quantity field to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1 NOT NULL;

-- Update existing products to have minimum quantity of 1
UPDATE products SET min_quantity = 1 WHERE min_quantity IS NULL;

-- Add check constraint to ensure min_quantity is at least 1
ALTER TABLE products ADD CONSTRAINT products_min_quantity_check CHECK (min_quantity >= 1);