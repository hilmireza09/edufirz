-- Fix fill-in-blank scoring to handle duplicate blank definitions
-- Deduplicate by index field to match the actual number of blanks in the question

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
  v_array_index INTEGER;
  v_seen_indices JSONB;
  v_unique_blanks JSONB;
  v_blank_count INTEGER;
  
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
    SELECT * FROM quiz_questions WHERE quiz_id = v_quiz_id ORDER BY order_index
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

    -- Convert correct_answers to JSONB
    IF v_question.correct_answers IS NOT NULL THEN
      v_q_correct_answers := to_jsonb(v_question.correct_answers);
    ELSE
      v_q_correct_answers := NULL;
    END IF;

    -- Fallback: If correct_answers is NULL or empty array, try to parse from correct_answer field
    IF v_q_correct_answers IS NULL OR v_q_correct_answers = '[]'::jsonb THEN
      IF v_question.correct_answer IS NOT NULL AND v_question.correct_answer LIKE '%|||%' THEN
        v_q_correct_answers := to_jsonb(string_to_array(v_question.correct_answer, '|||'));
      ELSIF v_question.correct_answer IS NOT NULL AND LENGTH(TRIM(v_question.correct_answer)) > 0 THEN
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
          IF LOWER(TRIM(v_user_answer #>> '{}')) = LOWER(TRIM(v_question.correct_answer)) THEN
            v_is_correct := TRUE;
            v_question_score := v_points;
          END IF;

        WHEN 'essay' THEN
          IF v_question.correct_answer IS NOT NULL AND LENGTH(TRIM(v_question.correct_answer)) > 0 THEN
            v_user_answer_normalized := LOWER(REGEXP_REPLACE(TRIM(v_user_answer #>> '{}'), '\s+', ' ', 'g'));
            v_correct_answer_normalized := LOWER(REGEXP_REPLACE(TRIM(v_question.correct_answer), '\s+', ' ', 'g'));

            IF v_user_answer_normalized = v_correct_answer_normalized THEN
              v_is_correct := TRUE;
              v_question_score := v_points;
            END IF;
          ELSE
            v_is_correct := FALSE;
            v_question_score := 0;
          END IF;

        WHEN 'true_false' THEN
          IF LOWER(TRIM(v_user_answer #>> '{}')) = LOWER(TRIM(v_question.correct_answer)) THEN
            v_is_correct := TRUE;
            v_question_score := v_points;
          END IF;

        WHEN 'checkbox', 'multiple_answers' THEN
          IF v_q_correct_answers IS NOT NULL AND jsonb_typeof(v_q_correct_answers) = 'array' THEN
             v_chk_total_correct := jsonb_array_length(v_q_correct_answers);
          ELSE
             v_chk_total_correct := 0;
          END IF;

          IF v_chk_total_correct = 0 THEN
             v_max_score := v_max_score - v_points;
             v_question_score := 0;
             v_is_correct := FALSE;
          ELSE
             IF jsonb_typeof(v_user_answer) = 'array' THEN
                 v_chk_user_correct := 0;
                 v_chk_user_incorrect := 0;
                 
                 FOR v_chk_opt IN SELECT * FROM jsonb_array_elements_text(v_user_answer)
                 LOOP
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

                 IF v_chk_user_correct = v_chk_total_correct AND v_chk_user_incorrect = 0 THEN
                   v_question_score := v_points;
                   v_is_correct := TRUE;
                 ELSE
                   v_question_score := 0;
                   v_is_correct := FALSE;
                 END IF;
             ELSE
               v_question_score := 0;
               v_is_correct := FALSE;
             END IF;
          END IF;

        WHEN 'fill_in_blank' THEN
          -- Count actual blanks in question text by counting [blank] occurrences
          v_blank_count := array_length(string_to_array(v_question.question_text, '[blank]'), 1) - 1;
          
          -- If we can't determine from text, use user answer array length
          IF v_blank_count IS NULL OR v_blank_count <= 0 THEN
            IF jsonb_typeof(v_user_answer) = 'array' THEN
              v_blank_count := jsonb_array_length(v_user_answer);
            ELSE
              v_blank_count := 1;
            END IF;
          END IF;

          IF jsonb_typeof(v_user_answer) = 'array' AND v_q_options IS NOT NULL AND jsonb_typeof(v_q_options) = 'array' THEN
             v_correct_blanks := 0;
             v_array_index := 0;
             v_seen_indices := '[]'::jsonb;
             
             -- Process blanks up to the actual blank count (handles duplicates in options array)
             FOR v_blank_def IN SELECT * FROM jsonb_array_elements(v_q_options)
             LOOP
               -- Stop if we've processed all actual blanks
               EXIT WHEN v_array_index >= v_blank_count;
               
               -- Handle potential double-encoding
               IF jsonb_typeof(v_blank_def) = 'string' THEN
                 BEGIN
                   v_blank_def := (v_blank_def #>> '{}')::jsonb;
                 EXCEPTION WHEN OTHERS THEN
                   v_array_index := v_array_index + 1;
                   CONTINUE;
                 END;
               END IF;

               -- Get the index from definition
               BEGIN
                 v_blank_idx := (v_blank_def->>'index')::INTEGER;
               EXCEPTION WHEN OTHERS THEN
                 v_blank_idx := v_array_index;
               END;
               
               -- Skip if we've already processed this index (handles duplicates)
               IF v_seen_indices ? v_blank_idx::text THEN
                 CONTINUE;
               END IF;
               
               v_seen_indices := v_seen_indices || jsonb_build_array(v_blank_idx);
               v_accepted_answers := v_blank_def->'accepted_answers';

               -- Get user answer at this array position
               BEGIN
                 v_blank_user_val := v_user_answer->>v_array_index;
               EXCEPTION WHEN OTHERS THEN
                 v_blank_user_val := NULL;
               END;

               v_blank_correct := FALSE;

               IF v_blank_user_val IS NOT NULL AND jsonb_typeof(v_accepted_answers) = 'array' THEN
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

               v_array_index := v_array_index + 1;
             END LOOP;

             -- Check if all blanks are correct
             IF v_correct_blanks = v_blank_count AND v_blank_count > 0 THEN
               v_is_correct := TRUE;
               v_question_score := v_points;
             ELSE
               v_is_correct := FALSE;
               v_question_score := 0;
             END IF;
          END IF;
      END CASE;
    END IF;

    IF v_question_score > v_points THEN
      v_question_score := v_points;
    END IF;

    v_total_score := v_total_score + v_question_score;
  END LOOP;

  IF v_total_score > v_max_score THEN
    v_total_score := v_max_score;
  END IF;

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
