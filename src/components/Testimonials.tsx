import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Computer Science Student",
    content: "This platform completely transformed how I learn. The interactive lessons and supportive community helped me land my dream internship!",
    rating: 5,
    avatar: "SC",
    color: "bg-blue-500",
  },
  {
    name: "Marcus Johnson",
    role: "Mathematics Enthusiast",
    content: "I've tried many learning platforms, but this one stands out. The quality of courses and the engaging format make learning genuinely enjoyable.",
    rating: 5,
    avatar: "MJ",
    color: "bg-purple-500",
  },
  {
    name: "Emily Rodriguez",
    role: "Language Learner",
    content: "Learning Spanish here has been amazing! The structured approach and practical exercises have me speaking confidently in just 3 months.",
    rating: 5,
    avatar: "ER",
    color: "bg-pink-500",
  },
  {
    name: "David Kim",
    role: "Medical Student",
    content: "The anatomy quizzes are a lifesaver! Visual learning has never been this effective for memorizing complex structures.",
    rating: 5,
    avatar: "DK",
    color: "bg-green-500",
  },
  {
    name: "Lisa Wang",
    role: "High School Teacher",
    content: "I use this for my AP classes. The students love the gamified elements and I love the detailed progress tracking.",
    rating: 5,
    avatar: "LW",
    color: "bg-indigo-500",
  },
  {
    name: "James Wilson",
    role: "History Buff",
    content: "The depth of the history courses is impressive. I'm learning so much about ancient civilizations in a way that sticks.",
    rating: 5,
    avatar: "JW",
    color: "bg-yellow-500",
  },
  {
    name: "Sophie Martin",
    role: "Art Student",
    content: "Beautiful interface and inspiring content. It's a joy to use every day for both study and inspiration.",
    rating: 5,
    avatar: "SM",
    color: "bg-rose-500",
  },
  {
    name: "Alex Thompson",
    role: "Physics Major",
    content: "Complex concepts explained simply. The interactive simulations are brilliant for understanding mechanics.",
    rating: 5,
    avatar: "AT",
    color: "bg-teal-500",
  },
  {
    name: "Maria Garcia",
    role: "Nursing Student",
    content: "Great for studying on the go. The mobile experience is seamless and helps me squeeze in study sessions anywhere.",
    rating: 5,
    avatar: "MG",
    color: "bg-orange-500",
  },
  {
    name: "Robert Chen",
    role: "Lifelong Learner",
    content: "Never too old to learn! I'm enjoying the philosophy courses immensely. The community discussions are very enlightening.",
    rating: 5,
    avatar: "RC",
    color: "bg-slate-500",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 mb-16">
        <div className="text-center animate-fade-in-up">
          <div className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium mb-4">
            Success Stories
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What Students <span className="gradient-text">Say</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of successful learners who have transformed their lives through our platform
          </p>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        {/* Gradient masks for smooth fade out at edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        
        <div className="flex gap-6 animate-marquee w-max px-4 hover:[animation-play-state:paused]">
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <div
              key={`${testimonial.name}-${index}`}
              className="p-8 w-[400px] flex-shrink-0 rounded-3xl bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:bg-white/20 dark:hover:bg-slate-900/20 transition-all duration-500"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>
              
              <p className="text-foreground/90 mb-6 leading-relaxed line-clamp-3">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-0">
                  <AvatarFallback className={`${testimonial.color} text-white font-semibold`}>
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
