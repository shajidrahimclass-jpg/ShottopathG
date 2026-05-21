-- Allow users to cancel their own orders
-- Users can only update their own orders to set status to 'cancelled'
CREATE POLICY "Users can cancel own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    AND status IN ('pending', 'confirmed')
  )
  WITH CHECK (
    user_id = auth.uid() 
    AND status = 'cancelled'
  );