import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import FlashcardEditor from '@/components/FlashcardEditor';
import { ArrowLeft, Sparkles, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [userRole, setUserRole] = useState<string>('student');
  const [loading, setLoading] = useState(!!id);
  const [deck, setDeck] = useState<Deck>({
    id: '',
    title: 'New Deck',
    description: '',
    is_public: false,
    user_id: user?.id || '',
    tags: [],
    flashcards: [],
  });

  useEffect(() => {
    if (profile) {
      setUserRole(profile.role || 'student');
    }
  }, [profile]);

  useEffect(() => {
    const fetchDeck = async () => {
      if (!id) return;
      
      try {
        const { data: deckData, error: deckError } = await supabase
          .from('decks')
          .select(`
            *,
            flashcards (*)
          `)
          .eq('id', id)
          .single();

        if (deckError) throw deckError;

        if (deckData) {
          // Sort flashcards by position or created_at
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sortedCards = (deckData.flashcards || []).sort((a: any, b: any) => {
            if (a.position !== null && b.position !== null) return a.position - b.position;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });

          setDeck({
            id: deckData.id,
            title: deckData.title,
            description: deckData.description || '',
            is_public: deckData.is_public || false,
            user_id: deckData.user_id,
            tags: deckData.tags || [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            flashcards: sortedCards.map((c: any) => ({
              id: c.id,
              front: c.front,
              back: c.back,
              hint: c.hint || ''
            }))
          });
        }
      } catch (error) {
        console.error('Error fetching deck:', error);
        toast.error('Failed to load deck');
        navigate('/flashcards');
      } finally {
        setLoading(false);
      }
    };

    fetchDeck();
  }, [id, navigate]);

  const handleSave = (updatedDeck: Deck) => {
    navigate('/flashcards');
  };

  const handleCancel = () => {
    navigate('/flashcards');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                  {id ? <Edit className="h-8 w-8 text-white" /> : <Sparkles className="h-8 w-8 text-white" />}
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {id ? 'Edit Deck' : 'Create New Deck'}
                  </h1>
                  <p className="text-muted-foreground text-base mt-1">
                    {id ? 'Update your flashcard collection details and cards' : 'Build your flashcard collection - add deck details and cards all in one place'}
                  </p>
                </div>
              </div>
            </div>

            {/* Editor Container with glassmorphism */}
            <div className="glass-card backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border-white/20 shadow-[0_0_40px_rgba(124,58,237,0.15)] rounded-3xl p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Purple Glow Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-t-3xl opacity-75" />
              
              <FlashcardEditor
                deck={deck}
                onSave={handleSave}
                onCancel={handleCancel}
                userRole={userRole}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateDeck;
