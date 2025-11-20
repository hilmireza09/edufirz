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
  question_type: 'multiple_choice' | 'checkbox' | 'true_false' | 'essay' | 'fill_in_blank';
  options: string[] | null;
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
    
    if (question.question_type === 'checkbox') {
      const correct = question.correct_answers || [];
      const user = userAnswer || [];
      if (!Array.isArray(user)) return false;
      return user.length === correct.length && user.every(a => correct.includes(a));
    }
    
    if (question.question_type === 'essay') {
      // Essay questions might need manual grading, for now assume correct if not empty or handle differently
      // Or maybe we just don't show correct/incorrect for essay yet
      return true; 
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
            const isEssay = q.question_type === 'essay';

            return (
              <Card key={q.id} className={`overflow-hidden border shadow-lg ${
                isEssay ? 'border-white/20' :
                correct ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'
              }`}>
                <CardHeader className={`pb-3 border-b ${
                  isEssay ? 'bg-muted/30 border-border/50' :
                  correct ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-lg">Question {index + 1}</h3>
                      {!isEssay && (
                        correct ? 
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Correct</Badge> : 
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Incorrect</Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">
                      {q.points ?? 1} pts
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-lg text-foreground/90 leading-relaxed">{q.question_text}</p>
                  
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

                    {q.question_type === 'checkbox' && q.options && (
                      <div className="space-y-3">
                        {q.options.map((opt, i) => {
                          const isChecked = (userAnswer || []).includes(opt);
                          const isCorrectOption = (q.correct_answers || []).includes(opt);
                          
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
                              <Label htmlFor={`${q.id}-${i}`} className="flex-1 font-normal text-base">{opt}</Label>
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
                          const isCorrectAnswer = val === q.correct_answer;
                          
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

                    {(q.question_type === 'essay' || q.question_type === 'fill_in_blank') && (
                      <div className="space-y-2">
                        <Textarea 
                          value={userAnswer || ''}
                          readOnly
                          className="bg-background/50 min-h-[100px] text-base"
                        />
                        {q.question_type === 'fill_in_blank' && (
                          <div className="text-sm text-muted-foreground mt-2">
                            Correct Answer: <span className="font-medium text-green-600">{q.correct_answer}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {q.explanation && (
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
