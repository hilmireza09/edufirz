import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="relative py-16 px-4 mt-24 bg-gradient-to-r from-purple-900 to-purple-800 text-white">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <Logo variant="light" width={140} height={40} />
            </Link>
            <p className="text-purple-100">
              Empowering learners worldwide with quality education accessible anytime, anywhere.
            </p>
            <div className="flex gap-3">
              <Button size="icon" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                <Linkedin className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-purple-100 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-purple-100 hover:text-white transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link to="/teachers" className="text-purple-100 hover:text-white transition-colors">
                  Become a Teacher
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-purple-100 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="text-purple-100 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-purple-100 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-purple-100 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-purple-100 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Stay Updated</h3>
            <p className="text-purple-100 mb-4">
              Subscribe to our newsletter for the latest courses and updates.
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-200"
              />
              <Button size="icon" className="bg-gradient-to-r from-white to-purple-100 hover:opacity-90 shrink-0">
                <Mail className="w-4 h-4 text-purple-900" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-purple-200 text-sm">
            © 2024 LearnHub. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/terms" className="text-purple-200 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/login" className="text-purple-200 hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;