-- Create a security definer function to check if a user is the teacher of a class
-- This avoids infinite recursion in RLS policies where class_students checks classes and classes checks class_students
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

-- Update the policy on class_students to use the function
DROP POLICY IF EXISTS "Teachers can manage class enrollments" ON public.class_students;

CREATE POLICY "Teachers can manage class enrollments"
  ON public.class_students FOR ALL
  USING (
    public.is_teacher_of_class(class_id) OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
