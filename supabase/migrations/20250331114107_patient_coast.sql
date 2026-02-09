/*
  # Add storage policies for story assets

  1. Security
    - Enable storage access for authenticated users
    - Add policies for:
      - Reading public story assets
      - Uploading story assets to specific folders
      - Deleting own assets
    
  2. Changes
    - Create policies on storage.objects table
    - Use split_part to check folder names safely
    - Ensure proper access control
*/

-- Enable public read access for story assets
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'story-assets');

-- Enable asset upload for authenticated users to specific folders
CREATE POLICY "Enable asset upload for authenticated users"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'story-assets' AND
  (
    split_part(name, '/', 1) = 'story-icons' OR 
    split_part(name, '/', 1) = 'tts-files'
  )
);

-- Enable asset deletion for own files
CREATE POLICY "Enable asset deletion for authenticated users"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'story-assets' AND
  auth.uid() = owner
);