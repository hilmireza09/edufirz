-- Fix RLS policies for quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Creators can view attempts for their quizzes" ON public.quiz_attempts;

CREATE POLICY "Users can view their own attempts"
ON public.quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts"
ON public.quiz_attempts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attempts"
ON public.quiz_attempts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Creators can view attempts for their quizzes"
ON public.quiz_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes 
    WHERE id = public.quiz_attempts.quiz_id 
    AND creator_id = auth.uid()
  )
);

-- Function to submit quiz attempt securely
CREATE OR REPLACE FUNCTION submit_quiz_attempt(
  p_attempt_id UUID,
  p_answers JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_id UUID;
  v_user_id UUID;
  v_question RECORD;
  v_total_score INTEGER := 0;
  v_max_score INTEGER := 0;
  v_user_answer JSONB;
  v_is_correct BOOLEAN;
  v_points INTEGER;
BEGIN
  -- Get attempt details
  SELECT quiz_id, user_id INTO v_quiz_id, v_user_id
  FROM quiz_attempts
  WHERE id = p_attempt_id;

  IF v_quiz_id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  -- Verify user owns the attempt
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Loop through questions
  FOR v_question IN
    SELECT * FROM quiz_questions WHERE quiz_id = v_quiz_id
  LOOP
    v_points := COALESCE(v_question.points, 1);
    v_max_score := v_max_score + v_points;
    v_user_answer := p_answers->(v_question.id::TEXT);
    v_is_correct := FALSE;

    IF v_user_answer IS NOT NULL THEN
      CASE v_question.question_type
        WHEN 'multiple_choice', 'true_false', 'essay', 'fill_in_blank' THEN
          -- Simple string comparison (case insensitive)
          -- Note: JSONB string values are quoted, e.g. "answer". We need to unquote.
          IF LOWER(TRIM(v_user_answer #>> '{}')) = LOWER(TRIM(v_question.correct_answer)) THEN
            v_is_correct := TRUE;
          END IF;
        
        WHEN 'checkbox' THEN
          -- Array comparison
          IF v_question.correct_answers IS NOT NULL AND jsonb_typeof(v_question.correct_answers) = 'array' AND jsonb_typeof(v_user_answer) = 'array' THEN
             -- Check if lengths match
             IF jsonb_array_length(v_question.correct_answers) = jsonb_array_length(v_user_answer) THEN
               -- Check containment: correct_answers contains user_answer AND user_answer contains correct_answers
               IF v_question.correct_answers @> v_user_answer AND v_user_answer @> v_question.correct_answers THEN
                 v_is_correct := TRUE;
               END IF;
             END IF;
          END IF;
      END CASE;
    END IF;

    IF v_is_correct THEN
      v_total_score := v_total_score + v_points;
    END IF;
  END LOOP;

  -- Update attempt
  UPDATE quiz_attempts
  SET 
    score = v_total_score,
    completed_at = NOW(),
    answers = p_answers
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'success', true,
    'score', v_total_score,
    'max_score', v_max_score
  );
END;
$$;
