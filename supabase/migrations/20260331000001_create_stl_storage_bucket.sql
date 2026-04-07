-- Storage bucket for STL file uploads (used by Trigger.dev STL workflow)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stl-uploads',
  'stl-uploads',
  false,
  104857600, -- 100MB
  ARRAY['application/octet-stream', 'model/stl', 'application/sla']
);

-- Allow anonymous uploads (files are ephemeral, processed by Trigger.dev tasks)
CREATE POLICY "Allow anonymous STL uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'stl-uploads');

-- Service role can read (Trigger.dev tasks download from here)
CREATE POLICY "Service role can read STL files" ON storage.objects
  FOR SELECT USING (bucket_id = 'stl-uploads');

-- Allow deletion for cleanup
CREATE POLICY "Service role can delete STL files" ON storage.objects
  FOR DELETE USING (bucket_id = 'stl-uploads');
