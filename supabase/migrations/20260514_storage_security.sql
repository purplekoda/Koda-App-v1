-- Add secure photo storage columns to recipes.
-- photo_path: path within the recipe-images Supabase Storage bucket
-- photo_source: 'supabase' | 'external' | 'none' — tracks provenance
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS photo_path text,
  ADD COLUMN IF NOT EXISTS photo_source text;

-- Mark any existing recipes that have an image_url as 'external' so the app
-- knows to serve the stored URL directly until the migration button has been run.
UPDATE recipes
SET photo_source = 'external'
WHERE image_url IS NOT NULL
  AND photo_source IS NULL;

-- ── Supabase Storage bucket security ─────────────────────────────────────────
-- Run the statements below in the Supabase SQL editor (they touch storage.*
-- which requires service-role privileges and cannot run via the JS migration
-- path in the same transaction as table DDL).
--
-- 1. Make the recipe-images bucket private:
--    UPDATE storage.buckets SET public = false WHERE name = 'recipe-images';
--
-- 2. Make the receipts bucket private:
--    UPDATE storage.buckets SET public = false WHERE name = 'receipts';
--
-- 3. RLS policies for the recipe-images bucket:
--
--    CREATE POLICY "Users can upload their own recipe photos"
--    ON storage.objects FOR INSERT
--    WITH CHECK (
--      bucket_id = 'recipe-images' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
--    CREATE POLICY "Users can view their own recipe photos"
--    ON storage.objects FOR SELECT
--    USING (
--      bucket_id = 'recipe-images' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
--    CREATE POLICY "Users can delete their own recipe photos"
--    ON storage.objects FOR DELETE
--    USING (
--      bucket_id = 'recipe-images' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
-- 4. RLS policies for the receipts bucket (if not already present):
--
--    CREATE POLICY "Users can upload their own receipts"
--    ON storage.objects FOR INSERT
--    WITH CHECK (
--      bucket_id = 'receipts' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
--    CREATE POLICY "Users can view their own receipts"
--    ON storage.objects FOR SELECT
--    USING (
--      bucket_id = 'receipts' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
--    CREATE POLICY "Users can delete their own receipts"
--    ON storage.objects FOR DELETE
--    USING (
--      bucket_id = 'receipts' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
