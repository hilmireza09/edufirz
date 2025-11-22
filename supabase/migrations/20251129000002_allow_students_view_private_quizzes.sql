-- Allow students to view quizzes assigned to their classes, even if private
CREATE POLICY "Students can view assigned quizzes"
  ON public.quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_assignments ca
      JOIN public.class_students cs ON ca.class_id = cs.class_id
      WHERE ca.quiz_id = quizzes.id
      AND cs.student_id = auth.uid()
      AND ca.status = 'active'
    )
  );
