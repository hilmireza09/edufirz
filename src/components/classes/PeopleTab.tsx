import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

const PeopleTab = () => {
  const { id: classId } = useParams<{ id: string }>();
  const [students, setStudents] = useState<any[]>([]);
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId && classId !== 'undefined') {
      fetchPeople();
    }
  }, [classId]);

  const fetchPeople = async () => {
    try {
      // Fetch teacher
      const { data: classData } = await supabase
        .from('classes')
        .select('teacher:profiles!classes_teacher_id_fkey(full_name, email)')
        .eq('id', classId)
        .single();
      
      if (classData) setTeacher(classData.teacher);

      // Fetch students
      const { data: studentsData } = await supabase
        .from('class_students')
        .select('student:profiles!class_students_student_id_fkey(full_name, email)')
        .eq('class_id', classId);

      if (studentsData) {
        setStudents(studentsData.map((s: any) => s.student));
      }
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <section>
        <h2 className="text-2xl text-primary border-b border-primary/20 pb-4 mb-4">Teachers</h2>
        <div className="flex items-center gap-4 py-2">
          <Avatar>
            <AvatarFallback>{teacher?.full_name?.charAt(0) || 'T'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{teacher?.full_name}</div>
            <div className="text-xs text-muted-foreground">{teacher?.email}</div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between border-b border-primary/20 pb-4 mb-4">
          <h2 className="text-2xl text-primary">Students</h2>
          <span className="text-muted-foreground">{students.length} students</span>
        </div>
        {students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No students yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                <Avatar>
                  <AvatarFallback>{student.full_name?.charAt(0) || 'S'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-xs text-muted-foreground">{student.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PeopleTab;