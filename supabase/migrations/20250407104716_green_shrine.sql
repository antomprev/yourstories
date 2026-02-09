/*
  # Add personalization fields to profiles table

  1. Changes
    - Add child_name column to profiles table
    - Add parent_name column to profiles table
    - Add story_language column to profiles table with language validation
    - Set default values for new columns

  2. Security
    - No changes to RLS policies needed as the columns inherit existing table policies
*/

ALTER TABLE profiles 
ADD COLUMN child_name text DEFAULT '',
ADD COLUMN parent_name text DEFAULT '',
ADD COLUMN story_language text DEFAULT 'English'
CHECK (story_language IN ('English', 'Greek', 'Spanish'));