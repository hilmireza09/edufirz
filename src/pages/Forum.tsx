import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BookOpen, CreditCard, Users, LogOut, MessageSquare, Settings, Home, Calendar, FileText, Search, ChevronDown, User, Plus, Edit, Trash, Tag, RotateCcw, MessageSquarePlus, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Post = {
  id: number;
  author: string;
  role: string;
  content: string;
  likes: number;
  replies: number;
};

const initialPosts: Post[] = [
  { id: 1, author: 'Sarah Chen', role: 'student', content: 'Any tips for mastering derivatives? I struggle with chain rule.', likes: 12, replies: 4 },
  { id: 2, author: 'Mr. Patel', role: 'teacher', content: 'I will host a review session Friday 5pm. Bring your questions!', likes: 22, replies: 7 },
  { id: 3, author: 'Diego Ramirez', role: 'student', content: 'Sharing a great resource I found for verb conjugations.', likes: 8, replies: 2 },
];

const Forum = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
  const [userRole, setUserRole] = useState<string>('student');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPost, setNewPost] = useState('');

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

  const handleAddPost = () => {
    if (!newPost.trim()) return;
    const post: Post = {
      id: Date.now(),
      author: 'You',
      role: 'student',
      content: newPost.trim(),
      likes: 0,
      replies: 0,
    };
    setPosts([post, ...posts]);
    setNewPost('');
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
                  item.id === 'forum'
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
          <div className="max-w-4xl mx-auto">
            {/* Composer */}
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-border shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-semibold">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'Y'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share an idea, ask a question, or start a discussion..."
                    className="w-full bg-transparent outline-none resize-none min-h-[100px] text-foreground placeholder:text-muted-foreground"
                  />
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleAddPost} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 hover-lift border border-border shadow-sm animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                      {post.author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-foreground">{post.author}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary/15 text-secondary-foreground capitalize">
                          {post.role}
                        </span>
                      </div>
                      <p className="text-foreground/90 leading-relaxed mb-4">{post.content}</p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <button className="hover:text-accent transition-colors flex items-center gap-1">
                          👍 {post.likes}
                        </button>
                        <button className="hover:text-accent transition-colors flex items-center gap-1">
                          💬 {post.replies}
                        </button>
                        <button className="hover:text-accent transition-colors">
                          ↩ Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Forum;



