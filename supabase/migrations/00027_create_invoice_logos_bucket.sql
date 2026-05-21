-- Create storage bucket for invoice logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-logos', 'invoice-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for invoice-logos bucket
CREATE POLICY "Anyone can view invoice logo images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoice-logos');

CREATE POLICY "Admins can upload invoice logo images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'invoice-logos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update invoice logo images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'invoice-logos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete invoice logo images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'invoice-logos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
