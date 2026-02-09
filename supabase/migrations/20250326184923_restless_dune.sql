/*
  # Remove reading level functionality

  1. Changes
    - Remove reading_level column from stories table
    - Remove reading_level column from profiles table

  2. Security
    - Temporarily disable RLS during changes
    - Re-enable RLS after changes
*/

-- Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- Remove reading_level column from stories
ALTER TABLE stories 
DROP COLUMN IF EXISTS reading_level;

-- Remove reading_level column from profiles
ALTER TABLE profiles 
DROP COLUMN IF EXISTS reading_level;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;