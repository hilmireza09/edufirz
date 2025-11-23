-- Fix essay question scoring logic with proper normalization
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
  v_blank_correct BOOLEAN;
  v_question_score NUMERIC;
  v_accepted_answers JSONB;
  v_accepted_answer TEXT;
  v_q_correct_answers JSONB;
  v_q_options JSONB;
  v_total_blanks INTEGER;
  v_correct_blanks INTEGER;
  v_user_answer_normalized TEXT;
  v_correct_answer_normalized TEXT;
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
        WHEN 'multiple_choice' THEN
          -- Simple string comparison (case insensitive)
          IF LOWER(TRIM(v_user_answer #>> '{}')) = LOWER(TRIM(v_question.correct_answer)) THEN
            v_is_correct := TRUE;
            v_question_score := v_points;
          END IF;

        WHEN 'essay' THEN
          -- Essay evaluation: normalize both answers (trim, lowercase, clean whitespace)
          -- Compare against the expected answer stored in correct_answer
          IF v_question.correct_answer IS NOT NULL AND LENGTH(TRIM(v_question.correct_answer)) > 0 THEN
            -- Normalize both answers: trim, lowercase, replace multiple spaces with single space
            v_user_answer_normalized := LOWER(REGEXP_REPLACE(TRIM(v_user_answer #>> '{}'), '\s+', ' ', 'g'));
            v_correct_answer_normalized := LOWER(REGEXP_REPLACE(TRIM(v_question.correct_answer), '\s+', ' ', 'g'));

            -- For essays, we do exact match after normalization
            IF v_user_answer_normalized = v_correct_answer_normalized THEN
              v_is_correct := TRUE;
              v_question_score := v_points;
            END IF;
          ELSE
            -- If no expected answer is defined, essays are considered manually graded (always pass for now)
            v_is_correct := TRUE;
            v_question_score := v_points;
          END IF;

        WHEN 'true_false' THEN
          -- True/False comparison (case insensitive, handle boolean vs string)
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
          IF v_q_options IS NOT NULL AND jsonb_typeof(v_q_options) = 'array' THEN
             v_total_blanks := jsonb_array_length(v_q_options);
             v_correct_blanks := 0;

             FOR v_blank_def IN SELECT * FROM jsonb_array_elements(v_q_options)
             LOOP
               -- Handle potential double-encoding if column was text[]
               IF jsonb_typeof(v_blank_def) = 'string' THEN
                 BEGIN
                   v_blank_def := (v_blank_def #>> '{}')::jsonb;
                 EXCEPTION WHEN OTHERS THEN
                   -- Ignore if not valid json, keep as is (will likely fail next steps but prevents crash)
                 END;
               END IF;

               v_blank_idx := (v_blank_def->>'index')::INTEGER;
               v_accepted_answers := v_blank_def->'accepted_answers';

               -- Get user answer for this blank
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
                 v_correct_blanks := v_correct_blanks + 1;
               END IF;
             END LOOP;

             -- Calculate score based on proportion of correct blanks
             IF v_total_blanks > 0 THEN
               v_question_score := (v_correct_blanks::NUMERIC / v_total_blanks::NUMERIC) * v_points;

               -- If all blanks are correct, mark question as correct
               IF v_correct_blanks = v_total_blanks THEN
                 v_is_correct := TRUE;
               END IF;
             END IF;
          ELSE
             -- Fallback for simple single blank stored in correct_answer
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
