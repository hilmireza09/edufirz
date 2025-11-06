import { Card } from "@/components/ui/card";
import { BookOpen, Code, Globe, Palette, Calculator, Beaker } from "lucide-react";

const subjects = [
  {
    icon: Calculator,
    name: "Mathematics",
    courses: 45,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Code,
    name: "Programming",
    courses: 62,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Globe,
    name: "Languages",
    courses: 38,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Palette,
    name: "Design",
    courses: 29,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Beaker,
    name: "Science",
    courses: 41,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: BookOpen,
    name: "Literature",
    courses: 33,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const PopularSubjects = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium mb-4">
            What to Learn
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Popular <span className="gradient-text">Subjects</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore diverse subjects and find your passion. Every journey starts with curiosity.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {subjects.map((subject, index) => {
            const Icon = subject.icon;
            return (
              <Card
                key={subject.name}
                className="glass-card border-0 p-6 hover-lift cursor-pointer group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`${subject.bgColor} p-4 rounded-2xl transition-transform group-hover:scale-110`}>
                    <Icon className={`w-8 h-8 ${subject.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {subject.courses} courses
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
