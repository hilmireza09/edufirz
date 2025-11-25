-- Fix correct_answers for the third question (BC is correct)
UPDATE quiz_questions 
SET correct_answers = '["B", "C"]'::jsonb, correct_answer = 'B|||C'
WHERE id = '0d7254f8-1db9-4a93-a755-33e830524505';