/*
  # Remove duration column from stories table

  1. Changes
    - Remove duration column from stories table
    - Keep existing data intact
    - Update constraints and indexes if needed

  2. Security
    - No changes to RLS policies needed
*/

ALTER TABLE stories 
DROP COLUMN IF EXISTS duration;