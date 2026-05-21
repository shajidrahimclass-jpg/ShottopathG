-- Add category to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;

-- Create categories table for better management
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
  ('Electronics', 'Electronic devices and gadgets'),
  ('Fashion', 'Clothing and accessories'),
  ('Home & Living', 'Home decor and furniture'),
  ('Beauty', 'Beauty and personal care products'),
  ('Sports', 'Sports and fitness equipment'),
  ('Books', 'Books and educational materials')
ON CONFLICT (name) DO NOTHING;

-- RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL TO authenticated USING (is_admin(auth.uid()));