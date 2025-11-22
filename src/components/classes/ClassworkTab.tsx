import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Calendar, ChevronRight, FileText, CheckCircle, BarChart2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

type Assignment = {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  quiz_id: string | null;
  status: string;
  quiz?: {
    title: string;
  };
};

type Quiz = {
  id: string;
  title: string;
};

const ClassworkTab = () => {
  const { id: classId } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('student');
  
  // Create Assignment State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [teacherQuizzes, setTeacherQuizzes] = useState<Quiz[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Use profile from useAuth
  useEffect(() => {
    if (profile) {
      setUserRole(profile.role || 'student');
    }
  }, [profile]);

  const fetchAssignments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('class_assignments')
        .select(`
          *,
          quiz:quizzes(title)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (user && classId && classId !== 'undefined') {
      fetchAssignments();
    }
  }, [classId, user, fetchAssignments]);

  const fetchTeacherQuizzes = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('creator_id', user.id)
        .eq('status', 'private'); // Only private quizzes

      if (error) throw error;
      setTeacherQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const handleOpenCreate = () => {
    fetchTeacherQuizzes();
    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !selectedQuizId) {
      toast.error('Please provide a title and select a quiz');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('class_assignments')
        .insert({
          class_id: classId,
          title: newTitle,
          description: newDescription,
          quiz_id: selectedQuizId,
          due_date: dueDate ? new Date(dueDate).toISOString() : null
        });

      if (error) throw error;

      toast.success('Assignment created');
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
      setSelectedQuizId('');
      setDueDate('');
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = userRole === 'teacher' || userRole === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={handleOpenCreate} className="bg-gradient-to-r from-primary to-secondary">
            <Plus className="mr-2 h-4 w-4" /> Create Assignment
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading classwork...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-xl border border-border/50">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No assignments yet</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-all duration-300 bg-card/60 backdrop-blur-sm border-l-4 border-l-secondary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-foreground/90">{assignment.title}</CardTitle>
                    <CardDescription className="mt-1">{assignment.description}</CardDescription>
                  </div>
                  {assignment.due_date && (
                    <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      <Calendar className="mr-2 h-3 w-3" />
                      Due {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Quiz: {assignment.quiz?.title}</span>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 p-4 flex justify-end gap-3">
                {canManage ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/classes/${classId}/classwork/${assignment.id}/scores`)}
                  >
                    <BarChart2 className="mr-2 h-4 w-4" /> View Scores
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="bg-primary/90 hover:bg-primary"
                    onClick={() => navigate(`/classes/${classId}/classwork/${assignment.id}/quiz`)}
                  >
                    Start Quiz <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Create Assignment Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle>Create Classwork</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Assignment Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Instructions..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Quiz</label>
                <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a quiz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherQuizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassworkTab;