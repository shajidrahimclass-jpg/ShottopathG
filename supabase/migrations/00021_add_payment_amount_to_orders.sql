
-- Add payment_amount column to orders table
ALTER TABLE orders 
ADD COLUMN payment_amount TEXT CHECK (payment_amount IN ('full', 'delivery_only'));

-- Set default value for existing orders
-- For cash_on_delivery, set to null (nothing paid upfront)
-- For bkash/nagad, set to 'full' as default (assume full payment for existing orders)
UPDATE orders 
SET payment_amount = CASE 
  WHEN payment_method = 'cash_on_delivery' THEN NULL
  ELSE 'full'
END
WHERE payment_amount IS NULL;
