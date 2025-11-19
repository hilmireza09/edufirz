import { Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="w-full mt-auto z-50 relative">
      <div className="w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-t border-white/20 dark:border-slate-800/50 shadow-[0_-5px_20px_rgba(124,58,237,0.15)]">
        <div className="container mx-auto max-w-7xl px-4 h-20 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="block hover:opacity-80 transition-opacity">
              <Logo width={120} height={35} />
            </Link>
          </div>

          {/* Center: Copyright */}
          <div className="hidden md:block text-sm text-muted-foreground font-medium">
            © 2025 EduFirz — All Rights Reserved.
          </div>

          {/* Right: LinkedIn */}
          <div className="flex-shrink-0">
            <a 
              href="https://www.linkedin.com/in/hilmi-reza/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors hidden sm:inline-block">
                Connect with me on LinkedIn
              </span>
              <div className="p-2 rounded-full bg-primary/5 border border-primary/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                <Linkedin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
              </div>
            </a>
          </div>
        </div>
        
        {/* Mobile Copyright (visible only on small screens) */}
        <div className="md:hidden pb-4 text-center text-xs text-muted-foreground">
          © 2025 EduFirz — All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;