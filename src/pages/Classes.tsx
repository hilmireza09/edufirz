import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CreditCard, Users, LogOut, MessageSquare, Settings, Home, Search, Plus, ChevronRight, GraduationCap, User, Loader2, School, ChevronDown, Edit, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { getPageNumbers } from '@/lib/utils';

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string;
  join_code?: string;
  teacher_name?: string;
  student_count?: number;
};

const Classes = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userRole = profile?.role || 'student';
  
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination - 9 classes per page (3x3 grid)
  const classesPerPage = 9;
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  // Join Class State
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Create Class State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [windowStart, setWindowStart] = useState(1);

  useEffect(() => {
    if (currentPage < windowStart) {
      setWindowStart(currentPage);
    } else if (currentPage >= windowStart + 5) {
      setWindowStart(currentPage - 4);
    }
  }, [currentPage, windowStart]);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // For admins: fetch ALL classes
        // For students: fetch ONLY classes they are enrolled in via class_students
        // For teachers: fetch classes they created (handled by RLS)
        
        let query = supabase.from('classes').select(`
          *,
          teacher:profiles!classes_teacher_id_fkey(full_name),
          class_students(count)
        `);

        // Students: explicitly filter by enrollment
        if (userRole === 'student') {
          // Get enrolled class IDs first
          const { data: enrollments, error: enrollError } = await supabase
            .from('class_students')
            .select('class_id')
            .eq('student_id', user.id);

          if (enrollError) throw enrollError;

          const enrolledClassIds = enrollments?.map(e => e.class_id) || [];
          
          if (enrolledClassIds.length === 0) {
            setClasses([]);
            setLoading(false);
            return;
          }

          query = query.in('id', enrolledClassIds);
        } else if (userRole === 'teacher') {
          // Teachers: fetch classes they created OR joined
          const { data: enrollments } = await supabase
            .from('class_students')
            .select('class_id')
            .eq('student_id', user.id);

          const enrolledClassIds = enrollments?.map(e => e.class_id) || [];
          
          if (enrolledClassIds.length > 0) {
            query = query.or(`teacher_id.eq.${user.id},id.in.(${enrolledClassIds.join(',')})`);
          } else {
            query = query.eq('teacher_id', user.id);
          }
        }
        // Admins: no additional filtering, fetch all classes

        const { data, error } = await query;

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedClasses: ClassItem[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          teacher_id: c.teacher_id,
          join_code: c.join_code,
          teacher_name: c.teacher?.full_name || 'Unknown Teacher',
          student_count: c.class_students?.[0]?.count || 0
        }));

        setClasses(formattedClasses);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user, userRole]);

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a class code');
      return;
    }
    
    setJoining(true);
    try {
      // @ts-expect-error - RPC function not yet in types
      const { data, error } = await supabase.rpc('join_class_by_code', { code: joinCode.trim() });
      
      if (error) throw error;
      
      toast.success('Successfully joined class!');
      setIsJoinDialogOpen(false);
      setJoinCode('');
      // Refresh classes
      window.location.reload(); // Simple reload to refresh data
    } catch (error) {
      console.error('Error joining class:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join class. Please check the code.');
    } finally {
      setJoining(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast.error('Please enter a class name');
      return;
    }

    setCreating(true);
    try {
      // Generate a random 6-char join code
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase
        .from('classes')
        .insert({
          name: newClassName,
          description: newClassDescription,
          teacher_id: user?.id,
          join_code: joinCode
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Class created successfully!');
      setIsCreateDialogOpen(false);
      setNewClassName('');
      setNewClassDescription('');
      
      // Add to local state
      const newClass: ClassItem = {
        id: data.id,
        name: data.name,
        description: data.description,
        teacher_id: data.teacher_id,
        join_code: data.join_code,
        teacher_name: profile?.full_name || 'Me',
        student_count: 0
      };
      setClasses([newClass, ...classes]);
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.teacher_name && c.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredClasses.length / classesPerPage);
  const startIndex = (currentPage - 1) * classesPerPage;
  const paginatedClasses = filteredClasses.slice(startIndex, startIndex + classesPerPage);

  // Update URL when page changes
  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  // Reset to page 1 when search query changes
  const prevSearchQuery = useRef(searchQuery);
  
  useEffect(() => {
    if (prevSearchQuery.current !== searchQuery) {
      if (currentPage > 1) {
        setSearchParams({ page: '1' });
      }
      prevSearchQuery.current = searchQuery;
    }
  }, [searchQuery, currentPage, setSearchParams]);

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-gradient-to-br from-background to-muted">
          <div className="max-w-7xl mx-auto gap-8 flex flex-col min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  My Classes
                </h1>
                <p className="text-muted-foreground mt-1">
                  {userRole === 'admin' ? 'Manage all classes and oversee the platform' : userRole === 'teacher' ? 'Manage your classes and assignments' : 'View your enrolled classes and coursework'}
                </p>
              </div>
              
              <div className="flex gap-3">
                {(userRole === 'student' || userRole === 'teacher') && (
                  <Button onClick={() => setIsJoinDialogOpen(true)} className="bg-white/10 hover:bg-white/20 text-foreground border border-primary/20 backdrop-blur-sm">
                    <Users className="mr-2 h-4 w-4" />
                    Join Class
                  </Button>
                )}
                {userRole === 'admin' && (
                  <Button onClick={() => setIsJoinDialogOpen(true)} variant="outline" className="border-primary/20">
                    <Users className="mr-2 h-4 w-4" />
                    Join Class
                  </Button>
                )}
                {(userRole === 'teacher' || userRole === 'admin') && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Class
                  </Button>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
               <Input
                 placeholder="Search classes..."
                 className="pl-10 bg-white/50 border-white/20 focus:bg-white/80 transition-all"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="h-6 w-2/3 bg-muted/50 rounded animate-pulse" />
                      <div className="h-8 w-8 bg-muted/50 rounded animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
                      <div className="h-4 w-5/6 bg-muted/50 rounded animate-pulse" />
                    </div>
                    <div className="pt-4 flex justify-between items-center">
                      <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
                      <div className="h-8 w-24 bg-muted/50 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-16 bg-card/30 backdrop-blur-sm rounded-3xl border border-border/50">
                <School className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No classes found</h3>
                <p className="text-muted-foreground mb-6">
                  {userRole === 'admin'
                    ? "No classes have been created yet."
                    : userRole === 'teacher' 
                    ? "You haven't created any classes yet." 
                    : "You haven't joined any classes yet."}
                </p>
                {userRole === 'admin' || userRole === 'teacher' ? (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>Create your first class</Button>
                ) : (
                  <Button onClick={() => setIsJoinDialogOpen(true)}>Join a class</Button>
                )}
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedClasses.map((cls) => (
                    <Card 
                      key={cls.id} 
                      className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/classes/${cls.id}`)}
                    >
                      <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
                      <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                          <span className="truncate text-xl">{cls.name}</span>
                          {(userRole === 'admin' || (userRole === 'teacher' && cls.teacher_id === user?.id)) && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/classes/${cls.id}/edit`);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-500"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to delete "${cls.name}"?`)) {
                                    try {
                                      const { error } = await supabase
                                        .from('classes')
                                        .delete()
                                        .eq('id', cls.id);
                                      if (error) throw error;
                                      toast.success('Class deleted successfully');
                                      setClasses(classes.filter(c => c.id !== cls.id));
                                    } catch (error) {
                                      console.error('Error deleting class:', error);
                                      toast.error('Failed to delete class');
                                    }
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {cls.description || 'No description'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <User className="h-4 w-4" />
                          <span>{cls.teacher_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{cls.student_count} Students</span>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/20 p-4 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                          Code: {cls.join_code}
                        </span>
                        <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform text-primary">
                          View Class <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && filteredClasses.length > 0 && totalPages > 1 && (
              <div className="sticky bottom-0 pt-4 mt-auto bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm border-t border-white/10 dark:border-slate-800/50 -mx-6 -mb-6 md:-mx-8 md:-mb-8 p-4 md:p-6 z-10">
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="glass-card border-white/20 hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm rounded-xl w-24 justify-center"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const page = windowStart + i;
                        if (page > totalPages) {
                          return <div key={`empty-${i}`} className="w-10 h-10" />;
                        }
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-xl p-0 transition-all duration-300 ${page === currentPage ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 scale-105' : 'glass-card hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm border-white/20'}`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="glass-card border-white/20 hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm rounded-xl w-24 justify-center"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Join Class Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle>Join a Class</DialogTitle>
            <DialogDescription>
              Enter the class code provided by your teacher to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="e.g. X7Y2Z9"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="text-center text-2xl tracking-widest uppercase font-mono"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleJoinClass} disabled={joining || joinCode.length < 3}>
              {joining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Join Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>
              Create a space for your students to learn and collaborate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class Name</label>
              <Input
                placeholder="e.g. Advanced Mathematics 101"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                placeholder="Brief overview of the class..."
                value={newClassDescription}
                onChange={(e) => setNewClassDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateClass} disabled={creating || !newClassName}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classes;