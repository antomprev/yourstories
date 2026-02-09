/*
  # Add DELETE policy for stories table

  1. Changes
    - Add policy to allow users to delete their own stories

  2. Security
    - Users can only delete stories they own
    - Maintains existing RLS security model
*/

-- Add DELETE policy
CREATE POLICY "Users can delete own stories"
  ON stories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);