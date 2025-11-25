import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Plus, X, CreditCard, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Predefined tags
const AVAILABLE_TAGS = [
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'History',
  'Geography',
  'Government',
  'Social',
  'Economics',
  'Arts',
  'Technology',
  'English',
  'Others'
];

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

interface FlashcardEditorProps {
  deck: Deck;
  onSave: (updatedDeck: Deck) => void;
  onCancel: () => void;
  userRole?: string;
}

const FlashcardEditor = ({ deck, onSave, onCancel, userRole = 'student' }: FlashcardEditorProps) => {
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description);
  const [isPublic, setIsPublic] = useState(deck.is_public);
  const [cards, setCards] = useState<Card[]>(deck.flashcards || []);
  const [newCard, setNewCard] = useState({ front: '', back: '', hint: '' });
  const [tags, setTags] = useState<string[]>(deck.tags || []);
  const [errors, setErrors] = useState<{ title?: string; tags?: string }>({});
  const originalCardIdsRef = useRef<string[]>([]);

  // Toggle tag selection (Single selection mode)
  const toggleTag = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) 
        ? [] // Deselect if already selected
        : [tag] // Select only this tag (replace previous)
    );
    // Clear tag error when user selects a tag
    if (errors.tags) {
      setErrors(prev => ({ ...prev, tags: undefined }));
    }
  };

  // Enforce private decks for students
  useEffect(() => {
    if (userRole === 'student') {
      setIsPublic(false);
    }
  }, [userRole]);

  useEffect(() => {
    originalCardIdsRef.current = (deck.flashcards || [])
      .map((c) => c.id)
      .filter((id): id is string => Boolean(id));
  }, [deck]);

  /**
   * Adds a new flashcard to the local editor state.
   */
  const addCard = () => {
    if (newCard.front.trim() && newCard.back.trim()) {
      setCards([...cards, { ...newCard }]);
      setNewCard({ front: '', back: '', hint: '' });
    }
  };

  /**
   * Removes a flashcard by index from the local editor state.
   */
  const removeCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  /**
   * Updates a specific field of a flashcard in the local editor state.
   */
  const updateCard = (index: number, field: keyof Card, value: string) => {
    const updatedCards = [...cards];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setCards(updatedCards);
  };

  /**
   * Persists deck metadata and performs per-card CRUD operations:
   * - Deletes removed cards
   * - Updates existing cards
   * - Inserts new cards
   */
  const handleSave = async () => {
    // Validation
    const newErrors: { title?: string; tags?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Deck title is required';
    }
    if (tags.length === 0) {
      newErrors.tags = 'Please select exactly one tag';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Save deck
      const deckData = {
        title,
        description,
        is_public: isPublic,
        tags,
      };

      let savedDeck;
      if (deck.id) {
        // Update existing deck
        const { data, error } = await supabase
          .from('decks')
          .update(deckData)
          .eq('id', deck.id)
          .select()
          .single();
        
        if (error) throw error;
        savedDeck = data;
      } else {
        // Create new deck
        const { data, error } = await supabase
          .from('decks')
          .insert([{ ...deckData, user_id: deck.user_id }])
          .select()
          .single();
        
        if (error) throw error;
        savedDeck = data;
      }
      // Compute CRUD sets for cards
      const currentCardsWithIndex = cards.map((c, idx) => ({ ...c, position: idx }));
      const currentIds = currentCardsWithIndex
        .map((c) => c.id)
        .filter((id): id is string => Boolean(id));
      const originalIds = originalCardIdsRef.current;

      const toDeleteIds = originalIds.filter((id) => !currentIds.includes(id));
      const toInsert = currentCardsWithIndex.filter((c) => !c.id);
      const toUpdate = currentCardsWithIndex.filter((c) => c.id);

      if (toDeleteIds.length > 0) {
        const { error: delError } = await supabase
          .from('flashcards')
          .delete()
          .in('id', toDeleteIds);
        if (delError) throw delError;
      }

      if (toUpdate.length > 0) {
        const updatePayload = toUpdate.map((c) => ({
          id: c.id,
          deck_id: savedDeck.id,
          front: c.front,
          back: c.back,
          hint: c.hint,
          position: c.position,
        }));
        const { error: upsertError } = await supabase
          .from('flashcards')
          .upsert(updatePayload, { onConflict: 'id' });
        if (upsertError) throw upsertError;
      }

      interface InsertedCard {
        id: string;
        front: string;
        back: string;
        hint: string;
      }
      
      let insertedCards: InsertedCard[] = [];
      if (toInsert.length > 0) {
        const insertPayload = toInsert.map((c) => ({
          deck_id: savedDeck.id,
          front: c.front,
          back: c.back,
          hint: c.hint,
          position: c.position,
        }));
        const { data: insertData, error: insertError } = await supabase
          .from('flashcards')
          .insert(insertPayload)
          .select();
        if (insertError) throw insertError;
        insertedCards = insertData || [];
      }

      toast.success('Deck saved successfully');
      const finalCards = [
        ...toUpdate.map((c) => ({ id: c.id as string, front: c.front, back: c.back, hint: c.hint })),
        ...insertedCards.map((c) => ({ id: c.id, front: c.front, back: c.back, hint: c.hint })),
      ];
      onSave({ ...savedDeck, flashcards: finalCards });
    } catch (error) {
      console.error('Error saving deck:', error);
      toast.error('Failed to save deck');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-6 border border-border/50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {deck.id ? '✏️ Edit Deck' : '✨ Create New Deck'}
            </h2>
            <p className="text-muted-foreground">
              Build engaging flashcard collections for effective learning
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="border-border hover:bg-accent"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!title.trim() || tags.length === 0}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Deck
            </Button>
          </div>
        </div>
      </div>

      {/* Deck Details Card */}
      <Card className="bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
        <CardContent className="p-8">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Deck Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Deck Title</label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
                }}
                placeholder="Enter an engaging deck title..."
                className={`text-lg h-12 bg-background/50 border-border/50 focus:border-primary/50 ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Provide a brief description of this deck..."
                className="resize-none bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                className="w-full h-10 px-3 py-2 rounded-md bg-background/50 border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                value={tags[0] || ''}
                onChange={(e) => {
                  setTags(e.target.value ? [e.target.value] : []);
                  if (errors.tags) setErrors(prev => ({ ...prev, tags: undefined }));
                }}
              >
                <option value="">Select a category</option>
                {AVAILABLE_TAGS.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              {errors.tags && <p className="text-xs text-red-500 mt-1">{errors.tags}</p>}
            </div>
            <div className="flex items-center space-x-3 pt-8">
              <input
                type="checkbox"
                id="public"
                checked={isPublic}
                onChange={(e) => userRole !== 'student' && setIsPublic(e.target.checked)}
                disabled={userRole === 'student'}
                className="h-5 w-5 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:cursor-not-allowed"
              />
              <label htmlFor="public" className={`text-sm font-medium text-foreground ${userRole === 'student' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                Make this deck public {userRole === 'student' && '(Teachers only)'}
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Flashcards
          </h3>
          <Button 
            type="button" 
            onClick={addCard}
            disabled={!newCard.front.trim() || !newCard.back.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Card
          </Button>
        </div>

        {/* Add New Card Form */}
        <Card className="bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
          <CardContent className="p-6">
            <h4 className="text-base font-semibold mb-4">Add New Card</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Front *</label>
                <Textarea
                  value={newCard.front}
                  onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                  placeholder="Question or term"
                  rows={3}
                  className="resize-none bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Back *</label>
                <Textarea
                  value={newCard.back}
                  onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                  placeholder="Answer or definition"
                  rows={3}
                  className="resize-none bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Hint (Optional)</label>
                <Textarea
                  value={newCard.hint}
                  onChange={(e) => setNewCard({ ...newCard, hint: e.target.value })}
                  placeholder="Additional hint"
                  rows={3}
                  className="resize-none bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Cards List */}
        {cards.length === 0 ? (
          <div className="text-center py-12 bg-card/50 rounded-2xl border-2 border-dashed border-border">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first flashcard</p>
            <Button 
              type="button" 
              onClick={addCard}
              disabled={!newCard.front.trim() || !newCard.back.trim()}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Card
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card, index) => (
              <Card key={index} className="bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-semibold text-muted-foreground">Card #{index + 1}</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCard(index)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Front</label>
                      <Textarea
                        value={card.front}
                        onChange={(e) => updateCard(index, 'front', e.target.value)}
                        rows={3}
                        className="resize-none bg-background/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Back</label>
                      <Textarea
                        value={card.back}
                        onChange={(e) => updateCard(index, 'back', e.target.value)}
                        rows={3}
                        className="resize-none bg-background/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Hint</label>
                      <Textarea
                        value={card.hint}
                        onChange={(e) => updateCard(index, 'hint', e.target.value)}
                        rows={3}
                        className="resize-none bg-background/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardEditor;