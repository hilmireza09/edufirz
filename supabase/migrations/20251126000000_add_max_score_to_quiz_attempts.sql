-- Add max_score column to quiz_attempts table
ALTER TABLE public.quiz_attempts 
ADD COLUMN IF NOT EXISTS max_score INTEGER;

-- Update existing records to calculate and store max_score
UPDATE public.quiz_attempts qa
SET max_score = (
  SELECT COALESCE(SUM(COALESCE(qq.points, 1)), 0)
  FROM public.quiz_questions qq
  WHERE qq.quiz_id = qa.quiz_id
)
WHERE max_score IS NULL;

-- Update the submit_quiz_attempt function to store max_score
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

  -- Update the attempt with score, max_score, and completion time
  UPDATE quiz_attempts
  SET 
    score = v_total_score,
    max_score = v_max_score,
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
