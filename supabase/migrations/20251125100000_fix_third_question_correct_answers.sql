-- Fix correct_answers for the third question in the quiz
UPDATE quiz_questions 
SET correct_answers = '["A", "D"]'::jsonb, correct_answer = 'A|||D'
WHERE id = 'ba4a1b7d-e7a9-485e-b866-4e19de8ede61';