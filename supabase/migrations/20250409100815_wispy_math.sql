/*
  # Add child age field to profiles table

  1. Changes
    - Add child_age column to profiles table
    - Set default value to null
    - Add check constraint to ensure age is reasonable

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
*/

ALTER TABLE profiles 
ADD COLUMN child_age integer DEFAULT NULL
CHECK (child_age >= 0 AND child_age <= 18);