import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CreditCard, Users, LogOut, MessageSquare, Settings, Home, Search, Plus, ChevronRight, GraduationCap, User, Loader2, School, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('student');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Join Class State
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Create Class State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const navigationItems = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'flashcards', title: 'Flashcards', icon: CreditCard },
    { id: 'quizzes', title: 'Quizzes', icon: BookOpen },
    { id: 'classes', title: 'Classes', icon: Users },
    { id: 'forum', title: 'Forum', icon: MessageSquare },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch user profile and role
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfile(data);
        setUserRole(data.role || 'student');
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // For students, we fetch classes they are enrolled in
        // For teachers, we fetch classes they created
        // RLS policies should handle the filtering, but we need to join with profiles to get teacher name
        
        const { data, error } = await supabase
          .from('classes')
          .select(`
            *,
            teacher:profiles!classes_teacher_id_fkey(full_name),
            class_students(count)
          `);

        if (error) throw error;

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
  }, [user]);

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a class code');
      return;
    }
    
    setJoining(true);
    try {
      const { data, error } = await supabase.rpc('join_class_by_code', { code: joinCode.trim() });
      
      if (error) throw error;
      
      toast.success('Successfully joined class!');
      setIsJoinDialogOpen(false);
      setJoinCode('');
      // Refresh classes
      window.location.reload(); // Simple reload to refresh data
    } catch (error: any) {
      console.error('Error joining class:', error);
      toast.error(error.message || 'Failed to join class. Please check the code.');
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
    } catch (error: any) {
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

  return (
    <div className="min-h-screen flex">
      {/* Glassmorphism Sidebar */}
      <div className="w-64 min-h-screen p-6 bg-background/80 backdrop-blur-xl border-r border-border sticky top-0 hidden md:block">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">EduLearn</span>
          </div>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'dashboard') {
                    navigate('/dashboard');
                  } else if (item.id === 'flashcards') {
                    navigate('/flashcards');
                  } else if (item.id === 'quizzes') {
                    navigate('/quizzes');
                  } else if (item.id === 'classes') {
                    navigate('/classes');
                  } else if (item.id === 'forum') {
                    navigate('/forum');
                  } else if (item.id === 'settings') {
                    navigate('/dashboard');
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  item.id === 'classes'
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-primary shadow-sm'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-8">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-border hover:bg-accent"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-background to-muted">
        {/* Header */}
        <header className="bg-background/80 backdrop-blur-xl border-b border-border p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="md:hidden">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search classes..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* User Profile */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-lg py-2 z-10 border border-border">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-medium text-foreground truncate">
                      {profile?.full_name || user?.email}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {userRole}
                    </p>
                  </div>
                  <div className="px-4 py-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 border-border hover:bg-accent"
                      onClick={signOut}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  My Classes
                </h1>
                <p className="text-muted-foreground mt-1">
                  {userRole === 'teacher' ? 'Manage your classes and assignments' : 'View your enrolled classes and coursework'}
                </p>
              </div>
              
              <div className="flex gap-3">
                {userRole === 'student' && (
                  <Button onClick={() => setIsJoinDialogOpen(true)} className="bg-white/10 hover:bg-white/20 text-foreground border border-primary/20 backdrop-blur-sm">
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

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-16 bg-card/30 backdrop-blur-sm rounded-3xl border border-border/50">
                <School className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No classes found</h3>
                <p className="text-muted-foreground mb-6">
                  {userRole === 'teacher' 
                    ? "You haven't created any classes yet." 
                    : "You haven't joined any classes yet."}
                </p>
                {userRole === 'teacher' ? (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>Create your first class</Button>
                ) : (
                  <Button onClick={() => setIsJoinDialogOpen(true)}>Join a class</Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls) => (
                  <Card 
                    key={cls.id} 
                    className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/classes/${cls.id}`)}
                  >
                    <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span className="truncate text-xl">{cls.name}</span>
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