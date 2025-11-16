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
      <FeaturedCourses />
      <PopularSubjects />
      <TeacherResources />
      <StudentAchievements />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;
