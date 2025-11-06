import Hero from "@/components/Hero";
import FeaturedCourses from "@/components/FeaturedCourses";
import PopularSubjects from "@/components/PopularSubjects";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <FeaturedCourses />
      <PopularSubjects />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;
