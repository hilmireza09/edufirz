-- Fix RPC submission error "Token 'sdf' is invalid"
-- This error occurs when a string is cast to JSONB but is not valid JSON
-- We need to ensure robust handling of fill-in-blank options and other JSON fields

-- First, drop all existing versions to avoid ambiguity
DROP FUNCTION IF EXISTS public.submit_quiz_attempt(UUID, TEXT);
DROP FUNCTION IF EXISTS public.submit_quiz_attempt(UUID, JSONB);
DROP FUNCTION IF EXISTS public.submit_quiz_attempt(UUID, JSON);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_attempt_id UUID,
  p_answers JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
  
  -- Variables for checkbox scoring
  v_chk_total_correct NUMERIC;
  v_chk_user_correct NUMERIC;
  v_chk_user_incorrect NUMERIC;
  v_chk_opt TEXT;
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
    
    -- Safely extract user answer
    BEGIN
      v_user_answer := p_answers->(v_question.id::TEXT);
    EXCEPTION WHEN OTHERS THEN
      v_user_answer := NULL;
    END;
    
    v_is_correct := FALSE;
    v_question_score := 0;

    -- Convert correct_answers to JSONB (handles NULL, empty arrays, and populated arrays)
    IF v_question.correct_answers IS NOT NULL THEN
      v_q_correct_answers := to_jsonb(v_question.correct_answers);
    ELSE
      v_q_correct_answers := NULL;
    END IF;

    -- Fallback: If correct_answers is NULL or empty array, try to parse from correct_answer field
    IF v_q_correct_answers IS NULL OR v_q_correct_answers = '[]'::jsonb THEN
      -- Try to parse correct_answer field (format: "A|||B|||C")
      IF v_question.correct_answer IS NOT NULL AND v_question.correct_answer LIKE '%|||%' THEN
        v_q_correct_answers := to_jsonb(string_to_array(v_question.correct_answer, '|||'));
      ELSIF v_question.correct_answer IS NOT NULL AND LENGTH(TRIM(v_question.correct_answer)) > 0 THEN
        -- Single answer as array
        v_q_correct_answers := jsonb_build_array(TRIM(v_question.correct_answer));
      END IF;
    END IF;

    -- Convert options to JSONB
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
          IF v_question.correct_answer IS NOT NULL AND LENGTH(TRIM(v_question.correct_answer)) > 0 THEN
            v_user_answer_normalized := LOWER(REGEXP_REPLACE(TRIM(v_user_answer #>> '{}'), '\s+', ' ', 'g'));
            v_correct_answer_normalized := LOWER(REGEXP_REPLACE(TRIM(v_question.correct_answer), '\s+', ' ', 'g'));

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

        -- Handle both 'checkbox' and 'multiple_answers' with STRICT EXACT MATCHING
        WHEN 'checkbox', 'multiple_answers' THEN
          -- Ensure we have a valid array for correct answers
          IF v_q_correct_answers IS NOT NULL AND jsonb_typeof(v_q_correct_answers) = 'array' THEN
             v_chk_total_correct := jsonb_array_length(v_q_correct_answers);
          ELSE
             v_chk_total_correct := 0;
          END IF;

          -- Handle data error: No correct answers defined
          IF v_chk_total_correct = 0 THEN
             -- Ignore this question in scoring (remove from max score)
             v_max_score := v_max_score - v_points;
             v_question_score := 0;
             v_is_correct := FALSE;
          ELSE
             -- Proceed with scoring if user provided an array answer
             IF jsonb_typeof(v_user_answer) = 'array' THEN
                 v_chk_user_correct := 0;
                 v_chk_user_incorrect := 0;
                 
                 -- Count correct and incorrect selections
                 FOR v_chk_opt IN SELECT * FROM jsonb_array_elements_text(v_user_answer)
                 LOOP
                   -- Check if the selected option is in the correct answers array
                   IF EXISTS (
                      SELECT 1 
                      FROM jsonb_array_elements_text(v_q_correct_answers) ca 
                      WHERE ca = v_chk_opt
                   ) THEN
                     v_chk_user_correct := v_chk_user_correct + 1;
                   ELSE
                     v_chk_user_incorrect := v_chk_user_incorrect + 1;
                   END IF;
                 END LOOP;

                 -- STRICT EXACT MATCHING RULE:
                 -- Must select ALL correct answers AND NO incorrect answers.
                 -- Any deviation results in 0 points.
                 IF v_chk_user_correct = v_chk_total_correct AND v_chk_user_incorrect = 0 THEN
                   v_question_score := v_points;
                   v_is_correct := TRUE;
                 ELSE
                   v_question_score := 0;
                   v_is_correct := FALSE;
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
               -- This is where "Token 'sdf' is invalid" usually happens if we try to cast a plain string to JSONB
               IF jsonb_typeof(v_blank_def) = 'string' THEN
                 BEGIN
                   v_blank_def := (v_blank_def #>> '{}')::jsonb;
                 EXCEPTION WHEN OTHERS THEN
                   -- If it's not valid JSON, it might be a plain string option (not a blank definition)
                   -- In this case, we can't process it as a blank definition
                   CONTINUE;
                 END;
               END IF;

               -- Safely extract index
               BEGIN
                 v_blank_idx := (v_blank_def->>'index')::INTEGER;
               EXCEPTION WHEN OTHERS THEN
                 CONTINUE;
               END;
               
               v_accepted_answers := v_blank_def->'accepted_answers';

               -- Get user answer for this blank
               IF jsonb_typeof(v_user_answer) = 'array' THEN
                 v_blank_user_val := v_user_answer->>v_blank_idx;
               ELSE
                 v_blank_user_val := v_user_answer->>(v_blank_idx::TEXT);
               END IF;

               v_blank_correct := FALSE;

               IF v_blank_user_val IS NOT NULL AND jsonb_typeof(v_accepted_answers) = 'array' THEN
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

             -- All-or-nothing scoring for fill-in-blank
             IF v_correct_blanks = v_total_blanks AND v_total_blanks > 0 THEN
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
    answers = p_answers,
    completed_at = NOW()
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'score', v_total_score,
    'max_score', v_max_score
  );
END;
$$;
