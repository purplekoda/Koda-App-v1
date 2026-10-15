-- Make user-content storage buckets private and enforce owner-scoped RLS.
-- Run this in the Supabase SQL editor (service-role privileges required to
-- touch storage.*). Idempotent — safe to re-run.
--
-- Buckets covered: recipe-images, receipts, macro-photos, pantry-scans.
-- App code (src/lib/storage.js) already serves these via signed URLs, so
-- flipping public → false does not break reads.

-- 1. Flip buckets to private. Insert-if-missing so fresh environments end up
--    with the correct settings even if the bucket was never created.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('recipe-images', 'recipe-images', false),
  ('receipts', 'receipts', false),
  ('macro-photos', 'macro-photos', false),
  ('pantry-scans', 'pantry-scans', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Drop the legacy public-read policy on recipe images.
DROP POLICY IF EXISTS "Public read recipe images" ON storage.objects;

-- 3. Owner-scoped policies. Drop-and-recreate for idempotency.

-- recipe-images
DROP POLICY IF EXISTS "Users view own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users update own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own recipe images" ON storage.objects;

CREATE POLICY "Users view own recipe images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users upload own recipe images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own recipe images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own recipe images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- receipts
DROP POLICY IF EXISTS "Users view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own receipts" ON storage.objects;

CREATE POLICY "Users view own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users upload own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own receipts"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- macro-photos
DROP POLICY IF EXISTS "Users view own macro photos" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own macro photos" ON storage.objects;
DROP POLICY IF EXISTS "Users update own macro photos" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own macro photos" ON storage.objects;

CREATE POLICY "Users view own macro photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'macro-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users upload own macro photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'macro-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own macro photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'macro-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own macro photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'macro-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- pantry-scans
DROP POLICY IF EXISTS "Users view own pantry scans" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own pantry scans" ON storage.objects;
DROP POLICY IF EXISTS "Users update own pantry scans" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own pantry scans" ON storage.objects;

CREATE POLICY "Users view own pantry scans"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pantry-scans'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users upload own pantry scans"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pantry-scans'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own pantry scans"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'pantry-scans'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own pantry scans"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pantry-scans'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
