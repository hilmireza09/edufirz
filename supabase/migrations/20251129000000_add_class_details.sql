-- Add category and settings columns to classes table
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"allow_posts": true, "require_approval": false}'::jsonb;

-- Update RLS policies to allow update for teachers
CREATE POLICY "Teachers can update their own classes"
ON classes FOR UPDATE
USING (auth.uid() = teacher_id);
