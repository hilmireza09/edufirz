-- Fix quiz_attempts table schema by ensuring columns exist
-- This handles the case where the table existed but was missing columns

DO $$ 
BEGIN
  -- Add started_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_attempts' AND column_name = 'started_at') THEN
    ALTER TABLE public.quiz_attempts ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add completed_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_attempts' AND column_name = 'completed_at') THEN
    ALTER TABLE public.quiz_attempts ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add score if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_attempts' AND column_name = 'score') THEN
    ALTER TABLE public.quiz_attempts ADD COLUMN score INTEGER;
  END IF;

  -- Add answers if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_attempts' AND column_name = 'answers') THEN
    ALTER TABLE public.quiz_attempts ADD COLUMN answers JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_attempts_quiz_id_user_id_key') THEN
    -- Remove duplicates first
    DELETE FROM public.quiz_attempts a USING public.quiz_attempts b
    WHERE a.id < b.id AND a.quiz_id = b.quiz_id AND a.user_id = b.user_id;
    
    ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_quiz_id_user_id_key UNIQUE(quiz_id, user_id);
  END IF;
END $$;

-- Force schema cache reload by notifying pgrst (optional, but good practice)
NOTIFY pgrst, 'reload config';
