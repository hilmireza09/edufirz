-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiz_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);

-- Enable RLS
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_attempts
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Teachers can view attempts for their quizzes" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;

-- Users can view their own quiz attempts
CREATE POLICY "Users can view their own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own quiz attempts
CREATE POLICY "Users can insert their own attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own quiz attempts
CREATE POLICY "Users can update their own attempts"
  ON public.quiz_attempts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Teachers can view attempts for their quizzes
CREATE POLICY "Teachers can view attempts for their quizzes"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_attempts.quiz_id
      AND quizzes.creator_id = auth.uid()
    )
  );

-- Admins can view all attempts
CREATE POLICY "Admins can view all attempts"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
