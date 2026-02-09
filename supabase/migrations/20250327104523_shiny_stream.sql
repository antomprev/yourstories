/*
  # Remove language columns from tables

  1. Changes
    - Remove language column from stories table
    - Remove language column from profiles table
    - Remove language check constraint from profiles table

  2. Security
    - Temporarily disable RLS during changes
    - Re-enable RLS after changes
*/

-- Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- Remove language columns
ALTER TABLE stories 
DROP COLUMN IF EXISTS language;

ALTER TABLE profiles 
DROP COLUMN IF EXISTS language;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;