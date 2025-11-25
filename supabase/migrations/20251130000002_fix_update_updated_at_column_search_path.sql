-- Fix mutable search_path security issue in update_updated_at_column function
-- This migration ensures the function has a stable search_path and uses schema-qualified references

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create the function with explicit search_path and schema-qualified references
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Update the updated_at column to the current timestamp
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Trigger function to automatically update the updated_at timestamp on row updates. 
Uses explicit search_path for security and deterministic behavior.';

-- Recreate triggers for tables that use this function
-- (Only if they existed; adjust based on your actual tables)

-- Trigger for quizzes table
DROP TRIGGER IF EXISTS update_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for quiz_questions table
DROP TRIGGER IF EXISTS update_quiz_questions_updated_at ON public.quiz_questions;
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for classes table
DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for class_assignments table
DROP TRIGGER IF EXISTS update_class_assignments_updated_at ON public.class_assignments;
CREATE TRIGGER update_class_assignments_updated_at
  BEFORE UPDATE ON public.class_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for profiles table (if it exists)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
