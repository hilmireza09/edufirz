import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { 
  CreditCard, GraduationCap, Users, MessageSquare, 
  Settings, TrendingUp, Activity, Clock, Star, Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

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

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />

        {/* Dashboard Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
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