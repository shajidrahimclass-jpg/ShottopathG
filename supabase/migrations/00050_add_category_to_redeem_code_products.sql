-- Add category and visibility fields to redeem_code_products
ALTER TABLE redeem_code_products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_redeem_code_products_category ON redeem_code_products(category_id);
CREATE INDEX IF NOT EXISTS idx_redeem_code_products_active ON redeem_code_products(is_active);

-- Add comments
COMMENT ON COLUMN redeem_code_products.category_id IS 'Category for organizing redeem code products';
COMMENT ON COLUMN redeem_code_products.is_active IS 'Whether the product is visible to customers';
