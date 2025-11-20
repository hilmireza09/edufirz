import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Download, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

type StudentScore = {
  id: string; // attempt id
  score: number;
  completed_at: string;
  user_id: string;
  student: {
    full_name: string;
    email: string;
  };
};

const AssignmentScores = () => {
  const { id: classId, assignmentId } = useParams<{ id: string; assignmentId: string }>();
  const navigate = useNavigate();
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchScores();
  }, [assignmentId]);

  const fetchScores = async () => {
    try {
      // 1. Get Assignment details
      const { data: assignment } = await supabase
        .from('class_assignments')
        .select('title, quiz_id')
        .eq('id', assignmentId)
        .single();
      
      if (assignment) {
        setAssignmentTitle(assignment.title);
        
        if (assignment.quiz_id) {
          // 2. Get attempts for this quiz
          // Note: In a real app, we should filter by students IN THIS CLASS to avoid showing attempts from other classes if the quiz is reused.
          // For now, we'll assume quiz_attempts are relevant.
          // Better approach: Join with class_students to filter.
          
          const { data: attempts, error } = await supabase
            .from('quiz_attempts')
            .select(`
              id,
              score,
              completed_at,
              user_id,
              student:profiles!quiz_attempts_user_id_fkey(full_name, email)
            `)
            .eq('quiz_id', assignment.quiz_id)
            .not('completed_at', 'is', null)
            .order('score', { ascending: false });

          if (error) throw error;
          
          // Deduplicate by user_id to show only the best score per student
          const uniqueAttempts = new Map();
          (attempts || []).forEach((a: any) => {
            if (!uniqueAttempts.has(a.user_id)) {
              uniqueAttempts.set(a.user_id, a);
            }
          });
          
          // Transform data to match type
          const formattedScores: StudentScore[] = Array.from(uniqueAttempts.values()).map((a: any) => ({
            id: a.id,
            score: a.score,
            completed_at: a.completed_at,
            user_id: a.user_id,
            student: {
              full_name: a.student?.full_name || 'Unknown',
              email: a.student?.email || ''
            }
          }));
          
          setScores(formattedScores);
        }
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredScores = scores.filter(s => 
    s.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/classes/${classId}/classwork`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{assignmentTitle} - Scores</h1>
          <p className="text-muted-foreground">{scores.length} submissions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Student Results</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search students..." 
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">Loading scores...</TableCell>
                </TableRow>
              ) : filteredScores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No submissions found</TableCell>
                </TableRow>
              ) : (
                filteredScores.map((score) => (
                  <TableRow key={score.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{score.student.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{score.student.full_name}</div>
                        <div className="text-xs text-muted-foreground">{score.student.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(score.completed_at), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {score.score}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentScores;