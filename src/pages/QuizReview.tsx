import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  question_type: 'multiple_choice' | 'checkbox' | 'true_false' | 'essay' | 'fill_in_blank' | 'multiple_answers';
  options: string[] | any[] | null;
  points: number;
  order_index: number;
  correct_answer: string | null;
  correct_answers: string[] | null;
  explanation: string | null;
};

type QuizAttempt = {
  id: string;
  score: number | null;
  completed_at: string | null;
  answers: Record<string, any>;
  attempt_number?: number;
};

const QuizReview = () => {
  const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [maxScore, setMaxScore] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id || !quizId || !attemptId) return;

        // 1. Get Quiz details
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .select('title')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;
        setQuizTitle(quiz.title);

        // 2. Get the specific attempt
        const { data: attemptData, error: attemptError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('id', attemptId)
          .eq('user_id', user.id)
          .single();

        if (attemptError) throw attemptError;
        setAttempt(attemptData);

        // 3. Fetch Questions with correct answers
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('id, question_text, question_type, options, points, order_index, correct_answer, correct_answers, explanation')
          .eq('quiz_id', quizId)
          .order('order_index');

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);

        // Calculate max score
        const totalPoints = (questionsData || []).reduce((sum, q) => sum + (q.points || 1), 0);
        setMaxScore(totalPoints);

      } catch (error) {
        console.error('Error loading review:', error);
        toast.error('Failed to load review');
        navigate('/quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quizId, attemptId, user, navigate]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
  }

  if (!attempt) {
    return <div className="flex justify-center py-12">Attempt not found</div>;
  }

  const isCorrect = (question: Question) => {
    const userAnswer = attempt.answers[question.id];
    
    if (question.question_type === 'checkbox' || question.question_type === 'multiple_answers') {
      const correct = question.correct_answers || [];
      const user = userAnswer || [];
      if (!Array.isArray(user)) return false;
      
      // Check for partial correctness (at least one correct answer selected and no incorrect ones, or some correct ones)
      // But for the "Correct" badge, we usually want 100%.
      // Let's stick to strict equality for the main "Correct" badge, 
      // but we can add a "Partial" badge if needed.
      // For now, let's keep it simple: Correct if all correct answers are selected and no incorrect ones.
      // The server handles partial scoring.
      return user.length === correct.length && user.every(a => correct.includes(a));
    }

    if (question.question_type === 'fill_in_blank') {
      if (!Array.isArray(userAnswer)) return false;
      const blankDefs = (question.options as any[]) || [];
      // If number of answers doesn't match blanks, it's incorrect (or partially correct, but we mark as incorrect for now)
      // Actually, let's check if every blank is correct
      return blankDefs.every((def, index) => {
        const userVal = (userAnswer[index] || '').trim();
        const accepted = def.accepted_answers || [];
        if (def.case_sensitive) {
          return accepted.includes(userVal);
        }
        return accepted.some((a: string) => a.toLowerCase() === userVal.toLowerCase());
      });
    }

    if (question.question_type === 'true_false') {
      // Case insensitive comparison for True/False
      return (userAnswer || '').toString().toLowerCase() === (question.correct_answer || '').toLowerCase();
    }
    
    if (question.question_type === 'essay') {
      // Essay evaluation: normalize and compare against grading rubric/key points
      if (!question.correct_answer || question.correct_answer.trim().length === 0) {
        // If no rubric is defined, essays are considered manually graded (always correct for now)
        return true;
      }
      
      // Normalize both answers: trim, lowercase, clean whitespace
      const userAnswerNormalized = (userAnswer || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
      const correctAnswerNormalized = question.correct_answer.toLowerCase().trim().replace(/\s+/g, ' ');
      
      return userAnswerNormalized === correctAnswerNormalized;
    }

    return userAnswer === question.correct_answer;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Button variant="ghost" onClick={() => navigate('/quizzes')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quizzes
        </Button>

        <Card className="border-primary/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {quizTitle}
                </CardTitle>
                <p className="text-muted-foreground mt-1">Reviewing Attempt #{attempt.attempt_number}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {attempt.score} / {maxScore}
                </div>
                <p className="text-sm text-muted-foreground">Total Score</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {questions.map((q, index) => {
            const userAnswer = attempt.answers[q.id];
            const correct = isCorrect(q);

            return (
              <Card key={q.id} className={`overflow-hidden border shadow-lg ${
                correct ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'
              }`}>
                <CardHeader className={`pb-3 border-b ${
                  correct ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-lg">Question {index + 1}</h3>
                      {correct ? 
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Correct</Badge> : 
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Incorrect</Badge>
                      }
                    </div>
                    <span className="text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">
                      {q.points ?? 1} pts
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {q.question_type !== 'fill_in_blank' && (
                    <p className="text-lg text-foreground/90 leading-relaxed">{q.question_text}</p>
                  )}
                  
                  <div className="mt-4 pointer-events-none opacity-100">
                    {q.question_type === 'multiple_choice' && q.options && (
                      <RadioGroup value={userAnswer || ''} className="space-y-3">
                        {q.options.map((opt, i) => {
                          const isSelected = userAnswer === opt;
                          const isCorrectAnswer = opt === q.correct_answer;
                          
                          let className = "flex items-center space-x-3 p-3 rounded-xl border transition-all ";
                          if (isCorrectAnswer) {
                            className += "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-800";
                          } else if (isSelected && !isCorrectAnswer) {
                            className += "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-800";
                          } else {
                            className += "border-transparent opacity-60";
                          }

                          return (
                            <div key={i} className={className}>
                              <RadioGroupItem value={opt} id={`${q.id}-${i}`} checked={isSelected} />
                              <Label htmlFor={`${q.id}-${i}`} className="flex-1 font-normal text-base">{opt}</Label>
                              {isCorrectAnswer && <CheckCircle className="h-5 w-5 text-green-600" />}
                              {isSelected && !isCorrectAnswer && <XCircle className="h-5 w-5 text-red-600" />}
                            </div>
                          );
                        })}
                      </RadioGroup>
                    )}

                    {(q.question_type === 'checkbox' || q.question_type === 'multiple_answers') && q.options && (
                      <div className="space-y-3">
                        {q.options.map((opt, i) => {
                          const optionText = typeof opt === 'string' ? opt : String(opt);
                          const isChecked = (userAnswer || []).includes(optionText);
                          const isCorrectOption = (q.correct_answers || []).includes(optionText);
                          
                          let className = "flex items-center space-x-3 p-3 rounded-xl border transition-all ";
                          if (isCorrectOption) {
                            className += "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-800";
                          } else if (isChecked && !isCorrectOption) {
                            className += "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-800";
                          } else {
                            className += "border-transparent opacity-60";
                          }

                          return (
                            <div key={i} className={className}>
                              <Checkbox id={`${q.id}-${i}`} checked={isChecked} />
                              <Label htmlFor={`${q.id}-${i}`} className="flex-1 font-normal text-base">{optionText}</Label>
                              {isCorrectOption && <CheckCircle className="h-5 w-5 text-green-600" />}
                              {isChecked && !isCorrectOption && <XCircle className="h-5 w-5 text-red-600" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.question_type === 'true_false' && (
                      <RadioGroup value={userAnswer || ''} className="grid grid-cols-2 gap-4">
                        {['true', 'false'].map((val) => {
                          const isSelected = userAnswer === val;
                          const isCorrectAnswer = val.toLowerCase() === (q.correct_answer || '').toLowerCase();
                          
                          let className = "flex items-center space-x-3 p-4 rounded-xl border transition-all ";
                          if (isCorrectAnswer) {
                            className += "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-800";
                          } else if (isSelected && !isCorrectAnswer) {
                            className += "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-800";
                          } else {
                            className += "border-border/50 opacity-60";
                          }

                          return (
                            <div key={val} className={className}>
                              <RadioGroupItem value={val} id={`${q.id}-${val}`} checked={isSelected} />
                              <Label htmlFor={`${q.id}-${val}`} className="font-medium capitalize">{val}</Label>
                              {isCorrectAnswer && <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />}
                              {isSelected && !isCorrectAnswer && <XCircle className="h-5 w-5 text-red-600 ml-auto" />}
                            </div>
                          );
                        })}
                      </RadioGroup>
                    )}

                    {q.question_type === 'essay' && (
                      <div className="space-y-2">
                        <Textarea 
                          value={userAnswer || ''}
                          readOnly
                          className="bg-background/50 min-h-[100px] text-base"
                        />
                        
                        {q.correct_answer && q.correct_answer.trim().length > 0 && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Expected Answer/Rubric:</label>
                            <div className={`p-3 rounded-lg border ${
                              correct 
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                            }`}>
                              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{q.correct_answer}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {q.question_type === 'fill_in_blank' && (
                      <div className="leading-loose text-lg font-medium">
                        {(() => {
                          const parts = q.question_text.split('[blank]');
                          const userAnswers = (userAnswer as string[]) || [];
                          
                          // Handle potential stringified JSON in options (if column is text[])
                          let blankDefs = (q.options as any[]) || [];
                          if (blankDefs.length > 0 && typeof blankDefs[0] === 'string') {
                            try {
                              blankDefs = blankDefs.map(d => typeof d === 'string' ? JSON.parse(d) : d);
                            } catch (e) {
                              console.error('Failed to parse options', e);
                            }
                          }
                          
                          return parts.map((part, i) => {
                            if (i >= parts.length - 1) return <span key={i}>{part}</span>;

                            const userVal = userAnswers[i] || '';
                            const def = blankDefs.find((d: any) => d.index === i);
                            const accepted = def?.accepted_answers || [];
                            const isBlankCorrect = def?.case_sensitive 
                              ? accepted.includes(userVal.trim())
                              : accepted.some((a: string) => a.toLowerCase() === userVal.trim().toLowerCase());

                            return (
                              <span key={i}>
                                {part}
                                <span className="inline-flex flex-col mx-2 align-middle">
                                  <span className={`px-2 py-1 rounded border-b-2 ${
                                    isBlankCorrect 
                                      ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                      : 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  }`}>
                                    {userVal || '(empty)'}
                                  </span>
                                  {!isBlankCorrect && (
                                    <span className="text-xs text-green-600 dark:text-green-400 font-bold mt-1">
                                      {accepted && accepted.length > 0 ? accepted[0] : 'No answer defined'}
                                    </span>
                                  )}
                                </span>
                              </span>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {q.explanation && !correct && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-700 dark:text-blue-400">Explanation</p>
                          <p className="text-blue-600/90 dark:text-blue-400/90 mt-1">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizReview;
