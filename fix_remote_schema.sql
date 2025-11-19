-- Fix quiz_questions table schema
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS question_text TEXT;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice';
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Copy data from old columns to new columns if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_questions' AND column_name = 'question') THEN
    UPDATE public.quiz_questions SET question_text = question WHERE question_text IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_questions' AND column_name = 'type') THEN
    UPDATE public.quiz_questions SET question_type = type WHERE question_type IS NULL OR question_type = 'multiple_choice';
  END IF;
END $$;

-- Drop old columns
ALTER TABLE public.quiz_questions DROP COLUMN IF EXISTS question CASCADE;
ALTER TABLE public.quiz_questions DROP COLUMN IF EXISTS type CASCADE;

-- Ensure question_text is NOT NULL
ALTER TABLE public.quiz_questions ALTER COLUMN question_text SET NOT NULL;
ALTER TABLE public.quiz_questions ALTER COLUMN question_type SET NOT NULL;
