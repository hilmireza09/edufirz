import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrainCircuit, GraduationCap, ArrowRight, Sparkles, Users, MessageSquare } from "lucide-react";

const features = [
  {
    id: 'flashcards',
    title: 'Flashcards',
    description: 'Master subjects with active recall. Create custom decks or study from shared collections.',
    icon: BrainCircuit,
    path: '/flashcards',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    gradient: 'from-pink-500 to-purple-600',
    delay: '0s'
  },
  {
    id: 'quizzes',
    title: 'Quizzes',
    description: 'Test your knowledge and track progress with comprehensive interactive quizzes.',
    icon: GraduationCap,
    path: '/quizzes',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    gradient: 'from-blue-500 to-cyan-500',
    delay: '0.1s'
  },
  {
    id: 'classes',
    title: 'Classes',
    description: 'Join classrooms, manage assignments, and collaborate with teachers and peers.',
    icon: Users,
    path: '/classes',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    gradient: 'from-emerald-500 to-teal-500',
    delay: '0.2s'
  },
  {
    id: 'forum',
    title: 'Forum',
    description: 'Engage in discussions, ask questions, and share knowledge with the community.',
    icon: MessageSquare,
    path: '/forum',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    gradient: 'from-orange-500 to-amber-500',
    delay: '0.3s'
  }
];

const FeaturedCourses = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-purple-100 dark:border-purple-900/50 shadow-sm backdrop-blur-md text-sm font-medium text-purple-600 dark:text-purple-400">
            <Sparkles className="w-4 h-4" />
            <span>Explore Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 dark:from-white dark:via-purple-200 dark:to-white">
            Everything You Need to Excel
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover powerful tools designed to enhance your learning journey. From active recall to community discussions, we have it all.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div 
              key={feature.id}
              onClick={() => navigate(feature.path)}
              className="group relative cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
              style={{ animationDelay: feature.delay }}
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-30 blur transition duration-500`} />
              <Card className="relative h-full overflow-hidden border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 transition-all duration-500 group-hover:translate-y-[-4px] group-hover:shadow-xl">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                  <feature.icon className={`w-32 h-32 ${feature.color} rotate-12`} />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed flex-grow">
                    {feature.description}
                  </p>

                  <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Explore <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;