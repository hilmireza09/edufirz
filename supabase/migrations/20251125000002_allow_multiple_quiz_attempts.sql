-- Remove unique constraint on quiz_attempts to allow multiple attempts per user
ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_user_id_key;

-- Add attempt_number column to track which attempt this is
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
