/*
  # Fix reading level constraints and data

  1. Changes
    - Update reading_level constraints to match the application values
    - Ensure all existing data is consistent with new constraints
    - Add proper error handling for invalid values

  2. Security
    - Temporarily disable RLS for the migration
    - Re-enable RLS after changes
*/

-- Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- Update reading_level values and constraints
DO $$
BEGIN
  -- First, ensure all existing data uses valid values
  UPDATE profiles
  SET reading_level = 'Standard'
  WHERE reading_level NOT IN ('Gentle', 'Standard', 'Advanced');

  UPDATE stories
  SET reading_level = 'Standard'
  WHERE reading_level NOT IN ('Gentle', 'Standard', 'Advanced');

  -- Drop existing constraints if they exist
  ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_reading_level_check;

  ALTER TABLE stories 
  DROP CONSTRAINT IF EXISTS stories_reading_level_check;

  -- Add new constraints with correct values
  ALTER TABLE profiles 
  ADD CONSTRAINT profiles_reading_level_check 
  CHECK (reading_level IN ('Gentle', 'Standard', 'Advanced'));

  ALTER TABLE stories 
  ADD CONSTRAINT stories_reading_level_check 
  CHECK (reading_level IN ('Gentle', 'Standard', 'Advanced'));
END $$;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;