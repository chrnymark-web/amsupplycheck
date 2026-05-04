-- Backfill historical uploads from stl-uploads storage bucket.
-- Idempotent: NOT EXISTS guard allows safe re-runs without duplicates.
INSERT INTO public.upload_events (
  file_name, file_size_bytes, file_extension, source_page, storage_path, created_at
)
SELECT
  name AS file_name,
  COALESCE((metadata->>'size')::bigint, 0) AS file_size_bytes,
  'stl' AS file_extension,
  'backfill' AS source_page,
  name AS storage_path,
  created_at
FROM storage.objects
WHERE bucket_id = 'stl-uploads'
  AND NOT EXISTS (
    SELECT 1 FROM public.upload_events ue
    WHERE ue.storage_path = storage.objects.name
  );
