import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { BookOpen, CreditCard, Users, LogOut, MessageSquare, Settings, Home, Calendar, FileText, Search, ChevronDown, User, Plus, Edit, Trash, Clock, Tag, CheckCircle, XCircle, GraduationCap, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card as UICard, CardContent } from '@/components/ui/card';
import { QuestionEditor, QuizQuestion as QuestionEditorType } from '@/components/QuestionEditor';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

type QuizQuestion = QuestionEditorType & {
  id?: string;
  correct_answers?: string[];
};

type Quiz = {
  id?: string;
  title: string;
  description: string | null;
  status: string; // 'draft' | 'published'
  is_public: boolean | null;
  difficulty: string | null;
  due_date: string | null;
  attempts_allowed: number | null;
  time_limit: number | null;
  category: string | null;
  creator_id: string;
  quiz_questions?: QuizQuestion[];
};

type Mode = 'list' | 'edit' | 'attempt';

const Quizzes = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('student');
  const [loadingRole, setLoadingRole] = useState(true);
  const [mode, setMode] = useState<Mode>('list');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [questionDrafts, setQuestionDrafts] = useState<QuizQuestion[]>([]);
  const originalQuestionIdsRef = useRef<string[]>([]);

  // Attempt states per quiz
  type AttemptState = { idx: number; selected: string | null; score: number; startTs: number | null; answersMap: Record<number, string> };
  const [attemptStates, setAttemptStates] = useState<Record<string, AttemptState>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [quizzesPerPage] = useState(6);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<{ id: string; title: string } | null>(null);

  /**
   * Fetches the current user's role for RBAC UI.
   */
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return;
      try {
        // Get user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          setUserRole('student'); // Default to student if no roles found
        } else {
          // Check if user has admin or teacher role
          const hasAdmin = rolesData?.some(r => r.role === 'admin');
          const hasTeacher = rolesData?.some(r => r.role === 'teacher');
          
          if (hasAdmin) {
            setUserRole('admin');
          } else if (hasTeacher) {
            setUserRole('teacher');
          } else {
            setUserRole('student');
          }
        }
      } catch (err) {
        console.error('Error in fetchRole:', err);
        setUserRole('student');
      }
      setLoadingRole(false);
    };
    fetchRole();
  }, [user]);

  /**
   * Loads quizzes according to role with soft-delete filtering.
   */
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user || loadingRole) return;
      try {
        let query = supabase
          .from('quizzes')
          .select(`
            id, title, description, status, is_public, difficulty, due_date, attempts_allowed, time_limit, category, creator_id,
            quiz_questions ( id, question_text, options, correct_answer, explanation, points, order_index, question_type )
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (userRole === 'student') {
          query = query.eq('status', 'published');
        } else if (userRole === 'teacher') {
          query = query.eq('creator_id', user.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quizzesData: Quiz[] = (data || []).map((q: any) => ({
          ...q,
          quiz_questions: Array.isArray(q.quiz_questions) 
            ? q.quiz_questions
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((qq: any) => ({
                  ...qq,
                  question: qq.question_text || qq.question,
                  type: qq.question_type || qq.type || 'multiple_choice',
                }))
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)) 
            : [],
        }));
        setQuizzes(quizzesData);
        const catSet = new Set<string>();
        quizzesData.forEach((q) => { if (q.category) catSet.add(q.category); });
        setAvailableCategories(Array.from(catSet));
        setAttemptStates((prev) => {
          const next = { ...prev };
          quizzesData.forEach((q) => {
            if (q.id && !next[q.id]) {
              next[q.id] = { idx: 0, selected: null, score: 0, startTs: Date.now(), answersMap: {} };
            }
          });
          return next;
        });
      } catch (err) {
        console.error('Error fetching quizzes:', err);
        toast.error('Failed to load quizzes');
      }
    };
    fetchQuizzes();
  }, [user, userRole, loadingRole]);

  /**
   * Enters edit mode for a quiz (new or existing).
   */
  const handleCreateQuiz = () => {
    if (!user) return;
    const draft: Quiz = {
      title: 'New Quiz',
      description: '',
      status: 'draft',
      is_public: false,
      difficulty: 'easy',
      due_date: null,
      attempts_allowed: 1,
      time_limit: null,
      category: null,
      creator_id: user.id,
      quiz_questions: [],
    };
    setEditingQuiz(draft);
    setQuestionDrafts([]);
    originalQuestionIdsRef.current = [];
    setMode('edit');
    // Update URL for navigation
    navigate('/quizzes?mode=create');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here - could search across quizzes, questions, etc.
    console.log('Searching for:', searchQuery);
  };

  const getAttempt = (quizId: string): AttemptState => attemptStates[quizId] || { idx: 0, selected: null, score: 0, startTs: Date.now(), answersMap: {} };
  const setAttempt = (quizId: string, updater: (s: AttemptState) => AttemptState) => {
    setAttemptStates((prev) => ({ ...prev, [quizId]: updater(getAttempt(quizId)) }));
  };

  /**
   * Opens a quiz in the editor for CRUD operations.
   */
  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    const drafts = (quiz.quiz_questions || []).map((qq) => ({ ...qq }));
    setQuestionDrafts(drafts);
    originalQuestionIdsRef.current = drafts
      .map((d) => d.id)
      .filter((id): id is string => Boolean(id));
    setMode('edit');
    // Update URL for navigation
    navigate(`/quizzes?mode=edit&id=${quiz.id}`);
  };

  /**
   * Opens delete confirmation dialog for a quiz.
   */
  const handleDeleteQuiz = (quizId: string) => {
    if (!user) return;
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;
    const canDelete = userRole === 'admin' || quiz.creator_id === user.id;
    if (!canDelete) {
      toast.error('You do not have permission to delete this quiz');
      return;
    }
    setQuizToDelete({ id: quizId, title: quiz.title });
    setDeleteDialogOpen(true);
  };

  /**
   * Confirms and executes the quiz deletion.
   */
  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', quizToDelete.id);
      if (error) throw error;
      setQuizzes(quizzes.filter((q) => q.id !== quizToDelete.id));
      toast.success('Quiz deleted successfully');
    } catch (err) {
      console.error('Error deleting quiz:', err);
      toast.error('Failed to delete quiz');
    } finally {
      setQuizToDelete(null);
    }
  };

  /**
   * Adds a question to the editor state.
   */
  const addQuestion = () => {
    setQuestionDrafts([
      ...questionDrafts,
      {
        question: '',
        options: ['', '', '', ''],
        correct_answer: '', // Works for all question types
        correct_answers: [],
        explanation: '',
        points: 1,
        order_index: questionDrafts.length,
        type: 'multiple_choice',
      },
    ]);
  };

  /**
   * Removes a question at index.
   */
  const removeQuestion = (index: number) => {
    const next = questionDrafts.filter((_, i) => i !== index).map((q, i) => ({ ...q, order_index: i }));
    setQuestionDrafts(next);
  };

  /**
   * Updates a field of a question at index.
   */
  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number | string[] | boolean | undefined) => {
    const next = [...questionDrafts];
    next[index] = { ...next[index], [field]: value };
    setQuestionDrafts(next);
  };

  /**
   * Saves quiz meta and granular question CRUD.
   */
  const handleSaveQuiz = async () => {
    if (!editingQuiz || !user) return;
    try {
      // Ensure difficulty has a valid value (never null or empty)
      const validDifficulty = editingQuiz.difficulty && ['easy', 'medium', 'hard'].includes(editingQuiz.difficulty) 
        ? editingQuiz.difficulty 
        : 'easy';

      const quizData = {
        title: editingQuiz.title,
        description: editingQuiz.description,
        status: editingQuiz.status,
        is_public: editingQuiz.is_public,
        difficulty: validDifficulty,
        due_date: editingQuiz.due_date,
        attempts_allowed: editingQuiz.attempts_allowed,
        time_limit: editingQuiz.time_limit,
        category: editingQuiz.category,
      };

      let savedQuiz: Quiz;
      if (editingQuiz.id) {
        const { data, error } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', editingQuiz.id)
          .select()
          .single();
        if (error) throw error;
        savedQuiz = data as unknown as Quiz;
      } else {
        const { data, error } = await supabase
          .from('quizzes')
          .insert([{ ...quizData, creator_id: editingQuiz.creator_id }])
          .select()
          .single();
        if (error) throw error;
        savedQuiz = data as unknown as Quiz;
      }

      const draftsWithOrder = questionDrafts.map((q, i) => ({ ...q, order_index: i }));
      const currentIds = draftsWithOrder.map((q) => q.id).filter((id): id is string => Boolean(id));
      const originalIds = originalQuestionIdsRef.current;

      const toDeleteIds = originalIds.filter((id) => !currentIds.includes(id));
      const toInsert = draftsWithOrder.filter((q) => !q.id);
      const toUpdate = draftsWithOrder.filter((q) => q.id);

      if (toDeleteIds.length > 0) {
        const { error: delError } = await supabase
          .from('quiz_questions')
          .delete()
          .in('id', toDeleteIds);
        if (delError) throw delError;
      }

      if (toUpdate.length > 0) {
        const updatePayload = toUpdate.map((q) => ({
          id: q.id,
          quiz_id: savedQuiz.id,
          question_text: q.question,
          question_type: q.type,
          options: q.options,
          correct_answer: q.correct_answer,
          correct_answers: q.correct_answers, // Support for checkbox questions
          explanation: q.explanation,
          points: q.points,
          order_index: q.order_index,
        }));
        const { error: upsertError } = await supabase
          .from('quiz_questions')
          .upsert(updatePayload, { onConflict: 'id' });
        if (upsertError) throw upsertError;
      }

      let insertedQuestions: QuizQuestion[] = [];
      if (toInsert.length > 0) {
        const insertPayload = toInsert.map((q) => ({
          quiz_id: savedQuiz.id,
          question_text: q.question,
          question_type: q.type,
          options: q.options,
          correct_answer: q.correct_answer,
          correct_answers: q.correct_answers, // Support for checkbox questions
          explanation: q.explanation,
          points: q.points,
          order_index: q.order_index,
        }));
        const { data: insertData, error: insertError } = await supabase
          .from('quiz_questions')
          .insert(insertPayload)
          .select();
        if (insertError) throw insertError;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        insertedQuestions = (insertData || []).map((q: any) => ({
          ...q,
          question: q.question_text,
          type: q.question_type,
        })) as QuizQuestion[];
      }

      toast.success('Quiz saved');
      const finalQuestions = [
        ...toUpdate.map((q) => ({ id: q.id as string, ...q })),
        ...insertedQuestions.map((q) => ({ id: q.id, question: q.question, options: q.options, correct_answer: q.correct_answer, explanation: q.explanation, points: q.points, order_index: q.order_index, type: q.type })),
      ].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

      const saved: Quiz = { ...savedQuiz, quiz_questions: finalQuestions };
      const updatedQuizzes = quizzes.some((q) => q.id === saved.id)
        ? quizzes.map((q) => (q.id === saved.id ? saved : q))
        : [saved, ...quizzes];
      setQuizzes(updatedQuizzes);
      setEditingQuiz(null);
      setQuestionDrafts([]);
      originalQuestionIdsRef.current = [];
      setMode('list');
      // Navigate back to list view
      navigate('/quizzes');
    } catch (error) {
      console.error('Error saving quiz:', error);
      const err = error as { code?: string; message?: string };
      if (err.code === '23514' || err.message?.includes('quizzes_difficulty_check')) {
        toast.error('Database Error: Please run the migration to fix the difficulty constraint.');
      } else {
        toast.error('Failed to save quiz');
      }
    }
  };

  const submitForQuiz = (quizId: string) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;
    const questions = quiz.quiz_questions || [];
    const st = getAttempt(quizId);
    const q = questions[st.idx];
    if (!q || st.selected === null) return;
    const correct = st.selected === q.correct_answer;
    setAttempt(quizId, (s) => ({
      ...s,
      score: correct ? s.score + (q.points ?? 1) : s.score,
      answersMap: { ...s.answersMap, [s.idx]: s.selected as string },
    }));
    setTimeout(() => {
      setAttempt(quizId, (s) => ({ ...s, selected: null, idx: Math.min(s.idx + 1, questions.length) }));
    }, 400);
  };

  const restartAttempt = (quizId: string) => {
    setAttempt(quizId, () => ({ idx: 0, selected: null, score: 0, startTs: Date.now(), answersMap: {} }));
  };

  const finishAttempt = async (quizId: string) => {
    if (!user) return;
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;
    const questions = quiz.quiz_questions || [];
    const st = getAttempt(quizId);
    const max = questions.reduce((acc, q) => acc + (q.points ?? 1), 0);
    const timeTaken = st.startTs ? Math.round((Date.now() - st.startTs) / 1000) : null;
    const answers = questions.map((q, i) => ({ index: i, selected: st.answersMap[i] ?? null, correct: (st.answersMap[i] ?? null) === q.correct_answer }));
    try {
      const { error } = await supabase
        .from('quiz_attempts')
        .insert([{ quiz_id: quiz.id as string, user_id: user.id, answers, score: st.score, max_score: max, time_taken: timeTaken, completed_at: new Date().toISOString() }]);
      if (error) throw error;
      toast.success('Attempt saved');
    } catch (err) {
      console.error('Error saving attempt:', err);
      toast.error('Failed to save attempt');
    }
  };

  const filteredQuizzes = useMemo(() => {
    const norm = (s: string) => s.toLowerCase();
    return quizzes.filter((q) => {
      const matchesSearch = searchQuery.trim() === '' || norm(q.title).includes(norm(searchQuery)) || (q.description ? norm(q.description).includes(norm(searchQuery)) : false);
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
      const matchesCategory = categoryFilter === '' || q.category === categoryFilter;
      const matchesDueFrom = dueDateFrom === '' || (q.due_date && q.due_date.substring(0,10) >= dueDateFrom);
      const matchesDueTo = dueDateTo === '' || (q.due_date && q.due_date.substring(0,10) <= dueDateTo);
      return matchesSearch && matchesStatus && matchesDifficulty && matchesCategory && matchesDueFrom && matchesDueTo;
    });
  }, [quizzes, searchQuery, statusFilter, difficultyFilter, categoryFilter, dueDateFrom, dueDateTo]);

  if (loadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        <Header />

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-background to-muted">
          <div className="space-y-6">
            {mode === 'list' && (
              <div className="glass-card p-6 md:p-8 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold">Quizzes</h1>
                  </div>
                  {(userRole === 'teacher' || userRole === 'admin') && (
                    <Button onClick={handleCreateQuiz} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Quiz
                    </Button>
                  )}
                </div>

                <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-sm mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search quizzes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div>
                      <select className="w-full px-3 py-2 rounded-md bg-background border border-border" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "draft" | "published")}>
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                    <div>
                      <select className="w-full px-3 py-2 rounded-md bg-background border border-border" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value as "all" | "easy" | "medium" | "hard")}>
                        <option value="all">All Difficulty</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <select className="w-full px-3 py-2 rounded-md bg-background border border-border" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">All Categories</option>
                        {availableCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Due From</label>
                      <Input type="date" value={dueDateFrom} onChange={(e) => setDueDateFrom(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Due To</label>
                      <Input type="date" value={dueDateTo} onChange={(e) => setDueDateTo(e.target.value)} />
                    </div>
                  </div>
                </div>

                {filteredQuizzes.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">No Quizzes</h2>
                    <p className="text-muted-foreground">Create your first quiz to get started</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredQuizzes.slice((currentPage - 1) * quizzesPerPage, currentPage * quizzesPerPage).map((quiz) => (
                        <div key={quiz.id} className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-sm p-6 cursor-pointer hover:shadow-md transition-all duration-300" onClick={() => { setSelectedQuiz(quiz); setMode('attempt'); }}>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold truncate">{quiz.title}</h3>
                            <div className="flex gap-1">
                              {(userRole === 'admin' || quiz.creator_id === user?.id) && (
                                <>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditQuiz(quiz); }}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      handleDeleteQuiz(quiz.id as string); 
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{quiz.description || 'No description'}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                            {quiz.difficulty && (
                              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">{quiz.difficulty}</span>
                            )}
                            {quiz.due_date && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/10 text-secondary">
                                <Clock className="h-3 w-3" /> {new Date(quiz.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {quiz.category && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 text-accent-foreground">
                                <Tag className="h-3 w-3" /> {quiz.category}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {(quiz.quiz_questions?.length || 0)} questions
                          </div>
                        </div>
                      ))}
                    </div>
                    {Math.ceil(filteredQuizzes.length / quizzesPerPage) > 1 && (
                      <div className="flex items-center justify-center mt-8 gap-2">
                        <Button 
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.ceil(filteredQuizzes.length / quizzesPerPage) }, (_, i) => i + 1).map(page => (
                            <Button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              className={`w-8 h-8 p-0 ${currentPage === page ? 'bg-primary text-primary-foreground' : ''}`}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button 
                          onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredQuizzes.length / quizzesPerPage), p + 1))} 
                          disabled={currentPage === Math.ceil(filteredQuizzes.length / quizzesPerPage)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {mode === 'edit' && editingQuiz && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-6 border border-border/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">
                        {editingQuiz.id ? '✏️ Edit Quiz' : '✨ Create New Quiz'}
                      </h2>
                      <p className="text-muted-foreground">
                        Build engaging assessments with multiple question types
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => { 
                          setEditingQuiz(null); 
                          setMode('list'); 
                          navigate('/quizzes');
                        }}
                        className="border-border hover:bg-accent"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveQuiz} 
                        className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Quiz
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quiz Details Card */}
                <UICard className="bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Quiz Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium mb-2 block">Quiz Title</label>
                        <Input 
                          value={editingQuiz.title} 
                          onChange={(e) => setEditingQuiz({ ...(editingQuiz as Quiz), title: e.target.value })} 
                          placeholder="Enter an engaging quiz title..."
                          className="text-lg h-12 bg-background/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium mb-2 block">Description</label>
                        <Textarea 
                          value={editingQuiz.description || ''} 
                          onChange={(e) => setEditingQuiz({ ...(editingQuiz as Quiz), description: e.target.value })} 
                          rows={3} 
                          placeholder="Provide a brief description of this quiz..."
                          className="resize-none bg-background/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Status</label>
                        <select
                          className="w-full h-10 px-3 py-2 rounded-md bg-background/50 border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                          value={editingQuiz.status}
                          onChange={(e) => setEditingQuiz({ ...(editingQuiz as Quiz), status: e.target.value })}
                        >
                          <option value="draft">📝 Draft</option>
                          <option value="published">✅ Published</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Difficulty</label>
                        <select
                          className="w-full h-10 px-3 py-2 rounded-md bg-background/50 border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                          value={editingQuiz.difficulty || 'easy'}
                          onChange={(e) => setEditingQuiz({ ...(editingQuiz as Quiz), difficulty: e.target.value })}
                        >
                          <option value="easy">🟢 Easy</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="hard">🔴 Hard</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Category</label>
                        <Input 
                          value={editingQuiz.category || ''} 
                          onChange={(e) => setEditingQuiz({ ...(editingQuiz as Quiz), category: e.target.value })} 
                          placeholder="e.g., Mathematics, Science..."
                          className="bg-background/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Attempts Allowed</label>
                        <Input 
                          type="number" 
                          value={editingQuiz.attempts_allowed ?? 1} 
                          onChange={(e) => setEditingQuiz({ ...(editingQuiz as Quiz), attempts_allowed: Number(e.target.value) })} 
                          min={1}
                          className="bg-background/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Time Limit (minutes)</label>
                        <Input 
                          type="number" 
                          value={editingQuiz.time_limit ?? 0} 
                          onChange={(e) => setEditingQuiz({ ...(editingQuiz as Quiz), time_limit: Number(e.target.value) })} 
                          min={0}
                          placeholder="0 = No limit"
                          className="bg-background/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Due Date</label>
                        <Input 
                          type="date" 
                          value={editingQuiz.due_date ? editingQuiz.due_date.substring(0,10) : ''} 
                          onChange={(e) => setEditingQuiz({ ...(editingQuiz as Quiz), due_date: e.target.value })} 
                          className="bg-background/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </UICard>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Questions
                    </h3>
                    <Button onClick={addQuestion} className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                      <Plus className="h-4 w-4" />
                      Add Question
                    </Button>
                  </div>

                  {questionDrafts.length === 0 && (
                    <div className="text-center py-12 bg-card/50 rounded-2xl border-2 border-dashed border-border">
                      <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                      <p className="text-muted-foreground mb-4">Get started by adding your first question</p>
                      <Button onClick={addQuestion} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Question
                      </Button>
                    </div>
                  )}

                  {questionDrafts.map((question, index) => (
                    <QuestionEditor
                      key={index}
                      question={question}
                      index={index}
                      onUpdate={updateQuestion}
                      onRemove={removeQuestion}
                    />
                  ))}
                </div>
              </div>
            )}

            {mode === 'attempt' && selectedQuiz && (
          <div className="glass-card p-6 md:p-8 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{selectedQuiz.title}</h1>
                {selectedQuiz.description && (
                  <p className="text-muted-foreground mt-1">{selectedQuiz.description}</p>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Score: {getAttempt(selectedQuiz.id as string).score} / {(selectedQuiz.quiz_questions || []).reduce((acc, q) => acc + (q.points ?? 1), 0)}</div>
            </div>

            {(() => {
              const st = getAttempt(selectedQuiz.id as string);
              const questions = selectedQuiz.quiz_questions || [];
              const total = questions.length;
              const q = questions[st.idx];
              const progress = total > 0 ? Math.round((st.idx / total) * 100) : 0;
              return (
                <>
                  <div className="w-full h-2 bg-border/60 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  {st.idx < total && q ? (
                    <div className="space-y-6">
                      <p className="text-lg md:text-xl font-medium">{q.question}</p>
                      <div className="grid gap-3">
                        {(q.options || (q.type === 'true_false' ? ['True', 'False'] : [])).map((opt, i) => {
                          const isSelected = st.selected === opt;
                          const isCorrect = st.selected !== null && opt === q.correct_answer;
                          const isWrong = st.selected !== null && opt === st.selected && opt !== q.correct_answer;
                          return (
                            <button
                              key={i}
                              onClick={() => setAttempt(selectedQuiz.id as string, (s) => ({ ...s, selected: opt }))}
                              className={`text-left p-4 rounded-xl transition-all border hover:translate-y-[-1px] ${
                                isCorrect
                                  ? 'bg-green-500/15 border-green-500/40'
                                  : isWrong
                                  ? 'bg-red-500/15 border-red-500/40'
                                  : isSelected
                                  ? 'glass-card border-white/30'
                                  : 'glass-card border-white/20 hover:border-white/40'
                              }`}
                            >
                              <span className="inline-flex items-center gap-2">
                                {isCorrect && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {isWrong && <XCircle className="h-4 w-4 text-red-500" />}
                                {opt}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between gap-3">
                        <Button variant="outline" className="glass-card" onClick={() => setAttempt(selectedQuiz.id as string, (s) => ({ ...s, selected: null }))}>Clear</Button>
                        <div className="flex gap-3">
                          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90" onClick={() => submitForQuiz(selectedQuiz.id as string)} disabled={st.selected === null}>Submit</Button>
                          {st.idx + 1 === total && (
                            <Button variant="outline" onClick={() => finishAttempt(selectedQuiz.id as string)}>Finish</Button>
                          )}
                        </div>
                      </div>
                      {st.selected !== null && q.explanation && (
                        <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-border">
                          <p className="text-sm text-muted-foreground">Explanation: {q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-2xl font-semibold mb-2">Great job!</p>
                      <p className="text-muted-foreground mb-6">You scored {getAttempt(selectedQuiz.id as string).score} out of {(selectedQuiz.quiz_questions || []).reduce((acc, q) => acc + (q.points ?? 1), 0)}.</p>
                      <div className="flex justify-center gap-3">
                        <Button onClick={() => restartAttempt(selectedQuiz.id as string)} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">Try Again</Button>
                        <Button variant="outline" onClick={() => { setMode('list'); setSelectedQuiz(null); }}>Back to Quizzes</Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setQuizToDelete(null);
        }}
        onConfirm={confirmDeleteQuiz}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? All questions and student progress will be permanently removed."
        itemName={quizToDelete?.title}
        confirmText="Delete Quiz"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Quizzes;
