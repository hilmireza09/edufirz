import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-learning.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium">
              <Sparkles className="w-4 h-4 text-accent animate-glow" />
              <span>Transform Your Learning Journey</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Connecting{" "}
              <span className="gradient-text">
                Students & Teachers
              </span>
              {" "}for Better Learning
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              Empowering education through collaboration. Join our vibrant community where students discover, learn, and grow with dedicated teachers — all in one interactive platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                as="a"
                href="/signup"
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Sign Up
              </Button>
              <Button
                as="a"
                href="/login"
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 glass-card hover-lift"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Login
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold gradient-text">50K+</div>
                <div className="text-sm text-muted-foreground">Active Students</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-bold gradient-text">200+</div>
                <div className="text-sm text-muted-foreground">Expert Courses</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-bold gradient-text">4.9/5</div>
                <div className="text-sm text-muted-foreground">Student Rating</div>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div className="relative animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <div className="glass-card rounded-3xl overflow-hidden hover-lift">
              <img
                src={heroImage}
                alt="Students learning together"
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Floating badges */}
            <div className="absolute -top-6 -right-6 glass-card rounded-2xl p-4 animate-float">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-glow" />
                <span className="text-sm font-medium">Live Classes</span>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 glass-card rounded-2xl p-4 animate-float" style={{ animationDelay: "1s" }}>
              <div className="text-2xl font-bold gradient-text">100% Online</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
