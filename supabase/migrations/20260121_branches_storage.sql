-- Create storage bucket for branch images
-- Migration: 20260121_branches_storage

-- Create branches bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branches',
  'branches',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read access policy for branches bucket
CREATE POLICY IF NOT EXISTS "Public read access for branches"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'branches');

-- Authenticated users can upload to branches bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can upload branches"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branches');

-- Authenticated users can update their own uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can update branches"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'branches');

-- Authenticated users can delete from branches bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can delete branches"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'branches');
