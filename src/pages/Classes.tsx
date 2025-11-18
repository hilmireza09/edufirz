import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BookOpen, CreditCard, Users, LogOut, MessageSquare, Settings, Home, Calendar, FileText, Search, ChevronDown, User, Plus, Edit, Trash, Tag, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Classes = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('student');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality would be implemented here
    console.log('Searching for:', searchQuery);
  };
  return (
    <div className="min-h-screen flex">
      {/* Glassmorphism Sidebar */}
      <div className="w-64 min-h-screen p-6 bg-background/80 backdrop-blur-xl border-r border-border sticky top-0">
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-background/80 backdrop-blur-xl border-b border-border p-4">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search courses, resources, or topics..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* User Profile */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
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

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-background to-muted">
          <div className="rounded-2xl h-full">
            <div className="text-center py-12">
              <div className="inline-block p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 mb-6">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Classes</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Join and manage your classes and coursework.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {/* Schedule */}
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl hover-lift border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Schedule</h3>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between p-2 rounded-lg bg-muted/50">
                      <span>Fri 5:00 PM</span>
                      <span className="text-muted-foreground">Calculus Review</span>
                    </li>
                    <li className="flex justify-between p-2 rounded-lg bg-muted/50">
                      <span>Sat 10:00 AM</span>
                      <span className="text-muted-foreground">Spanish Conversation</span>
                    </li>
                    <li className="flex justify-between p-2 rounded-lg bg-muted/50">
                      <span>Sun 3:00 PM</span>
                      <span className="text-muted-foreground">Web Dev Workshop</span>
                    </li>
                  </ul>
                </div>

                {/* Materials */}
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl hover-lift border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-secondary" />
                    <h3 className="font-semibold text-foreground">Materials</h3>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <span>Chain Rule Cheatsheet.pdf</span>
                      <span className="text-muted-foreground">128 KB</span>
                    </li>
                    <li className="flex justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <span>Spanish Verbs Deck.apkg</span>
                      <span className="text-muted-foreground">2.3 MB</span>
                    </li>
                    <li className="flex justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <span>Flexbox Guide.md</span>
                      <span className="text-muted-foreground">18 KB</span>
                    </li>
                  </ul>
                </div>

                {/* Discussion */}
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl hover-lift border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Discussion</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-xl bg-muted/50">Q: Tips for remembering trig identities?</div>
                    <div className="p-3 rounded-xl bg-muted/50">A: Use triangles + practice; draw and recite.</div>
                    <div className="p-3 rounded-xl bg-muted/50">Q: Best resources for CSS grids?</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Classes;