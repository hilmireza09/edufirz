import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';

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
        
        <div className="glass-card p-12 rounded-2xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Classes
          </h1>
          <p className="text-lg text-muted-foreground">
            This feature is coming soon! Join and manage classes with your teachers and classmates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Classes;