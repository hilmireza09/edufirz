import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import FlashcardEditor from '@/components/FlashcardEditor';

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
      // Wait for user and profile to be loaded to check permissions
      if (!user || !profile) return;
      
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
          // Check permissions
          const role = profile.role || 'student';
          const canEdit = role === 'admin' || deckData.user_id === user.id;

          if (!canEdit) {
            toast.error("You don't have permission to edit this deck");
            navigate('/flashcards');
            return;
          }

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
  }, [id, navigate, user, profile]);

  const handleSave = (updatedDeck: Deck) => {
    navigate('/flashcards');
  };

  const handleCancel = () => {
    navigate('/flashcards');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-background to-muted overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-gradient-to-br from-background to-muted">
          <div className="glass-card p-6 md:p-8 rounded-2xl">
            <FlashcardEditor
              deck={deck}
              onSave={handleSave}
              onCancel={handleCancel}
              userRole={userRole}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateDeck;
