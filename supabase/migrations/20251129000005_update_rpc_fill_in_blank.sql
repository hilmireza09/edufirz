-- Update submit_quiz_attempt to handle fill_in_blank with multiple blanks
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
  v_total_score NUMERIC := 0;
  v_max_score NUMERIC := 0;
  v_user_answer JSONB;
  v_is_correct BOOLEAN;
  v_points NUMERIC;
  v_blank_def JSONB;
  v_blank_idx INTEGER;
  v_blank_user_val TEXT;
  v_blank_points NUMERIC;
  v_blank_correct BOOLEAN;
  v_question_score NUMERIC;
  v_accepted_answers JSONB;
  v_accepted_answer TEXT;
  v_q_correct_answers JSONB;
  v_q_options JSONB;
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
    v_question_score := 0;
    
    -- Normalize options and correct_answers to JSONB
    -- This handles cases where columns might be text[] or other types
    IF v_question.correct_answers IS NULL THEN
      v_q_correct_answers := NULL;
    ELSE
      v_q_correct_answers := to_jsonb(v_question.correct_answers);
    END IF;

    IF v_question.options IS NULL THEN
      v_q_options := NULL;
    ELSE
      v_q_options := to_jsonb(v_question.options);
    END IF;

    IF v_user_answer IS NOT NULL THEN
      CASE v_question.question_type
        WHEN 'multiple_choice', 'true_false', 'essay' THEN
          -- Simple string comparison (case insensitive)
          IF LOWER(TRIM(v_user_answer #>> '{}')) = LOWER(TRIM(v_question.correct_answer)) THEN
            v_is_correct := TRUE;
            v_question_score := v_points;
          END IF;
        
        WHEN 'checkbox' THEN
          -- Array comparison
          IF v_q_correct_answers IS NOT NULL AND jsonb_typeof(v_q_correct_answers) = 'array' AND jsonb_typeof(v_user_answer) = 'array' THEN
             IF jsonb_array_length(v_q_correct_answers) = jsonb_array_length(v_user_answer) THEN
               IF v_q_correct_answers @> v_user_answer AND v_user_answer @> v_q_correct_answers THEN
                 v_is_correct := TRUE;
                 v_question_score := v_points;
               END IF;
             END IF;
          END IF;

        WHEN 'fill_in_blank' THEN
          -- Handle multiple blanks
          -- v_question.options contains the blanks definition: [{index, accepted_answers, points}]
          -- v_user_answer should be an object: { "0": "answer1", "1": "answer2" } or array ["answer1", "answer2"]
          
          IF v_q_options IS NOT NULL AND jsonb_typeof(v_q_options) = 'array' THEN
             FOR v_blank_def IN SELECT * FROM jsonb_array_elements(v_q_options)
             LOOP
               v_blank_idx := (v_blank_def->>'index')::INTEGER;
               v_blank_points := COALESCE((v_blank_def->>'points')::NUMERIC, 0);
               v_accepted_answers := v_blank_def->'accepted_answers';
               
               -- Get user answer for this blank
               -- Support both array (by index) and object (by key)
               IF jsonb_typeof(v_user_answer) = 'array' THEN
                 v_blank_user_val := v_user_answer->>v_blank_idx;
               ELSE
                 v_blank_user_val := v_user_answer->>(v_blank_idx::TEXT);
               END IF;

               v_blank_correct := FALSE;
               
               IF v_blank_user_val IS NOT NULL THEN
                 -- Check against accepted answers
                 FOR v_accepted_answer IN SELECT * FROM jsonb_array_elements_text(v_accepted_answers)
                 LOOP
                   IF LOWER(TRIM(v_blank_user_val)) = LOWER(TRIM(v_accepted_answer)) THEN
                     v_blank_correct := TRUE;
                     EXIT;
                   END IF;
                 END LOOP;
               END IF;

               IF v_blank_correct THEN
                 v_question_score := v_question_score + v_blank_points;
               END IF;
             END LOOP;
             
             -- If total score matches max points, mark as fully correct
             IF v_question_score >= v_points THEN
               v_is_correct := TRUE;
               v_question_score := v_points; -- Cap at max points
             END IF;
          ELSE
             -- Fallback for simple single blank stored in correct_answer (legacy support if needed)
             IF LOWER(TRIM(v_user_answer #>> '{}')) = LOWER(TRIM(v_question.correct_answer)) THEN
                v_is_correct := TRUE;
                v_question_score := v_points;
             END IF;
          END IF;
      END CASE;
    END IF;

    v_total_score := v_total_score + v_question_score;
  END LOOP;

  -- Update attempt
  UPDATE quiz_attempts
  SET 
    score = v_total_score,
    max_score = v_max_score,
    completed_at = NOW(),
    answers = p_answers
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'score', v_total_score,
    'max_score', v_max_score
  );
END;
$$;
