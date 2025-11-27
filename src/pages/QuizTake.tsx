import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuizTimer } from '@/hooks/useQuizTimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, ArrowLeft, AlertCircle, Clock } from 'lucide-react';

type Question = {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'checkbox' | 'true_false' | 'essay' | 'fill_in_blank' | 'multiple_answers';
  options: string[] | any[] | null;
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

const QuizTake = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);

  const [attemptsAllowed, setAttemptsAllowed] = useState<number | null>(null);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);

  // Normalize answers to ensure valid JSON structure
  const normalizeAnswersForSubmission = useCallback((rawAnswers: Record<string, string | string[]>) => {
    const normalized: Record<string, unknown> = {};
    
    Object.entries(rawAnswers).forEach(([questionId, answer]) => {
      // Skip null, undefined, or empty values
      if (answer === null || answer === undefined || answer === '') {
        return;
      }

      // Ensure arrays are properly formatted
      if (Array.isArray(answer)) {
        // Filter out empty values and ensure strings
        normalized[questionId] = answer.filter(v => v !== null && v !== undefined && v !== '').map(String);
      } else {
        // Convert primitive to string
        normalized[questionId] = String(answer);
      }
    });

    return normalized;
  }, []);

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
      // Normalize answers to valid JSON structure
      const normalizedAnswers = normalizeAnswersForSubmission(answers);

      // Use direct fetch with properly formatted answers to avoid RPC serialization issues
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://qvwnmpgkaugmbtvxlvlv.supabase.co";
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d25tcGdrYXVnbWJ0dnhsdmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTA1MTQsImV4cCI6MjA2NzYyNjUxNH0.BMrQMQhj2HimcAA59yD8Vy1ddJzg69GKdyyn-KRGTjo";
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const requestBody = {
        p_attempt_id: attempt.id,
        p_answers: normalizedAnswers
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/submit_quiz_attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken || supabaseKey}`,
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('RPC error:', result);
        throw new Error(result.message || result.error || 'Failed to submit quiz');
      }

      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to submit quiz');
      }

      const totalScore = result.score;
      const maxScore = result.max_score;

      // Check if this quiz was taken through a class assignment
      const assignmentContext = sessionStorage.getItem('quiz_assignment_context');
      if (assignmentContext) {
        try {
          const { assignmentId, classId } = JSON.parse(assignmentContext);
          
          // Update or create assignment submission
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
          
          // Clear the assignment context after successful submission
          sessionStorage.removeItem('quiz_assignment_context');
        } catch (err) {
          console.error('Error updating assignment submission:', err);
          // Don't fail the entire submission if assignment update fails
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
  }, [attempt, quizId, answers, navigate, normalizeAnswersForSubmission]);

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

  // Fetch quiz data
  const fetchQuizData = useCallback(async () => {
    try {
      if (!user?.id || !quizId) return;

      // 1. Get Quiz details
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('title, creator_id, attempts_allowed, time_limit')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      setQuizTitle(quiz.title);
      setCreatorId(quiz.creator_id);
      setAttemptsAllowed(quiz.attempts_allowed);
      setTimeLimit(quiz.time_limit);

      // 2. Get all attempts for this user
      const { data: existingAttempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (attemptsError) throw attemptsError;
      
      const attempts = existingAttempts || [];
      const completedAttempts = attempts.filter(a => a.completed_at);
      setAttemptsCount(completedAttempts.length);

      // 3. Check for an active (incomplete) attempt
      const activeAttempt = attempts.find(a => !a.completed_at);

      if (activeAttempt) {
        // Resume existing active attempt
        setAttempt(activeAttempt);
        setAnswers(activeAttempt.answers || {});
        setMaxAttemptsReached(false);
      } else {
        // No active attempt - check if we can create a new one
        const limit = quiz.attempts_allowed;
        const completedCount = completedAttempts.length;
        
        if (limit !== null && completedCount >= limit) {
          // Max attempts reached
          setMaxAttemptsReached(true);
          if (attempts.length > 0) {
            // Show the most recent attempt in read-only mode
            setAttempt(attempts[0]);
            setAnswers(attempts[0].answers || {});
          }
        } else {
          // Can start a new attempt
          const { data: newAttempt, error: createError } = await supabase
            .from('quiz_attempts')
            .insert({
              quiz_id: quizId,
              user_id: user.id,
              started_at: new Date().toISOString(),
              answers: {},
              attempt_number: completedCount + 1,
              completed_at: null // Explicitly set to null to ensure it's active
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
      // SECURITY: Explicitly exclude correct_answer and explanation to prevent answer discovery
      // through browser DevTools, Network tab, or HTML inspection. These fields are only
      // loaded server-side during grading via the submit_quiz_attempt RPC function.
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('id, question_text, question_type, options, points, order_index')
        .eq('quiz_id', quizId)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions((questionsData as Question[]) || []);

    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, [quizId, user]);  useEffect(() => {
    if (user && quizId) {
      // Reset state before fetching new data
      setLoading(true);
      setAttempt(null);
      setAnswers({});
      setQuestions([]);
      setQuizTitle('');
      setMaxAttemptsReached(false);
      
      fetchQuizData();
    }
  }, [quizId, user, fetchQuizData]);

  const handleResetAttempt = async () => {
    if (!window.confirm('Are you sure you want to reset ALL attempts? This will delete all your scores and answers.')) {
      return;
    }
    
    try {
      setLoading(true);

      const { error } = await supabase
        .from('quiz_attempts')
        .delete()
        .eq('quiz_id', quizId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      // Clear local state
      setAttempt(null);
      setAnswers({});
      setMaxAttemptsReached(false);
      setAttemptsCount(0);
      
      toast.success('All attempts reset successfully');
      
      // Reload to create fresh attempt
      await fetchQuizData();
    } catch (error: any) {
      console.error('Error resetting attempt:', error);
      toast.error(error.message || 'Failed to reset attempts');
      setLoading(false);
    }
  };

  const handleStartNewAttempt = async () => {
    try {
      setLoading(true);
      
      // Force a clean fetch by resetting everything first
      setAttempt(null);
      setAnswers({});
      setQuestions([]);
      setMaxAttemptsReached(false);
      
      // Small delay to ensure state is clean
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch will create new attempt
      await fetchQuizData();
    } catch (error) {
      console.error('Error starting new attempt:', error);
      toast.error('Failed to start new attempt');
      setLoading(false);
    }
  };

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

  // Don't show anything if there's no attempt
  if (!attempt) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
  }

  const isCompleted = !!attempt?.completed_at;
  const canAnswer = !isCompleted && hasTimerStarted;

  // Show timer start screen if timer exists but hasn't started
  const showTimerStartScreen = timeLimit && timeLimit > 0 && !hasTimerStarted && !isCompleted;

  // Determine back navigation based on context
  const getBackPath = () => {
    const assignmentContext = sessionStorage.getItem('quiz_assignment_context');
    if (assignmentContext) {
      try {
        const { classId } = JSON.parse(assignmentContext);
        return `/classes/${classId}`;
      } catch (err) {
        // Fall through to default
      }
    }
    return '/quizzes';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Button variant="ghost" onClick={() => navigate(getBackPath())} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <Card className="border-primary/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {quizTitle}
              </CardTitle>
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

            {isCompleted && !maxAttemptsReached && (
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center gap-2 text-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-900/50">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Completed • Score: {attempt?.score}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/quizzes/${quizId}/review/${attempt?.id}`)}
                    className="ml-auto border-green-200 hover:bg-green-100 hover:text-green-700"
                  >
                    Review
                  </Button>
                  {user?.id === creatorId && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleResetAttempt}
                      className="ml-2 border-green-200 hover:bg-green-100 hover:text-green-700"
                    >
                      Reset (Creator)
                    </Button>
                  )}
                </div>

                <Button 
                  onClick={handleStartNewAttempt} 
                  className="w-full md:w-auto self-end bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-md"
                >
                  Start Next Attempt
                </Button>
              </div>
            )}

            {isCompleted && maxAttemptsReached && (
              <div className="flex items-center gap-2 text-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-900/50 mt-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Completed • Score: {attempt?.score}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/quizzes/${quizId}/review/${attempt?.id}`)}
                  className="ml-auto border-green-200 hover:bg-green-100 hover:text-green-700"
                >
                  Review
                </Button>
                {user?.id === creatorId && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetAttempt}
                    className="ml-2 border-green-200 hover:bg-green-100 hover:text-green-700"
                  >
                    Reset (Creator)
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Timer Start Screen */}
        {showTimerStartScreen && (
          <Card className="border-primary/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
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
            <Card key={q.id} className="overflow-hidden border-white/20 shadow-lg">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border/50">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg">Question {index + 1}</h3>
                  <span className="text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">
                    {q.points ?? 1} pts
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {q.question_type !== 'fill_in_blank' && (
                  <p className="text-lg text-foreground/90 leading-relaxed">{q.question_text}</p>
                )}
                
                <div className="mt-4">
                  {q.question_type === 'multiple_choice' && q.options && (
                    <RadioGroup 
                      value={(answers[q.id] as string) || ''}
                      onValueChange={(value) => handleAnswerChange(q.id, value)}
                      disabled={!canAnswer}
                      className="space-y-3"
                    >
                      {q.options.map((opt, i) => (
                        <div key={i} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                          answers[q.id] === opt 
                            ? 'bg-primary/5 border-primary/30 shadow-sm' 
                            : 'hover:bg-accent/50 border-transparent hover:border-border'
                        }`}>
                          <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                          <Label htmlFor={`${q.id}-${i}`} className="flex-1 cursor-pointer font-normal text-base">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {(q.question_type === 'checkbox' || q.question_type === 'multiple_answers') && q.options && (
                    <div className="space-y-3">
                      {q.options.map((opt, i) => {
                        // Handle both string and object formats for options
                        const optionText = typeof opt === 'string' ? opt : String(opt);
                        const isChecked = (answers[q.id] || []).includes(optionText);
                        return (
                          <div key={i} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-primary/5 border-primary/30 shadow-sm' 
                              : 'hover:bg-accent/50 border-transparent hover:border-border'
                          }`}>
                            <Checkbox 
                              id={`${q.id}-${i}`} 
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (!canAnswer) return;
                                const currentAnswers = Array.isArray(answers[q.id]) ? answers[q.id] as string[] : [];
                                let newAnswers;
                                if (checked) {
                                  newAnswers = [...currentAnswers, optionText];
                                } else {
                                  newAnswers = currentAnswers.filter((a: string) => a !== optionText);
                                }
                                handleAnswerChange(q.id, newAnswers);
                              }}
                              disabled={!canAnswer}
                            />
                            <Label htmlFor={`${q.id}-${i}`} className="flex-1 cursor-pointer font-normal text-base">{optionText}</Label>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.question_type === 'true_false' && (
                    <RadioGroup 
                      value={(answers[q.id] as string) || ''} 
                      onValueChange={(val) => handleAnswerChange(q.id, val)}
                      disabled={!canAnswer}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                        answers[q.id] === 'true'
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'hover:bg-accent/50 border-border/50'
                      }`}>
                        <RadioGroupItem value="true" id={`${q.id}-true`} />
                        <Label htmlFor={`${q.id}-true`} className="cursor-pointer font-medium">True</Label>
                      </div>
                      <div className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                        answers[q.id] === 'false'
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'hover:bg-accent/50 border-border/50'
                      }`}>
                        <RadioGroupItem value="false" id={`${q.id}-false`} />
                        <Label htmlFor={`${q.id}-false`} className="cursor-pointer font-medium">False</Label>
                      </div>
                    </RadioGroup>
                  )}

                  {q.question_type === 'essay' && (
                    <Textarea 
                      value={(answers[q.id] as string) || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      disabled={!canAnswer}
                      placeholder="Type your answer here..."
                      className="bg-background/50 min-h-[100px] text-base"
                    />
                  )}

                  {q.question_type === 'fill_in_blank' && (
                    <div className="leading-loose text-lg font-medium">
                      {(() => {
                        const parts = q.question_text.split('[blank]');
                        const currentAnswers = (answers[q.id] as string[]) || [];
                        
                        return parts.map((part, i) => (
                          <span key={i}>
                            {part}
                            {i < parts.length - 1 && (
                              <Input
                                type="text"
                                value={currentAnswers[i] || ''}
                                onChange={(e) => {
                                  if (!canAnswer) return;
                                  const newAnswers = [...currentAnswers];
                                  newAnswers[i] = e.target.value;
                                  handleAnswerChange(q.id, newAnswers);
                                }}
                                disabled={!canAnswer}
                                className="inline-block w-40 mx-2 h-8 text-center border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 focus:border-primary px-1 bg-transparent"
                                placeholder="Answer..."
                              />
                            )}
                          </span>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!isCompleted && (
          <div className="flex justify-end pt-6 pb-12">
            <Button 
              size="lg" 
              onClick={() => handleSubmit(false)} 
              disabled={submitting}
              className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 min-w-[200px] h-12 text-lg shadow-lg shadow-primary/25 rounded-xl"
            >
              {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
              Submit Quiz
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizTake;
