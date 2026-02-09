-- Add language column to profiles
ALTER TABLE profiles 
ADD COLUMN language text NOT NULL DEFAULT 'Eng'
CHECK (language IN ('Eng', 'Esp', 'Gre'));