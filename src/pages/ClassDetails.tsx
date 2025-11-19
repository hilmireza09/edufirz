import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Users, BookOpen, MessageSquare, MoreVertical, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stream');

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!id || !user) return;
      
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!classData) {
    return <div className="flex items-center justify-center min-h-screen">Class not found</div>;
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent border-b-0 h-auto p-0 space-x-6">
              <TabsTrigger 
                value="stream" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
              >
                Stream
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
        <Tabs value={activeTab} className="space-y-6">
          {/* Stream Tab */}
          <TabsContent value="stream" className="space-y-6">
            {/* Banner */}
            <div className="h-48 rounded-xl bg-gradient-to-r from-primary to-secondary p-8 flex flex-col justify-end text-white shadow-lg">
              <h1 className="text-3xl font-bold">{classData.name}</h1>
              <p className="text-white/80 text-lg mt-2">{classData.description}</p>
              {classData.join_code && (
                <div className="mt-4 inline-flex items-center bg-black/20 backdrop-blur-sm px-3 py-1 rounded text-sm font-mono">
                  Code: {classData.join_code}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="hidden md:block">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Upcoming</h3>
                    <p className="text-sm text-muted-foreground">No work due soon</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-3 space-y-4">
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="text-muted-foreground text-sm">Announce something to your class</p>
                  </CardContent>
                </Card>
                
                {/* Placeholder for announcements */}
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No announcements yet</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Classwork Tab */}
          <TabsContent value="classwork">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create
                </Button>
              </div>
              
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No assignments yet</p>
              </div>
            </div>
          </TabsContent>

          {/* People Tab */}
          <TabsContent value="people">
            <div className="max-w-3xl mx-auto space-y-8">
              <section>
                <h2 className="text-2xl text-primary border-b border-primary/20 pb-4 mb-4">Teachers</h2>
                <div className="flex items-center gap-4 py-2">
                  <Avatar>
                    <AvatarFallback>{classData.teacher?.full_name?.charAt(0) || 'T'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{classData.teacher?.full_name}</span>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between border-b border-primary/20 pb-4 mb-4">
                  <h2 className="text-2xl text-primary">Students</h2>
                  <span className="text-muted-foreground">0 students</span>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No students yet</p>
                </div>
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClassDetails;