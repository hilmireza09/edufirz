-- Add timer-related columns to quiz_attempts table
ALTER TABLE public.quiz_attempts 
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER,
ADD COLUMN IF NOT EXISTS time_remaining_seconds INTEGER,
ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_timer_active BOOLEAN DEFAULT false;

-- Create function to auto-submit quiz when timer expires
CREATE OR REPLACE FUNCTION public.check_and_submit_expired_quizzes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_result JSONB;
BEGIN
  -- Find all active attempts where timer has expired
  FOR v_attempt IN
    SELECT 
      qa.id,
      qa.quiz_id,
      qa.user_id,
      qa.answers,
      qa.timer_started_at,
      qa.time_limit_minutes
    FROM quiz_attempts qa
    WHERE qa.completed_at IS NULL
      AND qa.is_timer_active = true
      AND qa.timer_started_at IS NOT NULL
      AND qa.time_limit_minutes IS NOT NULL
      AND (EXTRACT(EPOCH FROM (NOW() - qa.timer_started_at)) / 60) >= qa.time_limit_minutes
  LOOP
    -- Auto-submit this attempt
    SELECT submit_quiz_attempt(v_attempt.id, v_attempt.answers) INTO v_result;
    
    -- Log the auto-submission
    RAISE NOTICE 'Auto-submitted quiz attempt % for user % (quiz %)', 
      v_attempt.id, v_attempt.user_id, v_attempt.quiz_id;
  END LOOP;
END;
$$;

-- Create function to start quiz timer
CREATE OR REPLACE FUNCTION public.start_quiz_timer(
  p_attempt_id UUID,
  p_time_limit_minutes INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify ownership
  SELECT user_id INTO v_user_id
  FROM quiz_attempts
  WHERE id = p_attempt_id AND user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found or unauthorized';
  END IF;

  -- Start the timer
  UPDATE quiz_attempts
  SET
    time_limit_minutes = p_time_limit_minutes,
    timer_started_at = NOW(),
    is_timer_active = true,
    time_remaining_seconds = p_time_limit_minutes * 60,
    updated_at = NOW()
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'success', true,
    'timer_started_at', NOW(),
    'time_limit_minutes', p_time_limit_minutes
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create function to update timer state
CREATE OR REPLACE FUNCTION public.update_quiz_timer(
  p_attempt_id UUID,
  p_time_remaining_seconds INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify ownership
  SELECT user_id INTO v_user_id
  FROM quiz_attempts
  WHERE id = p_attempt_id AND user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found or unauthorized';
  END IF;

  -- Update time remaining
  UPDATE quiz_attempts
  SET
    time_remaining_seconds = p_time_remaining_seconds,
    updated_at = NOW()
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'success', true,
    'time_remaining_seconds', p_time_remaining_seconds
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Update submit_quiz_attempt to handle timer cleanup
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

  -- Update the attempt with score, max_score, completion time, and stop timer
  UPDATE quiz_attempts
  SET
    score = v_total_score,
    max_score = v_max_score,
    completed_at = NOW(),
    answers = p_answers,
    is_timer_active = false,
    time_remaining_seconds = 0,
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
