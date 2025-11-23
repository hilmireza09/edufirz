-- Helper function to avoid recursion (ensure it exists and is updated)
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = _class_id
    AND teacher_id = auth.uid()
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "class_students_select_policy" ON public.class_students;

-- Recreate with the function
CREATE POLICY "class_students_select_policy" ON public.class_students
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
  OR public.is_teacher_of_class(class_id)
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
