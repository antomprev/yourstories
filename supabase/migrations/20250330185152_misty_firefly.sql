/*
  # Add icon_url column to stories table

  1. Changes
    - Add icon_url column to stories table to store the generated story icon URL
    - Column is nullable since not all stories will have icons immediately

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
*/

ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS icon_url text;