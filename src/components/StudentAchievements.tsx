import { Trophy, Star, Target, Zap } from "lucide-react";

const StudentAchievements = () => {
  const achievements = [
    {
      icon: Trophy,
      number: "50K+",
      label: "Active Students",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: Star,
      number: "95%",
      label: "Satisfaction Rate",
      color: "from-primary to-secondary"
    },
    {
      icon: Target,
      number: "200+",
      label: "Courses Completed",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: Zap,
      number: "10M+",
      label: "Lessons Learned",
      color: "from-purple-400 to-pink-500"
    }
  ];

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium mb-4">
            <Trophy className="w-4 h-4 text-accent animate-glow" />
            <span>Student Success</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Celebrating <span className="gradient-text">Achievements</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join a thriving community of learners achieving their goals every day
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className="glass-card rounded-3xl p-8 text-center hover-lift animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center mx-auto mb-4`}>
                <achievement.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold gradient-text mb-2">
                {achievement.number}
              </div>
              <div className="text-muted-foreground font-medium">
                {achievement.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudentAchievements;
