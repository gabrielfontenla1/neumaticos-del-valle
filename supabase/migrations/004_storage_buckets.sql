-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types, file_size_limit)
VALUES
  ('products', 'products', true, false, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'], 5242880),
  ('reviews', 'reviews', true, false, ARRAY['image/jpeg', 'image/png', 'image/webp'], 2097152),
  ('vouchers', 'vouchers', false, false, ARRAY['application/pdf', 'image/jpeg', 'image/png'], 10485760)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- Storage policies for products bucket (public read)
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Storage policies for reviews bucket (public read, user upload)
CREATE POLICY "Anyone can view review images" ON storage.objects
  FOR SELECT USING (bucket_id = 'reviews');

CREATE POLICY "Authenticated users can upload review images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'reviews' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update own review images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'reviews' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own review images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'reviews' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for vouchers bucket (restricted access)
CREATE POLICY "Users can view own voucher files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vouchers' AND
    (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    )
  );

CREATE POLICY "Admins can manage voucher files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'vouchers' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );