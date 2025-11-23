-- Create a helper function to check user roles securely
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = _role
  );
$$;

-- Update quizzes insert policy to use the function
DROP POLICY IF EXISTS "quizzes_insert_policy" ON public.quizzes;

CREATE POLICY "quizzes_insert_policy" ON public.quizzes
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('admin') OR 
  (public.has_role('teacher') AND creator_id = auth.uid())
);

-- Update quizzes update policy
DROP POLICY IF EXISTS "quizzes_update_policy" ON public.quizzes;

CREATE POLICY "quizzes_update_policy" ON public.quizzes
FOR UPDATE
TO authenticated
USING (
  public.has_role('admin') OR 
  (public.has_role('teacher') AND creator_id = auth.uid())
);

-- Update quizzes delete policy
DROP POLICY IF EXISTS "quizzes_delete_policy" ON public.quizzes;

CREATE POLICY "quizzes_delete_policy" ON public.quizzes
FOR DELETE
TO authenticated
USING (
  public.has_role('admin') OR 
  (public.has_role('teacher') AND creator_id = auth.uid())
);

-- Update quiz_questions modify policy
DROP POLICY IF EXISTS "quiz_questions_modify_policy" ON public.quiz_questions;

CREATE POLICY "quiz_questions_modify_policy" ON public.quiz_questions
FOR ALL
TO authenticated
USING (
  public.has_role('admin') OR 
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
    AND q.creator_id = auth.uid()
    AND public.has_role('teacher')
  )
);

-- Ensure quizzes select policy is also robust
DROP POLICY IF EXISTS "quizzes_select_policy" ON public.quizzes;

CREATE POLICY "quizzes_select_policy" ON public.quizzes
FOR SELECT
TO authenticated
USING (
  is_public = true 
  OR creator_id = auth.uid() 
  OR public.has_role('admin')
  OR id IN (
    SELECT quiz_id FROM class_assignments 
    WHERE class_id IN (
      SELECT class_id FROM class_students WHERE student_id = auth.uid()
    )
  )
);
