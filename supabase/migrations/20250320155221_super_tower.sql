/*
  # Create stories table for AI-generated children's stories

  1. New Tables
    - `stories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `content` (text)
      - `age` (integer)
      - `duration` (integer)
      - `theme` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `stories` table
    - Add policies for authenticated users to:
      - Read their own stories
      - Create new stories
*/

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  age integer NOT NULL,
  duration integer NOT NULL,
  theme text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

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