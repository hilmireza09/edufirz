import { useState, useRef, useEffect } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BookOpen, CreditCard, Users, LogOut, MessageSquare, Settings, Home, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import ForumPostList from '@/components/forum/ForumPostList';
import ForumPostDetail from '@/components/forum/ForumPostDetail';



const Forum = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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

  // Fetch user profile
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
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background to-muted">
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
            const isActive = item.id === 'forum';
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'dashboard') navigate('/dashboard');
                  else if (item.id === 'flashcards') navigate('/flashcards');
                  else if (item.id === 'quizzes') navigate('/quizzes');
                  else if (item.id === 'classes') navigate('/classes');
                  else if (item.id === 'forum') navigate('/forum');
                  else if (item.id === 'settings') navigate('/dashboard');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
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
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-background/80 backdrop-blur-xl border-b border-border p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="md:hidden">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>

            {/* Spacer since we moved search to the list view */}
            <div className="flex-1"></div>

            {/* User Profile */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold shadow-lg shadow-primary/20">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-border py-1 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Forum Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<ForumPostList />} />
            <Route path="/:postId" element={<ForumPostDetail />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Forum;



