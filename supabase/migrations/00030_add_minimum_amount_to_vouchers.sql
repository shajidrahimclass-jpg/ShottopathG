-- Add minimum_amount column to vouchers table
ALTER TABLE public.vouchers
ADD COLUMN minimum_amount DECIMAL(10, 2) DEFAULT NULL;