import Hero from "@/components/Hero";
import FeaturedCourses from "@/components/FeaturedCourses";
import PopularSubjects from "@/components/PopularSubjects";
import TeacherResources from "@/components/TeacherResources";
import StudentAchievements from "@/components/StudentAchievements";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <div className="relative">
        {/* Liquid glass background effect */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-white/80 backdrop-blur-xl"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-200/40 to-white/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-gradient-to-br from-white/40 to-purple-100/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-gradient-to-br from-purple-100/30 to-white/20 rounded-full blur-3xl"></div>
        </div>
        <FeaturedCourses />
        <PopularSubjects />
        <TeacherResources />
        <StudentAchievements />
        <Testimonials />
      </div>
      <Footer />
    </div>
  );
};

export default Index;