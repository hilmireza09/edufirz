-- Update quiz status check constraint to include 'private'
ALTER TABLE public.quizzes DROP CONSTRAINT IF EXISTS quizzes_status_check;
ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_status_check CHECK (status IN ('draft', 'published', 'private'));
