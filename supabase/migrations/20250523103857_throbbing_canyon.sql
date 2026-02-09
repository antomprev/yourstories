/*
  # Add duration column to stories table

  1. Changes
    - Add duration column to stories table to store story duration (Short/Standard/Long)
    - Add check constraint to ensure valid duration values
    - Set default value to 'Standard'

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
*/

ALTER TABLE stories 
ADD COLUMN duration text NOT NULL DEFAULT 'Standard'
CHECK (duration IN ('Short', 'Standard', 'Long'));