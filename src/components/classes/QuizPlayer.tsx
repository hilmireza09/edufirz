import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, ArrowLeft, AlertCircle } from 'lucide-react';

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
  attempt_number?: number;
};

const QuizPlayer = () => {
  const { id: classId, assignmentId } = useParams<{ id: string; assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  
  const [attemptsAllowed, setAttemptsAllowed] = useState<number | null>(null);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);

  const fetchQuizData = useCallback(async () => {
    try {
      if (!user?.id || !assignmentId || !classId) return;

      // 0. Verify student enrollment in the class
      const { data: enrollment, error: enrollError } = await supabase
        .from('class_students')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (enrollError) throw enrollError;

      if (!enrollment) {
        toast.error('Access denied. You are not enrolled in this class.');
        navigate('/classes');
        return;
      }

      // 1. Get Assignment details to find quiz_id
      const { data: assignment, error: assignError } = await supabase
        .from('class_assignments')
        .select('quiz_id, quiz:quizzes(title, attempts_allowed)')
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
      setAttemptsAllowed(assignment.quiz?.attempts_allowed);

      // 2. Check for existing attempts
      const { data: existingAttempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', assignment.quiz_id)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (attemptsError) throw attemptsError;
      
      const attempts = existingAttempts || [];
      const completedAttempts = attempts.filter(a => a.completed_at);
      setAttemptsCount(completedAttempts.length);

      // Check for an active (incomplete) attempt
      const activeAttempt = attempts.find(a => !a.completed_at);

      if (activeAttempt) {
        setAttempt(activeAttempt);
        setAnswers(activeAttempt.answers || {});
        setMaxAttemptsReached(false);
      } else {
        // Check limits
        const limit = assignment.quiz?.attempts_allowed;
        const completedCount = completedAttempts.length;
        
        if (limit !== null && completedCount >= limit) {
          setMaxAttemptsReached(true);
          if (attempts.length > 0) {
            setAttempt(attempts[0]);
            setAnswers(attempts[0].answers || {});
          }
        } else {
          // Start new attempt
          const { data: newAttempt, error: createError } = await supabase
            .from('quiz_attempts')
            .insert({
              quiz_id: assignment.quiz_id,
              user_id: user.id,
              started_at: new Date().toISOString(),
              answers: {},
              attempt_number: completedCount + 1,
              completed_at: null // Explicitly set to null
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating attempt:', createError);
            throw createError;
          }
          setAttempt(newAttempt);
          setAnswers({});
          setMaxAttemptsReached(false);
        }
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
  }, [assignmentId, user, classId, navigate]);

  useEffect(() => {
    if (user && assignmentId) {
      fetchQuizData();
    }
  }, [assignmentId, user, fetchQuizData]);

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
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
      // Use server-side scoring via RPC
      const { data, error } = await supabase
        .rpc('submit_quiz_attempt', {
          p_attempt_id: attempt.id,
          p_answers: answers
        });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to submit quiz');
      }

      const totalScore = data.score;
      const maxScore = data.max_score;

      // Also update assignment_submissions if needed
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

      toast.success(`Quiz submitted! Score: ${totalScore}/${maxScore}`);
      
      // Redirect to review page
      navigate(`/quizzes/${quizId}/review/${attempt.id}`);
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error(error.message || 'Failed to submit quiz');
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
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl text-primary">{quizTitle}</CardTitle>
            {attemptsAllowed !== null && (
              <Badge variant="outline" className="ml-2">
                Attempt {attempt?.attempt_number || (attemptsCount + (isCompleted ? 0 : 1))} of {attemptsAllowed}
              </Badge>
            )}
          </div>

          {maxAttemptsReached && (
            <div className="flex items-center gap-2 text-amber-600 mt-2 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Maximum attempts reached. Showing your latest attempt.</span>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 text-green-500 mt-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Completed • Score: {attempt?.score}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/quizzes/${quizId}/review/${attempt?.id}`)}
                className="ml-auto"
              >
                Review
              </Button>
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
                <span className="text-sm text-muted-foreground">{q.points ?? 1} pts</span>
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

                {q.question_type === 'checkbox' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => {
                      const isChecked = (answers[q.id] || []).includes(opt);
                      return (
                        <div key={i} className="flex items-center space-x-2 p-2 rounded hover:bg-accent/50">
                          <Checkbox 
                            id={`${q.id}-${i}`} 
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (isCompleted) return;
                              const currentAnswers = answers[q.id] || [];
                              let newAnswers;
                              if (checked) {
                                newAnswers = [...currentAnswers, opt];
                              } else {
                                newAnswers = currentAnswers.filter((a: string) => a !== opt);
                              }
                              handleAnswerChange(q.id, newAnswers);
                            }}
                            disabled={isCompleted}
                          />
                          <Label htmlFor={`${q.id}-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                        </div>
                      );
                    })}
                  </div>
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