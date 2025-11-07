import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BookOpen, CreditCard, GraduationCap, Users, LogOut, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('student');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserRole();
    }
  }, [user]);

  const loadUserProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    setProfile(data);
  };

  const loadUserRole = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .single();
    
    if (data) {
      setUserRole(data.role);
    }
  };

  const navigationItems = [
    {
      title: 'Dashboard',
      icon: BookOpen,
      description: 'Overview of your learning progress',
      color: 'from-primary to-primary-light',
      path: '/dashboard',
    },
    {
      title: 'Flashcards',
      icon: CreditCard,
      description: 'Practice with digital flashcards',
      color: 'from-secondary to-accent',
      path: '/flashcards',
    },
    {
      title: 'Quizzes',
      icon: GraduationCap,
      description: 'Test your knowledge',
      color: 'from-accent to-primary',
      path: '/quizzes',
    },
    {
      title: 'Classes',
      icon: Users,
      description: 'Join and manage classes',
      color: 'from-primary to-secondary',
      path: '/classes',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">EduLearn</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {profile?.full_name || user?.email}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {userRole}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={signOut}
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Ready to continue your learning journey? Choose where you'd like to start.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {navigationItems.map((item, index) => (
            <Link
              key={item.title}
              to={item.path}
              className="group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="glass-card p-6 rounded-2xl hover-lift h-full transition-all duration-300">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Box */}
        {userRole === 'student' && (
          <div className="glass-card p-6 rounded-2xl border-2 border-accent/20 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <GraduationCap className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Want to become a teacher?
                </h3>
                <p className="text-muted-foreground mb-4">
                  If you'd like to teach and create content for other students, please contact 
                  the administrator to upgrade your account to a teacher account.
                </p>
                <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                  Contact Admin
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats (Placeholder) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          <div className="glass-card p-6 rounded-2xl text-center">
            <p className="text-3xl font-bold gradient-text mb-2">0</p>
            <p className="text-sm text-muted-foreground">Courses Enrolled</p>
          </div>
          <div className="glass-card p-6 rounded-2xl text-center">
            <p className="text-3xl font-bold gradient-text mb-2">0</p>
            <p className="text-sm text-muted-foreground">Quizzes Completed</p>
          </div>
          <div className="glass-card p-6 rounded-2xl text-center">
            <p className="text-3xl font-bold gradient-text mb-2">0</p>
            <p className="text-sm text-muted-foreground">Study Hours</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;