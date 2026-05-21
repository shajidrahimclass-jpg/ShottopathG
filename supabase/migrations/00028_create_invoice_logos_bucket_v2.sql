INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-logos', 'invoice-logos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view invoice logo images'
  ) THEN
    CREATE POLICY "Anyone can view invoice logo images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'invoice-logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can upload invoice logo images'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can update invoice logo images'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can delete invoice logo images'
  ) THEN
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
  END IF;
END $$;