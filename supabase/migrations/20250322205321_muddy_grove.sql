/*
  # Add audio URL column to stories table

  1. Changes
    - Add `audio_url` column to `stories` table to store the generated audio URL
    - Column is nullable since not all stories will have audio generated immediately

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
*/

ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS audio_url text;