import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, CalendarDays, FileText, MessageSquare } from 'lucide-react';

const Classes = () => {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="glass-card p-6 md:p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Classes</h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Schedule */}
            <div className="glass-card rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-accent" />
                <h2 className="font-semibold">Schedule</h2>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span>Fri 5:00 PM</span>
                  <span className="text-muted-foreground">Calculus Review</span>
                </li>
                <li className="flex justify-between">
                  <span>Sat 10:00 AM</span>
                  <span className="text-muted-foreground">Spanish Conversation</span>
                </li>
                <li className="flex justify-between">
                  <span>Sun 3:00 PM</span>
                  <span className="text-muted-foreground">Web Dev Workshop</span>
                </li>
              </ul>
            </div>

            {/* Materials */}
            <div className="glass-card rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-secondary" />
                <h2 className="font-semibold">Materials</h2>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between hover:text-accent transition-colors cursor-pointer">
                  <span>Chain Rule Cheatsheet.pdf</span>
                  <span className="text-muted-foreground">128 KB</span>
                </li>
                <li className="flex justify-between hover:text-accent transition-colors cursor-pointer">
                  <span>Spanish Verbs Deck.apkg</span>
                  <span className="text-muted-foreground">2.3 MB</span>
                </li>
                <li className="flex justify-between hover:text-accent transition-colors cursor-pointer">
                  <span>Flexbox Guide.md</span>
                  <span className="text-muted-foreground">18 KB</span>
                </li>
              </ul>
            </div>

            {/* Discussion */}
            <div className="glass-card rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Discussion</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-xl glass-card">Q: Tips for remembering trig identities?</div>
                <div className="p-3 rounded-xl glass-card">A: Use triangles + practice; draw and recite.</div>
                <div className="p-3 rounded-xl glass-card">Q: Best resources for CSS grids?</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classes;