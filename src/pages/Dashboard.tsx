import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BookOpen, CreditCard, GraduationCap, Users, LogOut, MessageSquare, Settings, Home, Calendar, FileText, Search, ChevronDown, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('student');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  const navigationItems = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'flashcards', title: 'Flashcards', icon: CreditCard },
    { id: 'quizzes', title: 'Quizzes', icon: GraduationCap },
    { id: 'classes', title: 'Classes', icon: Users },
    { id: 'forum', title: 'Forum', icon: MessageSquare },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  const quickAccessItems = [
    { title: 'Assignments', icon: FileText, path: '/assignments' },
    { title: 'Schedule', icon: Calendar, path: '/schedule' },
    { title: 'Resources', icon: BookOpen, path: '/resources' },
    { title: 'Grades', icon: GraduationCap, path: '/grades' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality would be implemented here
    console.log('Searching for:', searchQuery);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 mb-6">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Explore your learning journey with our intuitive tools and resources.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {quickAccessItems.map((item, index) => (
                <div 
                  key={item.title}
                  className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl hover-lift animate-fade-in-up border border-border shadow-sm cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(item.path)}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 mx-auto">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">Access your {item.title.toLowerCase()}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'flashcards':
        return (
          <div className="py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Flashcards</h2>
                <p className="text-muted-foreground">Study and memorize key concepts</p>
              </div>
              <Button onClick={() => navigate('/flashcards')} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                Open Flashcards
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Create Decks</h3>
                <p className="text-sm text-muted-foreground">Build custom flashcard decks for any subject</p>
              </div>
              
              <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Study Mode</h3>
                <p className="text-sm text-muted-foreground">Flip through cards and test your knowledge</p>
              </div>
              
              <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Share Decks</h3>
                <p className="text-sm text-muted-foreground">Share your decks with classmates</p>
              </div>
            </div>
            
            <div className="mt-8 bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">Getting Started</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Create a Deck</h4>
                    <p className="text-sm text-muted-foreground">Click "Open Flashcards" and create your first deck</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Add Cards</h4>
                    <p className="text-sm text-muted-foreground">Add flashcards with questions and answers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Study</h4>
                    <p className="text-sm text-muted-foreground">Flip through cards to test your knowledge</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Track Progress</h4>
                    <p className="text-sm text-muted-foreground">Monitor your learning with progress indicators</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'quizzes':
        return (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 mb-6">
              <GraduationCap className="h-12 w-12 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Quizzes</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Test your knowledge with interactive quizzes.
            </p>
            <Button onClick={() => navigate('/quizzes')} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              Start Quiz
            </Button>
          </div>
        );
      case 'classes':
        return (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 mb-6">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Classes</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join and manage your classes and coursework.
            </p>
            <Button onClick={() => navigate('/classes')} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              View Classes
            </Button>
          </div>
        );
      case 'forum':
        return (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gradient-to-br from-secondary/10 to-accent/10 mb-6">
              <MessageSquare className="h-12 w-12 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Forum</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Collaborate with peers and teachers in our community forum.
            </p>
            <Button onClick={() => navigate('/forum')} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              Join Discussion
            </Button>
          </div>
        );
      case 'settings':
        return (
          <div className="py-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">Settings</h2>
            
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{profile?.full_name || 'User'}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {userRole}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Profile Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Full Name</label>
                      <p className="font-medium">{profile?.full_name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Email</label>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Role</label>
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                        {userRole}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-3">Preferences</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive email updates</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          defaultChecked={profile?.email_notifications}
                          className="sr-only"
                        />
                        <div className="block w-10 h-6 rounded-full bg-muted"></div>
                        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform checked:translate-x-4"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Mobile notifications</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          defaultChecked={profile?.push_notifications}
                          className="sr-only"
                        />
                        <div className="block w-10 h-6 rounded-full bg-muted"></div>
                        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform checked:translate-x-4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome</h2>
            <p className="text-muted-foreground">Select a section from the sidebar to get started</p>
          </div>
        );
    }
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
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeSection === item.id
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
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;