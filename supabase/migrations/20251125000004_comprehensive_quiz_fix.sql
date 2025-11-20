-- Comprehensive fix for quiz attempts system
-- This migration ensures multiple attempts work correctly with proper RLS

-- Step 1: Ensure quiz_attempts table has correct structure
ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_user_id_key;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;

-- Step 2: Drop all existing RLS policies for quiz_attempts
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Teachers can view attempts for their quizzes" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Creators can view attempts for their quizzes" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;

-- Step 3: Create comprehensive RLS policies
-- Allow users to SELECT their own attempts
CREATE POLICY "Users can view their own attempts"
ON public.quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to INSERT their own attempts
CREATE POLICY "Users can insert their own attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own attempts (for saving answers and submitting)
CREATE POLICY "Users can update their own attempts"
ON public.quiz_attempts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own attempts (for reset functionality)
CREATE POLICY "Users can delete their own attempts"
ON public.quiz_attempts FOR DELETE
USING (auth.uid() = user_id);

-- Allow quiz creators to view all attempts for their quizzes
CREATE POLICY "Creators can view attempts for their quizzes"
ON public.quiz_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes 
    WHERE id = quiz_attempts.quiz_id 
    AND creator_id = auth.uid()
  )
);

-- Step 4: Create or replace the submit_quiz_attempt function
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_attempt_id UUID,
  p_answers JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz_id UUID;
  v_user_id UUID;
  v_question RECORD;
  v_total_score INTEGER := 0;
  v_max_score INTEGER := 0;
  v_user_answer TEXT;
  v_user_answer_array JSONB;
  v_is_correct BOOLEAN;
  v_points INTEGER;
  v_correct_answers_array JSONB;
BEGIN
  -- Get attempt details and verify ownership
  SELECT quiz_id, user_id INTO v_quiz_id, v_user_id
  FROM quiz_attempts
  WHERE id = p_attempt_id AND user_id = auth.uid();

  IF v_quiz_id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found or unauthorized';
  END IF;

  -- Loop through all questions for this quiz
  FOR v_question IN
    SELECT 
      id, 
      question_type, 
      correct_answer, 
      correct_answers,
      COALESCE(points, 1) as points
    FROM quiz_questions 
    WHERE quiz_id = v_quiz_id
    ORDER BY order_index
  LOOP
    v_points := v_question.points;
    v_max_score := v_max_score + v_points;
    v_is_correct := FALSE;

    -- Get user's answer for this question
    v_user_answer_array := p_answers->(v_question.id::TEXT);
    
    IF v_user_answer_array IS NOT NULL THEN
      CASE v_question.question_type
        WHEN 'multiple_choice', 'true_false', 'fill_in_blank', 'essay' THEN
          -- Extract string value from JSONB
          v_user_answer := LOWER(TRIM(v_user_answer_array #>> '{}'));
          
          IF v_question.correct_answer IS NOT NULL AND 
             v_user_answer = LOWER(TRIM(v_question.correct_answer)) THEN
            v_is_correct := TRUE;
          END IF;
        
        WHEN 'checkbox' THEN
          -- For checkbox, compare arrays
          v_correct_answers_array := v_question.correct_answers;
          
          -- If correct_answers is null, try splitting correct_answer
          IF v_correct_answers_array IS NULL AND v_question.correct_answer IS NOT NULL THEN
            v_correct_answers_array := to_jsonb(string_to_array(v_question.correct_answer, '|||'));
          END IF;
          
          -- Check if arrays match (order doesn't matter)
          IF v_correct_answers_array IS NOT NULL AND 
             jsonb_typeof(v_user_answer_array) = 'array' AND
             jsonb_typeof(v_correct_answers_array) = 'array' THEN
            
            -- Arrays are equal if they contain the same elements
            IF v_correct_answers_array @> v_user_answer_array AND 
               v_user_answer_array @> v_correct_answers_array THEN
              v_is_correct := TRUE;
            END IF;
          END IF;
      END CASE;
    END IF;

    IF v_is_correct THEN
      v_total_score := v_total_score + v_points;
    END IF;
  END LOOP;

  -- Update the attempt with score and completion time
  UPDATE quiz_attempts
  SET 
    score = v_total_score,
    completed_at = NOW(),
    answers = p_answers,
    updated_at = NOW()
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'score', v_total_score,
    'max_score', v_max_score
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(UUID, JSONB) TO authenticated;

-- Step 5: Create helper function to check if user can start new attempt
CREATE OR REPLACE FUNCTION public.can_start_quiz_attempt(
  p_quiz_id UUID,
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts_allowed INTEGER;
  v_current_attempts INTEGER;
  v_has_active_attempt BOOLEAN;
BEGIN
  -- Verify user
  IF p_user_id != auth.uid() THEN
    RETURN jsonb_build_object('allowed', FALSE, 'reason', 'Unauthorized');
  END IF;

  -- Get quiz settings
  SELECT attempts_allowed INTO v_attempts_allowed
  FROM quizzes
  WHERE id = p_quiz_id;

  IF v_attempts_allowed IS NULL THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;

  -- Check for active (incomplete) attempt
  SELECT EXISTS(
    SELECT 1 FROM quiz_attempts 
    WHERE quiz_id = p_quiz_id 
    AND user_id = p_user_id 
    AND completed_at IS NULL
  ) INTO v_has_active_attempt;

  IF v_has_active_attempt THEN
    RETURN jsonb_build_object(
      'allowed', TRUE, 
      'reason', 'Resume existing attempt'
    );
  END IF;

  -- Count completed attempts
  SELECT COUNT(*) INTO v_current_attempts
  FROM quiz_attempts
  WHERE quiz_id = p_quiz_id 
  AND user_id = p_user_id 
  AND completed_at IS NOT NULL;

  -- Check if under limit (NULL means unlimited)
  IF v_attempts_allowed IS NOT NULL AND v_current_attempts >= v_attempts_allowed THEN
    RETURN jsonb_build_object(
      'allowed', FALSE, 
      'reason', 'Maximum attempts reached',
      'current_attempts', v_current_attempts,
      'attempts_allowed', v_attempts_allowed
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', TRUE,
    'current_attempts', v_current_attempts,
    'attempts_allowed', v_attempts_allowed
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_start_quiz_attempt(UUID, UUID) TO authenticated;
