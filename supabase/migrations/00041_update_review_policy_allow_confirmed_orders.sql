-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create reviews for delivered orders" ON reviews;

-- Create a new policy that allows reviews for confirmed, on_the_way, and delivered orders
CREATE POLICY "Users can create reviews for their orders"
ON reviews
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id = reviews.order_id 
      AND orders.user_id = auth.uid()
      AND orders.status IN ('confirmed', 'on_the_way', 'delivered')
  )
);