import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative py-16 px-4 mt-24">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">LearnHub</span>
            </div>
            <p className="text-muted-foreground">
              Empowering learners worldwide with quality education accessible anytime, anywhere.
            </p>
            <div className="flex gap-3">
              <Button size="icon" variant="outline" className="glass-card hover-lift">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="glass-card hover-lift">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="glass-card hover-lift">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="glass-card hover-lift">
                <Linkedin className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-muted-foreground hover:text-primary transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link to="/teachers" className="text-muted-foreground hover:text-primary transition-colors">
                  Become a Teacher
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to our newsletter for the latest courses and updates.
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="glass-card border-0"
              />
              <Button size="icon" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shrink-0">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 LearnHub. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
