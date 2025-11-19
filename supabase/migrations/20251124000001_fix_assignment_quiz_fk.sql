-- Ensure the foreign key relationship exists between class_assignments and quizzes
DO $$ 
BEGIN
  -- Check if the constraint exists, if not add it
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'class_assignments' 
    AND constraint_name = 'class_assignments_quiz_id_fkey'
  ) THEN
    -- It might be named differently or missing, so let's try to add it with a standard name
    -- First, try to drop any existing FK on quiz_id just in case it has a weird name we can't guess easily
    -- (This part is tricky without knowing the name, but we can skip dropping and just add the named one)
    
    ALTER TABLE public.class_assignments
    ADD CONSTRAINT class_assignments_quiz_id_fkey
    FOREIGN KEY (quiz_id)
    REFERENCES public.quizzes(id)
    ON DELETE SET NULL;
  END IF;
END $$;
