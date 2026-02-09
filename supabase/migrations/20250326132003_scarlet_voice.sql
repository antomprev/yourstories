/*
  # Rename stories table id column to story_id

  1. Changes
    - Rename 'id' column to 'story_id' in stories table
    - Update foreign key references
    - Update RLS policies to use new column name

  2. Security
    - Recreate RLS policies with new column name
    - Maintain existing security model
*/

-- Disable RLS temporarily to allow the migration
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own stories" ON stories;
DROP POLICY IF EXISTS "Users can create stories" ON stories;

-- Rename the column
ALTER TABLE stories RENAME COLUMN id TO story_id;

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Recreate policies with new column name
CREATE POLICY "Users can read own stories"
  ON stories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create stories"
  ON stories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);