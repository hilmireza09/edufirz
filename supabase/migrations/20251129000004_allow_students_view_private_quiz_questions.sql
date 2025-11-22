-- Update policy to allow viewing questions for assigned private quizzes
DROP POLICY "Users can view questions from published quizzes" ON public.quiz_questions;

CREATE POLICY "Users can view questions from accessible quizzes"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND (
        quizzes.status = 'published' 
        OR quizzes.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR EXISTS (
          SELECT 1 FROM public.class_assignments ca
          JOIN public.class_students cs ON ca.class_id = cs.class_id
          WHERE ca.quiz_id = quizzes.id
          AND cs.student_id = auth.uid()
          AND ca.status = 'active'
        )
      )
    )
  );
