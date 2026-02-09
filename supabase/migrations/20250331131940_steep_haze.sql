/*
  # Set up storage bucket for story assets

  1. Changes
    - Create story-assets bucket if it doesn't exist
    - Configure bucket settings for public access
    - Set file size limits and allowed MIME types

  2. Security
    - Enable public read access
    - Restrict file types to images
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-assets', 'story-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Update bucket settings
UPDATE storage.buckets
SET public = true,
    file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif']
WHERE id = 'story-assets';

-- Create RLS policies for the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'story-assets');

CREATE POLICY "Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'story-assets' AND
    (LOWER(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'gif'))
);