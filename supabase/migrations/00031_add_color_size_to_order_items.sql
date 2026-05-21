-- Add selected color and size fields to order_items table
ALTER TABLE order_items 
ADD COLUMN selected_color TEXT,
ADD COLUMN selected_size TEXT;