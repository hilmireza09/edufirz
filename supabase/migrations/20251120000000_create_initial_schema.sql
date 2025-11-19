-- Create initial schema for quizzes and related tables

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_public BOOLEAN DEFAULT false,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  due_date TIMESTAMP WITH TIME ZONE,
  attempts_allowed INTEGER,
  time_limit INTEGER, -- in minutes
  category TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'checkbox', 'essay', 'fill_in_blank', 'true_false')),
  options JSONB, -- for multiple choice and checkbox
  correct_answer TEXT, -- for single answer types
  correct_answers JSONB, -- for checkbox (multiple correct)
  explanation TEXT, -- explanation/feedback for the answer
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create class_students table
CREATE TABLE IF NOT EXISTS public.class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Create class_assignments table
CREATE TABLE IF NOT EXISTS public.class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  max_points INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.class_assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submission_text TEXT,
  file_url TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
  grade INTEGER,
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Create class_announcements table
CREATE TABLE IF NOT EXISTS public.class_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
DROP POLICY IF EXISTS "Users can view published quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Creators can view their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Creators can insert their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Creators can update their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Creators can delete their own quizzes" ON public.quizzes;

CREATE POLICY "Users can view published quizzes"
  ON public.quizzes FOR SELECT
  USING (status = 'published' OR creator_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Creators can insert their own quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their own quizzes"
  ON public.quizzes FOR UPDATE
  USING (creator_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Creators can delete their own quizzes"
  ON public.quizzes FOR DELETE
  USING (creator_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for quiz_questions
DROP POLICY IF EXISTS "Users can view questions from published quizzes" ON public.quiz_questions;
DROP POLICY IF EXISTS "Creators can manage quiz questions" ON public.quiz_questions;

CREATE POLICY "Users can view questions from published quizzes"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND (quizzes.status = 'published' OR quizzes.creator_id = auth.uid())
    )
  );

CREATE POLICY "Creators can manage quiz questions"
  ON public.quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.creator_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for classes
DROP POLICY IF EXISTS "Teachers can manage their classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON public.classes;

CREATE POLICY "Teachers can manage their classes"
  ON public.classes FOR ALL
  USING (teacher_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Students can view classes they're enrolled in"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_students
      WHERE class_students.class_id = classes.id
      AND class_students.student_id = auth.uid()
    )
  );

-- RLS Policies for class_students
DROP POLICY IF EXISTS "Teachers can manage class enrollments" ON public.class_students;
DROP POLICY IF EXISTS "Students can view their enrollments" ON public.class_students;

CREATE POLICY "Teachers can manage class enrollments"
  ON public.class_students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_students.class_id
      AND classes.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Students can view their enrollments"
  ON public.class_students FOR SELECT
  USING (student_id = auth.uid());

-- RLS Policies for class_assignments
DROP POLICY IF EXISTS "Teachers can manage assignments" ON public.class_assignments;
DROP POLICY IF EXISTS "Students can view assignments" ON public.class_assignments;

CREATE POLICY "Teachers can manage assignments"
  ON public.class_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_assignments.class_id
      AND classes.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Students can view assignments"
  ON public.class_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_students
      WHERE class_students.class_id = class_assignments.class_id
      AND class_students.student_id = auth.uid()
    )
  );

-- RLS Policies for assignment_submissions
DROP POLICY IF EXISTS "Students can manage their submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Teachers can view and grade submissions" ON public.assignment_submissions;

CREATE POLICY "Students can manage their submissions"
  ON public.assignment_submissions FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view and grade submissions"
  ON public.assignment_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.class_assignments ca
      JOIN public.classes c ON c.id = ca.class_id
      WHERE ca.id = assignment_submissions.assignment_id
      AND c.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for class_announcements
DROP POLICY IF EXISTS "Teachers can manage announcements" ON public.class_announcements;
DROP POLICY IF EXISTS "Students can view announcements" ON public.class_announcements;

CREATE POLICY "Teachers can manage announcements"
  ON public.class_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_announcements.class_id
      AND classes.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Students can view announcements"
  ON public.class_announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_students
      WHERE class_students.class_id = class_announcements.class_id
      AND class_students.student_id = auth.uid()
    )
  );