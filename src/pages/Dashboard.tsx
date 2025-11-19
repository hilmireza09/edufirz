import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, CreditCard, GraduationCap, Users, LogOut, MessageSquare, 
  Settings, Home, Search, ChevronDown, TrendingUp, Activity, Clock, Star, Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Stats State
  const [stats, setStats] = useState({
    flashcardsCreated: 0,
    quizzesAttempted: 0,
    averageScore: 0,
    classesJoined: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigationItems = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'flashcards', title: 'Flashcards', icon: CreditCard },
    { id: 'quizzes', title: 'Quizzes', icon: GraduationCap },
    { id: 'classes', title: 'Classes', icon: Users },
    { id: 'forum', title: 'Forum', icon: MessageSquare },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        // Fetch Flashcards Count (via Decks)
        const { data: decks } = await supabase
          .from('decks')
          .select('flashcard_count')
          .eq('user_id', user.id);
        const totalFlashcards = decks?.reduce((acc, deck) => acc + (deck.flashcard_count || 0), 0) || 0;

        // Fetch Quiz Attempts
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('score, max_score, created_at, quizzes(title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        const totalAttempts = attempts?.length || 0;
        const avgScore = totalAttempts > 0 
          ? (attempts?.reduce((acc, curr) => acc + ((curr.score || 0) / (curr.max_score || 1)) * 100, 0) || 0) / totalAttempts 
          : 0;

        // Fetch Classes Joined
        const { count: classesCount } = await supabase
          .from('class_students')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id);

        setStats({
          flashcardsCreated: totalFlashcards,
          quizzesAttempted: totalAttempts,
          averageScore: Math.round(avgScore),
          classesJoined: classesCount || 0
        });

        // Prepare Chart Data (Last 7 attempts)
        const chartData = attempts?.slice(0, 7).reverse().map(attempt => ({
          name: new Date(attempt.created_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: Math.round(((attempt.score || 0) / (attempt.max_score || 1)) * 100)
        })) || [];
        setChartData(chartData);

        // Recent Activity (Mix of quiz attempts and maybe deck creation if we had timestamps, for now just quizzes)
        const activity = attempts?.slice(0, 5).map(attempt => ({
          id: attempt.created_at,
          type: 'quiz',
          title: `Completed ${attempt.quizzes?.title || 'a quiz'}`,
          time: attempt.created_at,
          score: Math.round(((attempt.score || 0) / (attempt.max_score || 1)) * 100)
        })) || [];
        setRecentActivity(activity);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleNavigation = (id: string) => {
    if (id === 'dashboard') navigate('/dashboard');
    else if (id === 'flashcards') navigate('/flashcards');
    else if (id === 'quizzes') navigate('/quizzes');
    else if (id === 'classes') navigate('/classes');
    else if (id === 'forum') navigate('/forum');
    else if (id === 'settings') navigate('/dashboard'); // Placeholder
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background to-muted">
      {/* Sidebar */}
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
            const isActive = item.id === 'dashboard';
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
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

            <div className="flex-1 max-w-xl relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search your dashboard..." 
                className="pl-10 bg-white/50 border-white/20 focus:bg-white/80 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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

        {/* Dashboard Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">Here's what's happening with your learning journey.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/flashcards')} className="bg-white text-primary hover:bg-gray-50 border border-primary/20 shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Create Flashcards
              </Button>
              <Button onClick={() => navigate('/quizzes')} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Activity className="mr-2 h-4 w-4" /> Start Quiz
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Flashcards Created" 
              value={stats.flashcardsCreated} 
              icon={CreditCard} 
              color="text-blue-600" 
              bg="bg-blue-100"
              trend="+12% this week"
            />
            <StatCard 
              title="Quizzes Attempted" 
              value={stats.quizzesAttempted} 
              icon={GraduationCap} 
              color="text-purple-600" 
              bg="bg-purple-100"
              trend="Keep it up!"
            />
            <StatCard 
              title="Average Score" 
              value={`${stats.averageScore}%`} 
              icon={Star} 
              color="text-yellow-600" 
              bg="bg-yellow-100"
              trend={stats.averageScore > 80 ? "Excellent!" : "Room to improve"}
            />
            <StatCard 
              title="Classes Joined" 
              value={stats.classesJoined} 
              icon={Users} 
              color="text-green-600" 
              bg="bg-green-100"
              trend="Active learner"
            />
          </div>

          {/* Charts & Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Performance Chart */}
            <Card className="lg:col-span-2 border-white/20 bg-white/60 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6b7280', fontSize: 12 }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6b7280', fontSize: 12 }} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#8b5cf6" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorScore)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Activity className="h-12 w-12 mb-4 opacity-20" />
                      <p>No quiz data available yet.</p>
                      <Button variant="link" onClick={() => navigate('/quizzes')} className="mt-2 text-primary">
                        Take your first quiz
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-white/20 bg-white/60 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-4 group">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-sm font-semibold text-primary">
                          {activity.score}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No recent activity.</p>
                      <p className="text-sm mt-1">Start learning to see your progress!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bg, trend }: any) => (
  <div className="bg-white/60 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`${bg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      {trend && (
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50 text-gray-600 border border-white/20">
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
    <p className="text-3xl font-bold text-gray-800">{value}</p>
  </div>
);

export default Dashboard;