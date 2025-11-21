-- Add explicit policy for admins to view all classes
-- This ensures admins can see all classes without needing to be enrolled or be the teacher

-- Drop existing policies to recreate them with proper admin access
DROP POLICY IF EXISTS "Teachers can manage their classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON public.classes;
DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;

-- Admins can view and manage all classes
CREATE POLICY "Admins can view all classes"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Teachers can manage their classes (and admins via the admin policy above)
CREATE POLICY "Teachers can manage their classes"
  ON public.classes FOR ALL
  USING (
    teacher_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Students can view classes they're enrolled in
CREATE POLICY "Students can view classes they're enrolled in"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_students
      WHERE class_students.class_id = classes.id
      AND class_students.student_id = auth.uid()
    )
  );

-- Ensure admins can see all class_students enrollments
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.class_students;

CREATE POLICY "Admins can view all enrollments"
  ON public.class_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Ensure admins can see all assignments
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.assignments;

CREATE POLICY "Admins can view all assignments"
  ON public.assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Ensure admins can see all announcements
DROP POLICY IF EXISTS "Admins can view all announcements" ON public.announcements;

CREATE POLICY "Admins can view all announcements"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
