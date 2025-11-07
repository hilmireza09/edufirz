import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GraduationCap } from 'lucide-react';

const Quizzes = () => {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="glass-card p-12 rounded-2xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Quizzes
          </h1>
          <p className="text-lg text-muted-foreground">
            This feature is coming soon! Test your knowledge with interactive quizzes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Quizzes;