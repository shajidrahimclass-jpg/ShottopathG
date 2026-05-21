-- Remove pre-order system

-- Drop pre_orders table
DROP TABLE IF EXISTS pre_orders CASCADE;

-- Remove pre-order fields from products table
ALTER TABLE products
DROP COLUMN IF EXISTS pre_order_enabled,
DROP COLUMN IF EXISTS expected_restock_date;

-- Drop the update function for pre_orders if it exists
DROP FUNCTION IF EXISTS update_pre_orders_updated_at() CASCADE;
