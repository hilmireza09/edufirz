import { Megaphone, Timer, Trophy, Layers, BarChart, Library, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TeacherResources = () => {
  const resources = [
    {
      icon: Megaphone,
      title: "Class Announcement",
      description: "Keep students informed with instant updates and important notifications.",
      color: "text-blue-500",
      gradient: "from-blue-500/20 to-blue-600/5"
    },
    {
      icon: Timer,
      title: "Quiz Time Tracker",
      description: "Monitor quiz duration and manage time limits for fair assessments.",
      color: "text-orange-500",
      gradient: "from-orange-500/20 to-orange-600/5"
    },
    {
      icon: Trophy,
      title: "Quiz Leaderboard",
      description: "Foster healthy competition with real-time rankings and scoreboards.",
      color: "text-yellow-500",
      gradient: "from-yellow-500/20 to-yellow-600/5"
    },
    {
      icon: Layers,
      title: "Course Builder",
      description: "Design comprehensive courses with our intuitive drag-and-drop interface.",
      color: "text-purple-500",
      gradient: "from-purple-500/20 to-purple-600/5"
    },
    {
      icon: BarChart,
      title: "Analytics & Insights",
      description: "Monitor performance with detailed reports and data-driven insights.",
      color: "text-green-500",
      gradient: "from-green-500/20 to-green-600/5"
    },
    {
      icon: Library,
      title: "Resource Library",
      description: "Access a vast collection of teaching materials and shared resources.",
      color: "text-pink-500",
      gradient: "from-pink-500/20 to-pink-600/5"
    }
  ];

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium mb-4 border border-white/20 bg-white/10 backdrop-blur-md shadow-sm">
            <Award className="w-4 h-4 text-purple-500" />
            <span className="text-slate-700 dark:text-slate-200">For Educators</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Empower Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Teaching</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, manage, and deliver exceptional learning experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${resource.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <CardContent className="p-8 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-white/50 dark:bg-slate-800/50 shadow-sm ring-1 ring-black/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${resource.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">{resource.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{resource.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TeacherResources;
