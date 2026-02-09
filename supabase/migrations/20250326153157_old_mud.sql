/*
  # Update reading level options

  1. Changes
    - Update reading level options in profiles and stories tables
    - Change from beginner/intermediate/advanced to gentle/standard/advanced
    - Update existing data safely using a DO block
    - Update constraints after data migration

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
    WHEN 'beginner' THEN 'gentle'
    WHEN 'intermediate' THEN 'standard'
    ELSE reading_level -- keeps 'advanced' and 'automatic' as is
  END;

  -- Update stories
  UPDATE stories
  SET reading_level = CASE reading_level
    WHEN 'beginner' THEN 'gentle'
    WHEN 'intermediate' THEN 'standard'
    ELSE reading_level -- keeps 'advanced' and 'automatic' as is
  END;
END $$;

-- Add the new constraints
ALTER TABLE profiles 
ADD CONSTRAINT profiles_reading_level_check 
CHECK (reading_level IN ('gentle', 'standard', 'advanced', 'automatic'));

ALTER TABLE stories 
ADD CONSTRAINT stories_reading_level_check 
CHECK (reading_level IN ('gentle', 'standard', 'advanced', 'automatic'));

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;