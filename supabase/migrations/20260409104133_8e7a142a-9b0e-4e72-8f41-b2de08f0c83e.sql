
-- Create table for shared recordings
CREATE TABLE public.shared_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT NOT NULL DEFAULT 'video/webm',
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.shared_recordings ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared recordings (public share links)
CREATE POLICY "Anyone can view shared recordings"
  ON public.shared_recordings
  FOR SELECT
  USING (true);

-- Anyone can insert (no auth required for anonymous sharing)
CREATE POLICY "Anyone can create shared recordings"
  ON public.shared_recordings
  FOR INSERT
  WITH CHECK (true);

-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true);

-- Anyone can read recordings (public)
CREATE POLICY "Anyone can view recording files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'recordings');

-- Anyone can upload recordings
CREATE POLICY "Anyone can upload recording files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'recordings');
