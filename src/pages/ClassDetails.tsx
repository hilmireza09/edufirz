import { useState, useEffect } from 'react';
import { useParams, useNavigate, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AnnouncementsTab from '@/components/classes/AnnouncementsTab';
import ClassworkTab from '@/components/classes/ClassworkTab';
import PeopleTab from '@/components/classes/PeopleTab';
import QuizPlayer from '@/components/classes/QuizPlayer';
import AssignmentScores from '@/components/classes/AssignmentScores';

const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Determine active tab based on URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/classwork')) return 'classwork';
    if (path.includes('/people')) return 'people';
    return 'announcements';
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!id || id === 'undefined' || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('classes')
          .select(`
            *,
            teacher:profiles!classes_teacher_id_fkey(full_name, email)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setClassData(data);
      } catch (error) {
        console.error('Error fetching class details:', error);
        toast.error('Failed to load class details');
        navigate('/classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [id, user, navigate]);

  const handleTabChange = (value: string) => {
    if (value === 'announcements') navigate(`/classes/${id}/announcements`);
    else if (value === 'classwork') navigate(`/classes/${id}/classwork`);
    else if (value === 'people') navigate(`/classes/${id}/people`);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!classData) {
    return <div className="flex items-center justify-center min-h-screen">Class not found</div>;
  }

  // Check if we are in a sub-route that should hide the header/tabs (like taking a quiz)
  const isFullScreen = location.pathname.includes('/quiz') || location.pathname.includes('/scores');

  if (isFullScreen) {
    return (
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="classwork/:assignmentId/quiz" element={<QuizPlayer />} />
          <Route path="classwork/:assignmentId/scores" element={<AssignmentScores />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/classes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">{classData.name}</h1>
              <p className="text-xs text-muted-foreground">{classData.teacher?.full_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-transparent border-b-0 h-auto p-0 space-x-6">
              <TabsTrigger 
                value="announcements" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
              >
                Announcements
              </TabsTrigger>
              <TabsTrigger 
                value="classwork" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
              >
                Classwork
              </TabsTrigger>
              <TabsTrigger 
                value="people" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
              >
                People
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="announcements" replace />} />
          <Route path="announcements" element={
            <>
              {/* Banner */}
              <div className="h-48 rounded-xl bg-gradient-to-r from-primary to-secondary p-8 flex flex-col justify-end text-white shadow-lg mb-6">
                <h1 className="text-3xl font-bold">{classData.name}</h1>
                <p className="text-white/80 text-lg mt-2">{classData.description}</p>
                {classData.join_code && (
                  <div className="mt-4 inline-flex items-center bg-black/20 backdrop-blur-sm px-3 py-1 rounded text-sm font-mono">
                    Code: {classData.join_code}
                  </div>
                )}
              </div>
              <AnnouncementsTab />
            </>
          } />
          <Route path="classwork" element={<ClassworkTab />} />
          <Route path="people" element={<PeopleTab />} />
        </Routes>
      </main>
    </div>
  );
};

export default ClassDetails;