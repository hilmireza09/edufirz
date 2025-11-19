-- Drop the constraint if it exists
ALTER TABLE public.quizzes DROP CONSTRAINT IF EXISTS quizzes_difficulty_check;

-- Update existing data to ensure it complies with the new constraint
UPDATE public.quizzes 
SET difficulty = 'easy' 
WHERE difficulty IS NULL OR difficulty NOT IN ('easy', 'medium', 'hard');

-- Add the constraint back with the correct definition
ALTER TABLE public.quizzes 
ADD CONSTRAINT quizzes_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Set default value
ALTER TABLE public.quizzes 
ALTER COLUMN difficulty SET DEFAULT 'easy';

-- Create an index on difficulty for faster filtering
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON public.quizzes(difficulty);
