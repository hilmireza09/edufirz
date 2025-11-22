import { Card } from "@/components/ui/card";
import { 
  Calculator, 
  Dna, 
  Beaker, 
  Atom, 
  History, 
  Globe, 
  Landmark, 
  Users, 
  TrendingUp, 
  Palette, 
  Cpu, 
  BookOpen 
} from "lucide-react";

const subjects = [
  { icon: Calculator, name: "Mathematics", color: "text-blue-500", gradient: "from-blue-500/20 to-blue-600/5" },
  { icon: Dna, name: "Biology", color: "text-green-500", gradient: "from-green-500/20 to-green-600/5" },
  { icon: Beaker, name: "Chemistry", color: "text-teal-500", gradient: "from-teal-500/20 to-teal-600/5" },
  { icon: Atom, name: "Physics", color: "text-purple-500", gradient: "from-purple-500/20 to-purple-600/5" },
  { icon: History, name: "History", color: "text-amber-500", gradient: "from-amber-500/20 to-amber-600/5" },
  { icon: Globe, name: "Geography", color: "text-cyan-500", gradient: "from-cyan-500/20 to-cyan-600/5" },
  { icon: Landmark, name: "Government", color: "text-red-500", gradient: "from-red-500/20 to-red-600/5" },
  { icon: Users, name: "Social", color: "text-indigo-500", gradient: "from-indigo-500/20 to-indigo-600/5" },
  { icon: TrendingUp, name: "Economics", color: "text-emerald-500", gradient: "from-emerald-500/20 to-emerald-600/5" },
  { icon: Palette, name: "Arts", color: "text-pink-500", gradient: "from-pink-500/20 to-pink-600/5" },
  { icon: Cpu, name: "Technology", color: "text-slate-500", gradient: "from-slate-500/20 to-slate-600/5" },
  { icon: BookOpen, name: "English", color: "text-orange-500", gradient: "from-orange-500/20 to-orange-600/5" },
];

const PopularSubjects = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium mb-4 border border-white/20 bg-white/10 backdrop-blur-md shadow-sm">
            <BookOpen className="w-4 h-4 text-purple-500" />
            Explore Materials
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Popular <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Subjects</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dive into our extensive collection of study materials across various disciplines.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {subjects.map((subject, index) => {
            const Icon = subject.icon;
            return (
              <Card
                key={subject.name}
                className="group relative overflow-hidden border-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${subject.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative p-6 flex flex-col items-center text-center space-y-4 z-10">
                  <div className={`p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 shadow-sm ring-1 ring-black/5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 ${subject.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1 text-slate-800 dark:text-slate-100">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      Explore this subject
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PopularSubjects;
