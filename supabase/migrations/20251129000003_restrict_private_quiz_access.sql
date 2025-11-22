-- Update policy to prevent teachers from seeing private quizzes of others
DROP POLICY "Users can view published quizzes" ON public.quizzes;

CREATE POLICY "Users can view published quizzes"
  ON public.quizzes FOR SELECT
  USING (
    status = 'published' 
    OR creator_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
