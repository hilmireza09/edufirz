import { Card } from "@/components/ui/card";
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
];

const Testimonials = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 animate-fade-in-up">
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

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.name}
              className="glass-card border-0 p-8 hover-lift animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>
              
              <p className="text-foreground/90 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={`${testimonial.color} text-white font-semibold`}>
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
