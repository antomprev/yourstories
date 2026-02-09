/*
  # Add reading level support

  1. Changes
    - Add `reading_level` column to `profiles` table
    - Add `reading_level` column to `stories` table
    - Add default values and constraints

  2. Security
    - No changes to RLS policies needed as the columns inherit existing table policies
*/

-- Add reading_level to profiles
ALTER TABLE profiles 
ADD COLUMN reading_level text NOT NULL DEFAULT 'automatic'
CHECK (reading_level IN ('beginner', 'intermediate', 'advanced', 'automatic'));

-- Add reading_level to stories
ALTER TABLE stories 
ADD COLUMN reading_level text NOT NULL DEFAULT 'automatic'
CHECK (reading_level IN ('beginner', 'intermediate', 'advanced', 'automatic'));