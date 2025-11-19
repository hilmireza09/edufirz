import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BookOpen, CreditCard, Users, LogOut, MessageSquare, Settings, Home, GraduationCap } from 'lucide-react';
import { Logo } from '@/components/Logo';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const navigationItems = [
    { id: 'dashboard', title: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'flashcards', title: 'Flashcards', icon: CreditCard, path: '/flashcards' },
    { id: 'quizzes', title: 'Quizzes', icon: GraduationCap, path: '/quizzes' },
    { id: 'classes', title: 'Classes', icon: Users, path: '/classes' },
    { id: 'forum', title: 'Forum', icon: MessageSquare, path: '/forum' },
    { id: 'settings', title: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="w-64 h-full p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-white/20 dark:border-slate-800/50 hidden md:flex md:flex-col z-30 shadow-xl">
      <div className="mb-8">
        <Link to="/dashboard" className="flex items-center gap-2 mb-6 px-2">
          <Logo width={160} height={45} />
        </Link>
      </div>
      
      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isCurrent = location.pathname.startsWith(item.path) && item.path !== '/dashboard' ? true : location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isCurrent
                  ? 'bg-primary/10 text-primary shadow-sm border border-primary/10'
                  : 'text-muted-foreground hover:bg-white/50 hover:text-foreground hover:shadow-sm'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-300 ${isCurrent ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="font-medium">{item.title}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-8">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
};
