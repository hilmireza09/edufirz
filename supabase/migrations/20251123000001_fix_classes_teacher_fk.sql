-- Fix classes teacher_id foreign key to reference profiles instead of auth.users
-- This allows PostgREST to join classes with profiles

ALTER TABLE public.classes
  DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;

ALTER TABLE public.classes
  ADD CONSTRAINT classes_teacher_id_fkey
  FOREIGN KEY (teacher_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Fix class_students student_id foreign key to reference profiles instead of auth.users
ALTER TABLE public.class_students
  DROP CONSTRAINT IF EXISTS class_students_student_id_fkey;

ALTER TABLE public.class_students
  ADD CONSTRAINT class_students_student_id_fkey
  FOREIGN KEY (student_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;
