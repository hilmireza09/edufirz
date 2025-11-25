-- Fix mutable search_path security issue in join_class_by_code function
-- This is critical because the function is SECURITY DEFINER

-- Replace the function with explicit search_path and schema-qualified references
CREATE OR REPLACE FUNCTION public.join_class_by_code(code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  target_class_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current authenticated user ID
  current_user_id := auth.uid();
  
  -- Find the class by join code (schema-qualified)
  SELECT id INTO target_class_id
  FROM public.classes
  WHERE join_code = code;
  
  IF target_class_id IS NULL THEN
    RAISE EXCEPTION 'Invalid class code';
  END IF;
  
  -- Check if already joined (schema-qualified)
  IF EXISTS (
    SELECT 1 
    FROM public.class_students 
    WHERE class_id = target_class_id 
    AND student_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Already joined this class';
  END IF;
  
  -- Insert into class_students (schema-qualified)
  INSERT INTO public.class_students (class_id, student_id)
  VALUES (target_class_id, current_user_id);
  
  RETURN target_class_id;
END;
$$;

-- Add comment explaining the security measures
COMMENT ON FUNCTION public.join_class_by_code(TEXT) IS 
'Allows students to join a class using a join code. 
Uses SECURITY DEFINER with explicit search_path and schema-qualified references for security.';
