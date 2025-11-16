import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BookOpen, CreditCard, GraduationCap, Users, LogOut, MessageSquare, Settings, Home, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('student');
  const [activeSection, setActiveSection] = useState('dashboard');

  const navigationItems = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'flashcards', title: 'Flashcards', icon: CreditCard },
    { id: 'quizzes', title: 'Quizzes', icon: GraduationCap },
    { id: 'classes', title: 'Classes', icon: Users },
    { id: 'forum', title: 'Forum', icon: MessageSquare },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  const quickAccessItems = [
    { title: 'Assignments', icon: FileText },
    { title: 'Schedule', icon: Calendar },
    { title: 'Resources', icon: BookOpen },
    { title: 'Grades', icon: GraduationCap },
  ];

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
                  className="glass-card p-6 rounded-2xl hover-lift animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 mx-auto">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'flashcards':
        return (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gradient-to-br from-secondary/10 to-accent/10 mb-6">
              <CreditCard className="h-12 w-12 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Flashcards</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Practice with digital flashcards to reinforce your learning.
            </p>
            <div className="glass-card p-8 rounded-2xl max-w-md mx-auto">
              <p className="text-muted-foreground">Flashcard features coming soon</p>
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
            <div className="glass-card p-8 rounded-2xl max-w-md mx-auto">
              <p className="text-muted-foreground">Quiz features coming soon</p>
            </div>
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
            <div className="glass-card p-8 rounded-2xl max-w-md mx-auto">
              <p className="text-muted-foreground">Class features coming soon</p>
            </div>
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
            <div className="glass-card p-8 rounded-2xl max-w-md mx-auto">
              <p className="text-muted-foreground">Forum features coming soon</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 mb-6">
              <Settings className="h-12 w-12 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Settings</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Customize your learning experience and preferences.
            </p>
            <div className="glass-card p-8 rounded-2xl max-w-md mx-auto">
              <p className="text-muted-foreground">Settings features coming soon</p>
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
      <div className="w-64 min-h-screen p-6 bg-white/20 backdrop-blur-xl border-r border-white/30 sticky top-0">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">EduLearn</span>
          </div>
          
          <div className="text-sm font-medium text-foreground">
            {profile?.full_name || user?.email}
          </div>
          <div className="text-xs text-muted-foreground capitalize">
            {userRole}
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
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-primary shadow-lg'
                    : 'text-foreground hover:bg-white/30'
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
            className="w-full justify-start gap-3 border-white/30 hover:bg-white/20"
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
        <header className="glass-card border-b border-border/50 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground capitalize">
              {activeSection}
            </h1>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="glass-card rounded-2xl h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;