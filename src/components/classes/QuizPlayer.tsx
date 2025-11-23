import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuizTimer } from '@/hooks/useQuizTimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, ArrowLeft, AlertCircle, Clock } from 'lucide-react';

type Question = {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'checkbox' | 'true_false' | 'essay' | 'fill_in_blank' | 'multiple_answers';
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
  const [timeLimit, setTimeLimit] = useState<number | null>(null);

  // Handle quiz submission (must be defined before useQuizTimer)
  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (!attempt || !quizId) return;
    
    // Confirm submission only if manual
    if (!isAutoSubmit) {
      if (!window.confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
        return;
      }
    } else {
      toast.info('Time expired! Auto-submitting quiz...');
    }

    setSubmitting(true);
    try {
      // Use server-side scoring function
      const { data, error } = await supabase
        .rpc('submit_quiz_attempt', {
          p_attempt_id: attempt.id,
          p_answers: answers as unknown as Record<string, unknown>
        }) as { data: { success: boolean; score: number; max_score: number; error?: string } | null; error: Error | null };

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to submit quiz');
      }

      const totalScore = data.score;
      const maxScore = data.max_score;

      // Also update assignment_submissions if needed (for class quizzes)
      if (assignmentId && classId) {
        const { data: existingSub } = await supabase
          .from('assignment_submissions')
          .select('id')
          .eq('assignment_id', assignmentId)
          .eq('student_id', user.id)
          .maybeSingle();

        if (!existingSub) {
          await supabase.from('assignment_submissions').insert({
            assignment_id: assignmentId,
            student_id: user.id,
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
      }

      toast.success(`Quiz submitted! Score: ${totalScore}/${maxScore}`);
      
      // Navigate to review page
      navigate(`/quizzes/${quizId}/review/${attempt.id}`);
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit quiz';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [attempt, quizId, answers, navigate, assignmentId, classId, user]);

  // Quiz timer hook
  const {
    timeRemaining,
    isActive: isTimerActive,
    hasStarted: hasTimerStarted,
    isExpired: isTimerExpired,
    formattedTime,
    startTimer
  } = useQuizTimer({
    attemptId: attempt?.id || null,
    timeLimitMinutes: timeLimit,
    onTimeExpired: () => handleSubmit(true),
    enabled: !!attempt && !attempt.completed_at && !!timeLimit
  });

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
        .select('quiz_id, quiz:quizzes(title, attempts_allowed, time_limit)')
        .eq('id', assignmentId)
        .single();

      if (assignError) throw assignError;
      if (!assignment.quiz_id) {
        toast.error('No quiz attached to this assignment');
        navigate(`/classes/${classId}/classwork`);
        return;
      }

      const quizData = assignment.quiz as unknown as { title: string; attempts_allowed: number | null; time_limit: number | null };

      setQuizId(assignment.quiz_id);
      setQuizTitle(quizData?.title || 'Quiz');
      setAttemptsAllowed(quizData?.attempts_allowed);
      setTimeLimit(quizData?.time_limit);

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
        const limit = quizData?.attempts_allowed;
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
          setAttempt(newAttempt as unknown as QuizAttempt);
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
      setQuestions((questionsData as Question[]) || []);

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

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
  }

  const isCompleted = !!attempt?.completed_at;
  const canAnswer = !isCompleted && hasTimerStarted;

  // Show timer start screen if timer exists but hasn't started
  const showTimerStartScreen = timeLimit && timeLimit > 0 && !hasTimerStarted && !isCompleted;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" onClick={() => navigate(`/classes/${classId}/classwork`)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classwork
      </Button>

      <Card className="border-primary/20 bg-card/80 backdrop-blur-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl text-primary">{quizTitle}</CardTitle>
            <div className="flex items-center gap-2">
              {attemptsAllowed !== null && (
                <Badge variant="outline" className="ml-2">
                  Attempt {attempt?.attempt_number || (attemptsCount + (isCompleted ? 0 : 1))} of {attemptsAllowed}
                </Badge>
              )}
              {timeLimit && timeLimit > 0 && hasTimerStarted && !isCompleted && (
                <Badge 
                  variant={timeRemaining < 300 ? "destructive" : "secondary"} 
                  className="flex items-center gap-1 text-lg px-3 py-1"
                >
                  <Clock className="h-4 w-4" />
                  {formattedTime}
                </Badge>
              )}
            </div>
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

      {/* Timer Start Screen */}
      {showTimerStartScreen && (
        <Card className="border-primary/20 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-6">
                <Clock className="h-16 w-16 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Ready to Start?</h3>
              <p className="text-muted-foreground">
                This quiz has a time limit of <strong>{timeLimit} minutes</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Once you click "Start Quiz", the timer will begin and cannot be paused.
                The quiz questions will appear after you start the timer.
              </p>
            </div>
            <Button
              onClick={startTimer}
              size="lg"
              className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-lg px-8"
            >
              <Clock className="mr-2 h-5 w-5" />
              Start Quiz Timer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Questions - Blurred until timer starts */}
      <div className={`space-y-6 transition-all duration-500 ${!canAnswer && !isCompleted ? 'blur-md pointer-events-none select-none' : ''}`}>
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
                    value={(answers[q.id] as string) || ''}
                    onValueChange={(value) => handleAnswerChange(q.id, value)}
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

                {(q.question_type === 'checkbox' || q.question_type === 'multiple_answers') && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => {
                      const optionText = typeof opt === 'string' ? opt : String(opt);
                      const isChecked = (answers[q.id] || []).includes(optionText);
                      return (
                        <div key={i} className="flex items-center space-x-2 p-2 rounded hover:bg-accent/50">
                          <Checkbox 
                            id={`${q.id}-${i}`} 
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (isCompleted) return;
                              const currentAnswers = Array.isArray(answers[q.id]) ? answers[q.id] as string[] : [];
                              let newAnswers;
                              if (checked) {
                                newAnswers = [...currentAnswers, optionText];
                                } else {
                                  newAnswers = currentAnswers.filter((a: string) => a !== optionText);
                                }
                              handleAnswerChange(q.id, newAnswers);
                            }}
                            disabled={isCompleted}
                          />
                          <Label htmlFor={`${q.id}-${i}`} className="flex-1 cursor-pointer">{optionText}</Label>
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.question_type === 'true_false' && (
                  <RadioGroup 
                    value={(answers[q.id] as string) || ''} 
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
                    value={(answers[q.id] as string) || ''}
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
            onClick={() => handleSubmit(false)} 
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