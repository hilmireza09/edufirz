import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, ChevronLeft, ChevronRight, RotateCcw, Plus, Edit, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FlashcardEditor from '@/components/FlashcardEditor';

type Card = {
  id: string;
  front: string;
  back: string;
  hint: string | null;
};

type Deck = {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
  flashcards: Card[];
};

const Flashcards = () => {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [userRole, setUserRole] = useState<string>('student');
  const [loading, setLoading] = useState(true);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setUserRole(data.role || 'student');
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [user]);

  // Fetch decks based on user role
  useEffect(() => {
    const fetchDecks = async () => {
      if (!user || loading) return;
      
      try {
        let query = supabase
          .from('decks')
          .select(`
            id, 
            title, 
            description, 
            is_public, 
            user_id,
            flashcards (
              id, 
              front, 
              back, 
              hint
            )
          `)
          .is('deleted_at', null);

        // Role-based deck access
        if (userRole === 'student') {
          // Students see their own decks + public decks
          query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
        } else if (userRole === 'teacher') {
          // Teachers see their own decks + public decks
          query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
        }
        // Admins see all decks (handled by RLS)

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        
        const decksData = data.map(deck => ({
          ...deck,
          flashcards: Array.isArray(deck.flashcards) ? deck.flashcards : []
        }));

        setDecks(decksData);
        if (decksData.length > 0 && !selectedDeck && !editingDeck) {
          setSelectedDeck(decksData[0]);
        }
      } catch (error) {
        console.error('Error fetching decks:', error);
        toast.error('Failed to load flashcards');
      }
    };

    fetchDecks();
  }, [user, userRole, loading, selectedDeck, editingDeck]);

  const handleDeckSelect = (deck: Deck) => {
    setSelectedDeck(deck);
    setIndex(0);
    setFlipped(false);
  };

  const handleCreateDeck = () => {
    if (!user) return;
    
    const newDeck: any = {
      title: 'New Deck',
      description: '',
      is_public: false,
      user_id: user.id,
      flashcards: [],
    };
    
    setEditingDeck(newDeck);
    setSelectedDeck(null);
  };

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setSelectedDeck(null);
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!user) return;
    
    // Check permissions
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    
    const canDelete = 
      userRole === 'admin' || 
      deck.user_id === user.id || 
      (userRole === 'teacher' && deck.user_id === user.id);
    
    if (!canDelete) {
      toast.error('You do not have permission to delete this deck');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('decks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deckId);

      if (error) throw error;
      
      setDecks(decks.filter(d => d.id !== deckId));
      if (selectedDeck?.id === deckId) {
        setSelectedDeck(decks.length > 1 ? decks[0] : null);
      }
      toast.success('Deck deleted successfully');
    } catch (error) {
      console.error('Error deleting deck:', error);
      toast.error('Failed to delete deck');
    }
  };

  const handleSaveDeck = (updatedDeck: Deck) => {
    // Update the decks list with the saved deck
    const updatedDecks = decks.map(deck => 
      deck.id === updatedDeck.id ? updatedDeck : deck
    );
    
    // If it's a new deck, add it to the list
    if (!decks.some(deck => deck.id === updatedDeck.id)) {
      updatedDecks.unshift(updatedDeck);
    }
    
    setDecks(updatedDecks);
    setSelectedDeck(updatedDeck);
    setEditingDeck(null);
  };

  const next = () => {
    if (!selectedDeck) return;
    setFlipped(false);
    setIndex((i) => (i + 1) % selectedDeck.flashcards.length);
  };

  const prev = () => {
    if (!selectedDeck) return;
    setFlipped(false);
    setIndex((i) => (i - 1 + selectedDeck.flashcards.length) % selectedDeck.flashcards.length);
  };

  const reset = () => {
    setIndex(0);
    setFlipped(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (editingDeck) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <FlashcardEditor 
            deck={editingDeck} 
            onSave={handleSaveDeck}
            onCancel={() => setEditingDeck(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link to="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          
          {(userRole === 'teacher' || userRole === 'admin' || userRole === 'student') && (
            <Button onClick={handleCreateDeck} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Deck
            </Button>
          )}
        </div>
        
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-border shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Flashcards</h1>
                <p className="text-muted-foreground">Study and memorize key concepts</p>
              </div>
            </div>
            
            {selectedDeck && (
              <div className="flex items-center gap-4">
                <div className="bg-muted px-4 py-2 rounded-lg">
                  <span className="text-sm text-muted-foreground">Card</span>
                  <span className="font-semibold ml-2">{index + 1} / {selectedDeck.flashcards.length}</span>
                </div>
                <Button variant="outline" onClick={reset} className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            )}
          </div>

          {decks.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No Flashcard Decks</h2>
              <p className="text-muted-foreground mb-6">Create your first deck to get started</p>
              <Button onClick={handleCreateDeck} className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Create Deck
              </Button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Deck List */}
              <div className="lg:w-1/3">
                <h2 className="text-lg font-semibold text-foreground mb-4">Your Decks</h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {decks.map((deck) => (
                    <div 
                      key={deck.id}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedDeck?.id === deck.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-accent'
                      }`}
                      onClick={() => handleDeckSelect(deck)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-foreground">{deck.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {deck.flashcards.length} cards
                            {deck.is_public && <span className="ml-2 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">Public</span>}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {(userRole === 'admin' || deck.user_id === user?.id || (userRole === 'teacher' && deck.user_id === user?.id)) && (
                            <>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditDeck(deck);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDeck(deck.id);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {deck.description && (
                        <p className="text-sm text-muted-foreground mt-2">{deck.description}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        {deck.user_id === user?.id ? 'Your deck' : 'Shared deck'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flashcard Viewer */}
              <div className="lg:w-2/3">
                {selectedDeck ? (
                  <>
                    <div className="mb-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-foreground">{selectedDeck.title}</h2>
                        <div className="flex gap-2">
                          {selectedDeck.is_public && (
                            <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded">Public</span>
                          )}
                          {selectedDeck.user_id !== user?.id && (
                            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">Shared</span>
                          )}
                        </div>
                      </div>
                      {selectedDeck.description && (
                        <p className="text-muted-foreground mt-1">{selectedDeck.description}</p>
                      )}
                    </div>

                    {selectedDeck.flashcards.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">This deck has no flashcards yet</p>
                        {(userRole === 'admin' || selectedDeck.user_id === user?.id || (userRole === 'teacher' && selectedDeck.user_id === user?.id)) && (
                          <Button 
                            onClick={() => handleEditDeck(selectedDeck)} 
                            className="mt-4 flex items-center gap-2 mx-auto"
                          >
                            <Plus className="h-4 w-4" />
                            Add Cards
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Flashcard Container */}
                        <div className="flex justify-center my-8">
                          <div 
                            className="relative w-full max-w-lg h-64 cursor-pointer [perspective:1000px] select-none"
                            onClick={() => setFlipped(!flipped)}
                          >
                            <div
                              className={`absolute inset-0 rounded-2xl shadow-lg p-8 flex items-center justify-center text-center text-lg font-medium transition-all duration-500 [transform-style:preserve-3d] ${
                                flipped ? '[transform:rotateY(180deg)]' : ''
                              }`}
                            >
                              {/* Front of card */}
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-border flex items-center justify-center [backface-visibility:hidden] p-6">
                                <div>
                                  <span className="text-xs text-primary font-semibold mb-2 block">QUESTION</span>
                                  <p className="text-xl text-foreground">{selectedDeck.flashcards[index]?.front || ''}</p>
                                </div>
                              </div>
                              
                              {/* Back of card */}
                              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-accent/5 rounded-2xl border border-border flex items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden] p-6">
                                <div>
                                  <span className="text-xs text-secondary font-semibold mb-2 block">ANSWER</span>
                                  <p className="text-xl text-foreground">{selectedDeck.flashcards[index]?.back || ''}</p>
                                  {selectedDeck.flashcards[index]?.hint && (
                                    <p className="text-sm text-muted-foreground mt-4">
                                      <span className="font-medium">Hint:</span> {selectedDeck.flashcards[index]?.hint}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                          <Button 
                            variant="outline" 
                            onClick={prev} 
                            disabled={selectedDeck.flashcards.length <= 1}
                            className="w-full sm:w-auto flex items-center gap-2"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          
                          <Button 
                            onClick={() => setFlipped(!flipped)} 
                            className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                          >
                            {flipped ? 'Show Question' : 'Show Answer'}
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            onClick={next} 
                            disabled={selectedDeck.flashcards.length <= 1}
                            className="w-full sm:w-auto flex items-center gap-2"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Progress indicators */}
                        <div className="flex justify-center mt-8">
                          <div className="flex gap-2">
                            {selectedDeck.flashcards.map((_, i) => (
                              <div 
                                key={i}
                                className={`w-3 h-3 rounded-full ${
                                  i === index 
                                    ? 'bg-primary w-6' 
                                    : i < index 
                                      ? 'bg-primary/50' 
                                      : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">Select a Deck</h2>
                    <p className="text-muted-foreground">Choose a deck from the list to start studying</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Flashcards;