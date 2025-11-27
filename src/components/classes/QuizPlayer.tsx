import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

/**
 * QuizPlayer wrapper for Classwork assignments
 * This component fetches the quiz_id from the assignment and redirects to the unified QuizTake component
 * This ensures consistent UI and logic across all quiz-taking flows
 */
const QuizPlayer = () => {
  const { id: classId, assignmentId } = useParams<{ id: string; assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignmentQuiz = async () => {
      if (!assignmentId || !user) return;

      try {
        // Fetch the assignment to get the quiz_id
        const { data: assignment, error } = await supabase
          .from('class_assignments')
          .select('quiz_id, title, class_id')
          .eq('id', assignmentId)
          .single();

        if (error) throw error;

        if (!assignment?.quiz_id) {
          toast.error('No quiz associated with this assignment');
          navigate(`/classes/${classId}`);
          return;
        }

        // Store assignment context in sessionStorage for post-submission handling
        sessionStorage.setItem('quiz_assignment_context', JSON.stringify({
          assignmentId,
          classId,
          assignmentTitle: assignment.title
        }));

        // Redirect to the unified QuizTake page
        navigate(`/quizzes/${assignment.quiz_id}/take`, { replace: true });

      } catch (error) {
        console.error('Error fetching assignment:', error);
        toast.error('Failed to load quiz');
        navigate(`/classes/${classId}`);
      }
    };

    fetchAssignmentQuiz();
  }, [assignmentId, user, navigate, classId]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default QuizPlayer;
