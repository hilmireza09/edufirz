import { Star, BrainCircuit, GraduationCap, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const StudentAchievements = () => {
  const achievements = [
    {
      icon: Star,
      number: "98%",
      label: "Student Satisfaction Rate",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: BrainCircuit,
      number: "500K+",
      label: "Flashcards Created",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: GraduationCap,
      number: "200K+",
      label: "Quizzes Taken",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: Users,
      number: "30K+",
      label: "Classes Managed",
      color: "text-green-500",
      bg: "bg-green-500/10",
      gradient: "from-green-500/20 to-emerald-500/20"
    }
  ];

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium mb-4 border border-white/20 bg-white/10 backdrop-blur-md shadow-sm">
            <Star className="w-4 h-4 text-purple-500" />
            <span>Student Success</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Celebrating <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Achievements</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join a thriving community of learners achieving their goals every day
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {achievements.map((achievement, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${achievement.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative p-6 flex flex-col items-center text-center space-y-4 z-10">
                <div className={`p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 shadow-sm ring-1 ring-black/5 group-hover:scale-110 transition-transform duration-300`}>
                  <achievement.icon className={`w-8 h-8 ${achievement.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-slate-800 dark:text-slate-100">{achievement.number}</h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {achievement.label}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudentAchievements;
