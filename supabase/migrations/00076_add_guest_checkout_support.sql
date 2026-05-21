-- Add guest checkout support to orders table
-- Make user_id nullable to allow guest orders
ALTER TABLE orders 
ALTER COLUMN user_id DROP NOT NULL;

-- Add guest information columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS guest_email text,
ADD COLUMN IF NOT EXISTS guest_name text,
ADD COLUMN IF NOT EXISTS guest_phone text;

-- Add check constraint to ensure either user_id or guest_email is present
ALTER TABLE orders
ADD CONSTRAINT orders_user_or_guest_check 
CHECK (
  (user_id IS NOT NULL) OR 
  (guest_email IS NOT NULL AND guest_name IS NOT NULL AND guest_phone IS NOT NULL)
);

-- Create index on guest_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email) WHERE guest_email IS NOT NULL;

-- Update RLS policies to allow guest order creation
-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;

-- Create new insert policy that allows both authenticated and guest orders
CREATE POLICY "Users and guests can create orders" ON orders
FOR INSERT
WITH CHECK (
  -- Authenticated users can create orders with their user_id
  (auth.uid() = user_id AND guest_email IS NULL) OR
  -- Guests can create orders with guest information (no user_id)
  (auth.uid() IS NULL AND user_id IS NULL AND guest_email IS NOT NULL)
);

-- Update select policy to allow guests to view their orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

CREATE POLICY "Users and guests can view their orders" ON orders
FOR SELECT
USING (
  -- Authenticated users can view their orders
  auth.uid() = user_id OR
  -- Admins can view all orders
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  -- Note: Guests cannot query their orders directly via RLS
  -- They will receive order confirmation via email
);

-- Add comment explaining guest orders
COMMENT ON COLUMN orders.guest_email IS 'Email address for guest orders (when user_id is NULL)';
COMMENT ON COLUMN orders.guest_name IS 'Full name for guest orders';
COMMENT ON COLUMN orders.guest_phone IS 'Phone number for guest orders';
