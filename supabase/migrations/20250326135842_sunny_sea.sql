/*
  # Add language column to stories table

  1. Changes
    - Add `language` column to `stories` table to store the story language
    - Set default value to 'Eng' for existing stories
    - Make the column non-nullable

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
*/

ALTER TABLE stories 
ADD COLUMN language text NOT NULL DEFAULT 'Eng';