import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Star, Users } from "lucide-react";
import mathImage from "@/assets/course-math.jpg";
import programmingImage from "@/assets/course-programming.jpg";
import languageImage from "@/assets/course-language.jpg";

const courses = [
  {
    id: 1,
    title: "Advanced Mathematics",
    description: "Master calculus, algebra, and geometry with expert instructors",
    image: mathImage,
    rating: 4.9,
    students: 2340,
    duration: "8 weeks",
    level: "Intermediate",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    title: "Web Development Bootcamp",
    description: "Learn HTML, CSS, JavaScript, and React from scratch",
    image: programmingImage,
    rating: 4.8,
    students: 3120,
    duration: "12 weeks",
    level: "Beginner",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    title: "Language Mastery",
    description: "Become fluent in Spanish, French, or Mandarin",
    image: languageImage,
    rating: 4.7,
    students: 1890,
    duration: "10 weeks",
    level: "All Levels",
    color: "from-orange-500 to-red-500",
  },
];

const FeaturedCourses = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Enhanced liquid glass background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-white/30 backdrop-blur-xl"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-white/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent"></div>
      </div>
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium mb-4">
            Popular Picks
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Featured <span className="gradient-text">Courses</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our most popular courses, carefully curated to help you achieve your learning goals
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <Card
              key={course.id}
              className="glass-card border-0 overflow-hidden hover-lift group animate-fade-in-up backdrop-blur-lg bg-white/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-20 mix-blend-overlay`} />
                <div className="absolute top-4 right-4 glass-card px-3 py-1 rounded-full text-sm font-medium bg-white/30 backdrop-blur-sm">
                  {course.level}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {course.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="font-medium">{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{course.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  Enroll Now
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="glass-card hover-lift bg-white/30 backdrop-blur-sm border-white/50">
            View All Courses
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;