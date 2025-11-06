import { BookOpen, Users, BarChart, Video, FileText, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TeacherResources = () => {
  const resources = [
    {
      icon: Video,
      title: "Interactive Tools",
      description: "Create engaging lessons with multimedia content and interactive exercises"
    },
    {
      icon: Users,
      title: "Class Management",
      description: "Track student progress, manage assignments, and communicate effortlessly"
    },
    {
      icon: BarChart,
      title: "Analytics & Insights",
      description: "Monitor performance with detailed reports and data-driven insights"
    },
    {
      icon: FileText,
      title: "Course Builder",
      description: "Design comprehensive courses with our intuitive drag-and-drop interface"
    },
    {
      icon: Award,
      title: "Certification",
      description: "Issue verified certificates and track student achievements"
    },
    {
      icon: BookOpen,
      title: "Resource Library",
      description: "Access thousands of teaching materials and best practices"
    }
  ];

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium mb-4">
            <Award className="w-4 h-4 text-secondary" />
            <span>For Educators</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Empower Your <span className="gradient-text">Teaching</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, manage, and deliver exceptional learning experiences
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <Card 
              key={index} 
              className="glass-card border-0 hover-lift animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center mb-4">
                  <resource.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{resource.title}</h3>
                <p className="text-muted-foreground">{resource.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeacherResources;
