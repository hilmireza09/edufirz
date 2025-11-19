import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import FlashcardEditor from '@/components/FlashcardEditor';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Card = {
  id?: string;
  front: string;
  back: string;
  hint: string;
};

type Deck = {
  id?: string;
  title: string;
  description: string;
  is_public: boolean;
  user_id: string;
  tags?: string[] | null;
  flashcards: Card[];
};

const CreateDeck = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [newDeck] = useState<Deck>({
    id: '',
    title: 'New Deck',
    description: '',
    is_public: false,
    user_id: user?.id || '',
    tags: [],
    flashcards: [],
  });

  const handleSave = (updatedDeck: Deck) => {
    navigate('/flashcards');
  };

  const handleCancel = () => {
    navigate('/flashcards');
  };

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-400/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[120px]" />
        </div>

        <Header />

        <main className="flex-1 p-4 md:p-8 z-10 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Back Button */}
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="glass-card hover:bg-white/40 dark:hover:bg-slate-800/60 text-foreground rounded-xl px-4 py-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] group border-white/20"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Flashcards
            </Button>

            {/* Page Header */}
            <div className="glass-card backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border-white/20 shadow-[0_0_40px_rgba(124,58,237,0.15)] rounded-3xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-primary to-purple-600 rounded-2xl shadow-lg shadow-primary/25">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Create New Deck
                  </h1>
                  <p className="text-muted-foreground text-base mt-1">
                    Build your flashcard collection - add deck details and cards all in one place
                  </p>
                </div>
              </div>
            </div>

            {/* Editor Container with glassmorphism */}
            <div className="glass-card backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border-white/20 shadow-[0_0_40px_rgba(124,58,237,0.15)] rounded-3xl p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Purple Glow Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-t-3xl opacity-75" />
              
              <FlashcardEditor
                deck={newDeck}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateDeck;
