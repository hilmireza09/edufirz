-- Update quiz_questions table to support multiple question types
-- This migration adds support for: Multiple Choice, Checkbox (Select All), Essay, Fill-in-the-Blank, and True/False

-- First, update the type column to use an enum for better type safety
DO $$ BEGIN
  CREATE TYPE public.question_type AS ENUM (
    'multiple_choice',
    'checkbox',
    'essay',
    'fill_in_blank',
    'true_false'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Alter quiz_questions table to support flexible answer formats
-- For checkbox questions, correct_answer will store a JSON array of correct answers
-- For essay questions, correct_answer stores grading rubric/key points
-- For fill-in-blank, correct_answer stores acceptable answers (case-insensitive matching)

ALTER TABLE public.quiz_questions 
  ALTER COLUMN correct_answer TYPE TEXT;

-- Add a column to store multiple correct answers for checkbox questions
ALTER TABLE public.quiz_questions 
  ADD COLUMN IF NOT EXISTS correct_answers JSONB;

-- Update RLS policies for quiz_questions
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view published quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Teachers and admins can manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Users can view their own quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Creators can update their quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Creators can delete their quiz questions" ON public.quiz_questions;

-- Enable RLS on quiz_questions if not already enabled
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view questions from published quizzes
CREATE POLICY "Users can view published quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.status = 'published'
      AND quizzes.deleted_at IS NULL
    )
  );

-- Policy: Teachers and admins can view all quiz questions
CREATE POLICY "Teachers and admins can view all quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Policy: Only teachers and admins can insert quiz questions
CREATE POLICY "Teachers and admins can insert quiz questions"
  ON public.quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
    AND EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.creator_id = auth.uid()
    )
  );

-- Policy: Creators can update their quiz questions
CREATE POLICY "Creators can update their quiz questions"
  ON public.quiz_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.creator_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Policy: Creators can delete their quiz questions (soft delete)
CREATE POLICY "Creators can delete their quiz questions"
  ON public.quiz_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.creator_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  )
  WITH CHECK (deleted_at IS NOT NULL);

-- Update RLS policies for quizzes table
DROP POLICY IF EXISTS "Teachers and admins can insert quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teachers and admins can update their quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teachers and admins can delete their quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can view published quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teachers and admins can view all quizzes" ON public.quizzes;

-- Enable RLS on quizzes if not already enabled
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published quizzes
CREATE POLICY "Users can view published quizzes"
  ON public.quizzes FOR SELECT
  USING (
    status = 'published' AND deleted_at IS NULL
  );

-- Policy: Teachers and admins can view all quizzes (including drafts)
CREATE POLICY "Teachers and admins can view all quizzes"
  ON public.quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Policy: Only teachers and admins can create quizzes
CREATE POLICY "Teachers and admins can insert quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (
    creator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Policy: Creators can update their own quizzes, admins can update all
CREATE POLICY "Teachers and admins can update their quizzes"
  ON public.quizzes FOR UPDATE
  USING (
    (creator_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Policy: Creators can soft-delete their quizzes, admins can delete all
CREATE POLICY "Teachers and admins can delete their quizzes"
  ON public.quizzes FOR UPDATE
  USING (
    (creator_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  )
  WITH CHECK (deleted_at IS NOT NULL);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_type ON public.quiz_questions(type);
CREATE INDEX IF NOT EXISTS idx_quizzes_creator_id ON public.quizzes(creator_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);
