-- Add 'on_the_way' to order_status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'on_the_way';