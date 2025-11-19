-- Drop the constraint if it exists
ALTER TABLE public.class_assignments DROP CONSTRAINT IF EXISTS class_assignments_status_check;

-- Update any existing rows that might have invalid status (just in case)
UPDATE public.class_assignments 
SET status = 'active' 
WHERE status NOT IN ('active', 'inactive');

-- Add the constraint back with the correct definition
ALTER TABLE public.class_assignments 
ADD CONSTRAINT class_assignments_status_check 
CHECK (status IN ('active', 'inactive'));

-- Ensure default is active
ALTER TABLE public.class_assignments 
ALTER COLUMN status SET DEFAULT 'active';
