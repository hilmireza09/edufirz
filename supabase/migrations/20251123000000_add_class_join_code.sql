-- Add join_code to classes table
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- Generate random join codes for existing classes (if any)
UPDATE public.classes 
SET join_code = substring(md5(random()::text) from 1 for 6)
WHERE join_code IS NULL;

-- Make join_code NOT NULL after populating
ALTER TABLE public.classes ALTER COLUMN join_code SET NOT NULL;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_classes_join_code ON public.classes(join_code);

-- Function to join a class by code
CREATE OR REPLACE FUNCTION join_class_by_code(code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_class_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Find the class
  SELECT id INTO target_class_id
  FROM public.classes
  WHERE join_code = code;
  
  IF target_class_id IS NULL THEN
    RAISE EXCEPTION 'Invalid class code';
  END IF;
  
  -- Check if already joined
  IF EXISTS (SELECT 1 FROM public.class_students WHERE class_id = target_class_id AND student_id = current_user_id) THEN
    RAISE EXCEPTION 'Already joined this class';
  END IF;
  
  -- Insert into class_students
  INSERT INTO public.class_students (class_id, student_id)
  VALUES (target_class_id, current_user_id);
  
  RETURN target_class_id;
END;
$$;
