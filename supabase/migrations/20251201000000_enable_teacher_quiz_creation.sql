-- Enable RLS on quizzes if not already
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Quizzes are viewable by everyone" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes are viewable by authenticated users" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes are editable by creators" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes are deletable by creators" ON public.quizzes;
DROP POLICY IF EXISTS "Admins can do everything on quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teachers can view their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teachers can insert quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teachers can update their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teachers can delete their own quizzes" ON public.quizzes;

-- Create new policies for Quizzes

-- SELECT:
-- 1. Public quizzes are viewable by everyone (authenticated)
-- 2. Creators can view their own quizzes
-- 3. Admins can view all quizzes
-- 4. Students/Teachers can view quizzes assigned to their classes (via assignments)
CREATE POLICY "quizzes_select_policy" ON public.quizzes
FOR SELECT
TO authenticated
USING (
  is_public = true 
  OR creator_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR id IN (
    SELECT quiz_id FROM class_assignments 
    WHERE class_id IN (
      SELECT class_id FROM class_students WHERE student_id = auth.uid()
    )
  )
);

-- INSERT:
-- Admins and Teachers can insert quizzes
CREATE POLICY "quizzes_insert_policy" ON public.quizzes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'teacher')
  )
);

-- UPDATE:
-- Admins can update all
-- Teachers can update ONLY their own quizzes
CREATE POLICY "quizzes_update_policy" ON public.quizzes
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR (
    creator_id = auth.uid() 
    AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'teacher')
  )
);

-- DELETE:
-- Admins can delete all
-- Teachers can delete ONLY their own quizzes
CREATE POLICY "quizzes_delete_policy" ON public.quizzes
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR (
    creator_id = auth.uid() 
    AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'teacher')
  )
);


-- Update Quiz Questions Policies
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.quiz_questions;
DROP POLICY IF EXISTS "Questions are editable by quiz creators" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admins can do everything on questions" ON public.quiz_questions;

-- SELECT:
-- If you can see the quiz, you can see the questions (simplified for performance, relying on app logic + quiz visibility)
-- But strictly: users should only see questions for quizzes they have access to.
-- Since RLS recursion is tricky, we'll replicate the logic or trust the join.
-- For now, let's allow viewing if the user has access to the quiz.
CREATE POLICY "quiz_questions_select_policy" ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
    AND (
      q.is_public = true 
      OR q.creator_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
      OR q.id IN (
        SELECT quiz_id FROM class_assignments 
        WHERE class_id IN (
          SELECT class_id FROM class_students WHERE student_id = auth.uid()
        )
      )
    )
  )
);

-- INSERT/UPDATE/DELETE:
-- Admins can manage all
-- Teachers can manage questions for their own quizzes
CREATE POLICY "quiz_questions_modify_policy" ON public.quiz_questions
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
    AND q.creator_id = auth.uid()
    AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'teacher')
  )
);

-- Ensure class_students allows teachers to join
-- (join_class_by_code is SECURITY DEFINER, but for direct inserts/selects)
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;

-- Helper function to avoid recursion
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

-- Drop existing if needed (names might vary, so we use IF EXISTS)
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can view enrollments for their classes" ON public.class_students;

-- SELECT:
-- Users can see their own enrollments
-- Teachers can see enrollments for classes they teach
-- Admins can see all
CREATE POLICY "class_students_select_policy" ON public.class_students
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
  OR public.is_teacher_of_class(class_id)
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- INSERT:
-- Users can insert themselves (joining) - usually handled by RPC, but if we allow direct:
CREATE POLICY "class_students_insert_policy" ON public.class_students
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
);

