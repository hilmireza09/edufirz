import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

type Question = {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'checkbox' | 'true_false' | 'essay' | 'fill_in_blank';
  options: string[] | null;
  points: number;
  order_index: number;
};

type QuizAttempt = {
  id: string;
  score: number | null;
  completed_at: string | null;
  answers: Record<string, any>;
};

const QuizPlayer = () => {
  const { id: classId, assignmentId } = useParams<{ id: string; assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  useEffect(() => {
    if (user && assignmentId) {
      fetchQuizData();
    }
  }, [assignmentId, user]);

  const fetchQuizData = async () => {
    try {
      // 1. Get Assignment details to find quiz_id
      const { data: assignment, error: assignError } = await supabase
        .from('class_assignments')
        .select('quiz_id, quiz:quizzes(title)')
        .eq('id', assignmentId)
        .single();

      if (assignError) throw assignError;
      if (!assignment.quiz_id) {
        toast.error('No quiz attached to this assignment');
        navigate(`/classes/${classId}/classwork`);
        return;
      }

      setQuizId(assignment.quiz_id);
      setQuizTitle(assignment.quiz?.title || 'Quiz');

      // 2. Check for existing attempt
      const { data: existingAttempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', assignment.quiz_id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (attemptError) throw attemptError;
      
      if (existingAttempt) {
        setAttempt(existingAttempt);
        if (existingAttempt.answers) {
          setAnswers(existingAttempt.answers);
        }
      } else {
        // Start new attempt
        const { data: newAttempt, error: createError } = await supabase
          .from('quiz_attempts')
          .insert({
            quiz_id: assignment.quiz_id,
            user_id: user?.id,
            started_at: new Date().toISOString(),
            answers: {}
          })
          .select()
          .single();
        
        if (createError) throw createError;
        setAttempt(newAttempt);
      }

      // 3. Fetch Questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('id, question_text, question_type, options, points, order_index')
        .eq('quiz_id', assignment.quiz_id)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    if (attempt?.completed_at) return; // Prevent changes if submitted
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!attempt || !quizId) return;
    
    // Confirm submission
    if (!window.confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
      return;
    }

    setSubmitting(true);
    try {
      // Calculate score (simplified - ideally done on server or with secure answers)
      // For now, we'll fetch correct answers to calculate score client-side (NOT SECURE but functional for MVP)
      const { data: correctData } = await supabase
        .from('quiz_questions')
        .select('id, correct_answer, correct_answers, points')
        .eq('quiz_id', quizId);

      let totalScore = 0;
      let maxScore = 0;

      correctData?.forEach(q => {
        const userAnswer = answers[q.id];
        maxScore += q.points || 1;

        if (!userAnswer) return;

        if (q.correct_answer) {
          // Single answer check
          if (String(userAnswer).toLowerCase() === String(q.correct_answer).toLowerCase()) {
            totalScore += q.points || 1;
          }
        } else if (q.correct_answers) {
          // Multiple answer check (simplified exact match of arrays)
          // Implementation depends on how checkbox answers are stored
        }
      });

      // Update attempt
      const { error } = await supabase
        .from('quiz_attempts')
        .update({
          answers: answers,
          completed_at: new Date().toISOString(),
          score: totalScore
        })
        .eq('id', attempt.id);

      if (error) throw error;

      // Also update assignment_submissions if needed (optional, but good for redundancy)
      // Check if submission exists
      const { data: existingSub } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user?.id)
        .maybeSingle();

      if (!existingSub) {
        await supabase.from('assignment_submissions').insert({
          assignment_id: assignmentId,
          student_id: user?.id,
          status: 'submitted',
          grade: totalScore,
          submitted_at: new Date().toISOString()
        });
      } else {
        await supabase.from('assignment_submissions').update({
          status: 'submitted',
          grade: totalScore,
          submitted_at: new Date().toISOString()
        }).eq('id', existingSub.id);
      }

      toast.success('Quiz submitted successfully!');
      setAttempt(prev => prev ? { ...prev, completed_at: new Date().toISOString(), score: totalScore } : null);
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
  }

  const isCompleted = !!attempt?.completed_at;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" onClick={() => navigate(`/classes/${classId}/classwork`)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classwork
      </Button>

      <Card className="border-primary/20 bg-card/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">{quizTitle}</CardTitle>
          {isCompleted && (
            <div className="flex items-center gap-2 text-green-500 mt-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Completed • Score: {attempt?.score}</span>
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {questions.map((q, index) => (
          <Card key={q.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3">
              <div className="flex justify-between">
                <h3 className="font-medium text-lg">Question {index + 1}</h3>
                <span className="text-sm text-muted-foreground">{q.points} pts</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-foreground/90">{q.question_text}</p>
              
              <div className="mt-4">
                {q.question_type === 'multiple_choice' && q.options && (
                  <RadioGroup 
                    value={answers[q.id] || ''} 
                    onValueChange={(val) => handleAnswerChange(q.id, val)}
                    disabled={isCompleted}
                  >
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center space-x-2 p-2 rounded hover:bg-accent/50">
                        <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                        <Label htmlFor={`${q.id}-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {q.question_type === 'true_false' && (
                  <RadioGroup 
                    value={answers[q.id] || ''} 
                    onValueChange={(val) => handleAnswerChange(q.id, val)}
                    disabled={isCompleted}
                  >
                    <div className="flex items-center space-x-2 p-2">
                      <RadioGroupItem value="true" id={`${q.id}-true`} />
                      <Label htmlFor={`${q.id}-true`}>True</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2">
                      <RadioGroupItem value="false" id={`${q.id}-false`} />
                      <Label htmlFor={`${q.id}-false`}>False</Label>
                    </div>
                  </RadioGroup>
                )}

                {(q.question_type === 'essay' || q.question_type === 'fill_in_blank') && (
                  <Textarea 
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    disabled={isCompleted}
                    placeholder="Type your answer here..."
                    className="bg-background/50"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isCompleted && (
        <div className="flex justify-end pt-6">
          <Button 
            size="lg" 
            onClick={handleSubmit} 
            disabled={submitting}
            className="bg-gradient-to-r from-primary to-secondary min-w-[150px]"
          >
            {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
            Submit Quiz
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;