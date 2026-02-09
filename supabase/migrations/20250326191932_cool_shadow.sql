/*
  # Fix delete policy for stories table

  1. Changes
    - Drop existing delete policy if it exists
    - Create new delete policy with correct column name (story_id)

  2. Security
    - Ensure users can only delete their own stories
*/

-- Temporarily disable RLS
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;

-- Create new delete policy
CREATE POLICY "Users can delete own stories"
  ON stories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;