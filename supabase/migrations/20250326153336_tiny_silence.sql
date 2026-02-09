/*
  # Update reading level options to new format

  1. Changes
    - Update reading level options in profiles and stories tables
    - Change to Gentle/Standard/Advanced format
    - Remove 'automatic' option as it will be handled in the application logic

  2. Security
    - Temporarily disable RLS for the migration
    - Re-enable RLS after changes
*/

-- Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- First, remove the constraints
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_reading_level_check;

ALTER TABLE stories 
DROP CONSTRAINT IF EXISTS stories_reading_level_check;

-- Update the data using DO block for safer execution
DO $$
BEGIN
  -- Update profiles
  UPDATE profiles
  SET reading_level = CASE reading_level
    WHEN 'gentle' THEN 'Gentle'
    WHEN 'standard' THEN 'Standard'
    WHEN 'advanced' THEN 'Advanced'
    ELSE 'Standard' -- Default to Standard for any other values
  END;

  -- Update stories
  UPDATE stories
  SET reading_level = CASE reading_level
    WHEN 'gentle' THEN 'Gentle'
    WHEN 'standard' THEN 'Standard'
    WHEN 'advanced' THEN 'Advanced'
    ELSE 'Standard' -- Default to Standard for any other values
  END;
END $$;

-- Add the new constraints with proper capitalization
ALTER TABLE profiles 
ADD CONSTRAINT profiles_reading_level_check 
CHECK (reading_level IN ('Gentle', 'Standard', 'Advanced'));

ALTER TABLE stories 
ADD CONSTRAINT stories_reading_level_check 
CHECK (reading_level IN ('Gentle', 'Standard', 'Advanced'));

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;