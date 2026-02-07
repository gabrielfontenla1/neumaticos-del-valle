-- Fix RLS for review_images table
-- This table was created without RLS enabled

-- Enable RLS
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view approved review images
CREATE POLICY "Public can view approved review images" ON review_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_images.review_id
      AND reviews.is_approved = true
    )
  );

-- Policy: Admins can view all review images
CREATE POLICY "Admins can view all review images" ON review_images
  FOR SELECT
  USING (is_admin());

-- Policy: Admins can insert review images
CREATE POLICY "Admins can insert review images" ON review_images
  FOR INSERT
  WITH CHECK (is_admin());

-- Policy: Admins can update review images
CREATE POLICY "Admins can update review images" ON review_images
  FOR UPDATE
  USING (is_admin());

-- Policy: Admins can delete review images
CREATE POLICY "Admins can delete review images" ON review_images
  FOR DELETE
  USING (is_admin());
