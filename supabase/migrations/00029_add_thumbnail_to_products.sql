-- Add thumbnail field to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thumbnail TEXT;