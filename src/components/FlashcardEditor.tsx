import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Save, X, CreditCard, Tag } from 'lucide-react';
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          {deck.id ? 'Edit Deck' : 'Create New Deck'}
        </h2>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="glass-card border-white/20 hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm h-11 px-6 rounded-xl transition-all"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim() || tags.length === 0}
            className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white shadow-lg shadow-primary/25 h-11 px-6 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Deck
          </Button>
        </div>
      </div>

      {/* Deck Metadata Section */}
      <div className="glass-card backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg rounded-2xl p-6 md:p-8 space-y-6 animate-in fade-in-up duration-500">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Save className="h-5 w-5 text-primary" />
          </div>
          Deck Information
        </h3>
        
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Deck Title <span className="text-red-500">*</span></label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              placeholder="Enter deck title"
              className={`h-12 bg-white/50 dark:bg-slate-700/50 border-white/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl transition-all hover:bg-white/70 dark:hover:bg-slate-700/70 ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter deck description"
              rows={3}
              className="bg-white/50 dark:bg-slate-700/50 border-white/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none transition-all hover:bg-white/70 dark:hover:bg-slate-700/70"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className={`flex items-center space-x-3 p-4 glass-card backdrop-blur-sm bg-white/40 dark:bg-slate-700/40 border-white/20 rounded-xl ${userRole === 'student' ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input
                type="checkbox"
                id="public"
                checked={isPublic}
                onChange={(e) => userRole !== 'student' && setIsPublic(e.target.checked)}
                disabled={userRole === 'student'}
                className="h-5 w-5 rounded-lg border-2 border-primary/30 text-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:cursor-not-allowed"
              />
              <label htmlFor="public" className={`text-sm font-medium text-foreground ${userRole === 'student' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                Make this deck public {userRole === 'student' && '(Teachers only)'}
              </label>
            </div>
          </div>

          {/* Tags Section - Replaced with selection chips */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Select Tag <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-muted-foreground">
                (Choose one)
              </span>
            </label>
            <div className={`flex flex-wrap gap-2 p-4 glass-card backdrop-blur-sm bg-white/40 dark:bg-slate-700/40 border-white/20 rounded-xl ${errors.tags ? 'border-red-500/50 bg-red-500/5' : ''}`}>
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 
                      ${isSelected 
                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30 scale-105' 
                        : 'glass-card bg-white/50 dark:bg-slate-700/50 border border-white/20 text-foreground hover:bg-white/70 dark:hover:bg-slate-700/70 hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:border-primary/30'
                      }
                      active:scale-95
                    `}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            {errors.tags && <p className="text-xs text-red-500 pl-1">{errors.tags}</p>}
            {tags.length === 0 && !errors.tags && (
              <p className="text-xs text-muted-foreground pl-1">
                Click on tags above to categorize your deck
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Flashcards Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            Flashcards
            <span className="text-base font-normal text-muted-foreground">({cards.length} cards)</span>
          </h3>
        </div>
        
        {/* Add New Card Form */}
        <div className="glass-card backdrop-blur-xl bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 border-white/20 shadow-lg rounded-2xl p-6 md:p-8 animate-in fade-in-up duration-500" style={{ animationDelay: '100ms' }}>
          <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add New Card
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Front *</label>
              <Textarea
                value={newCard.front}
                onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                placeholder="Question or term"
                rows={4}
                className="bg-white/60 dark:bg-slate-800/60 border-white/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none transition-all hover:bg-white/80 dark:hover:bg-slate-800/80"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Back *</label>
              <Textarea
                value={newCard.back}
                onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                placeholder="Answer or definition"
                rows={4}
                className="bg-white/60 dark:bg-slate-800/60 border-white/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none transition-all hover:bg-white/80 dark:hover:bg-slate-800/80"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Hint (Optional)</label>
              <Textarea
                value={newCard.hint}
                onChange={(e) => setNewCard({ ...newCard, hint: e.target.value })}
                placeholder="Additional hint"
                rows={4}
                className="bg-white/60 dark:bg-slate-800/60 border-white/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none transition-all hover:bg-white/80 dark:hover:bg-slate-800/80"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={addCard} 
              disabled={!newCard.front.trim() || !newCard.back.trim()}
              className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white shadow-lg shadow-primary/25 h-11 px-6 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </div>
        </div>

        {/* Existing Cards List */}
        {cards.length > 0 ? (
          <div className="space-y-4">
            {cards.map((card, index) => (
              <div 
                key={index} 
                className="glass-card backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg rounded-2xl p-6 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 animate-in fade-in-up"
                style={{ animationDelay: `${(index + 2) * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-semibold text-muted-foreground">Card #{index + 1}</h5>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCard(index)}
                    className="glass-card border-red-200/50 text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/20 backdrop-blur-sm rounded-lg transition-all h-9 px-4"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Front</label>
                    <Textarea
                      value={card.front}
                      onChange={(e) => updateCard(index, 'front', e.target.value)}
                      rows={4}
                      className="bg-white/60 dark:bg-slate-700/60 border-white/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none transition-all hover:bg-white/80 dark:hover:bg-slate-700/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Back</label>
                    <Textarea
                      value={card.back}
                      onChange={(e) => updateCard(index, 'back', e.target.value)}
                      rows={4}
                      className="bg-white/60 dark:bg-slate-700/60 border-white/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none transition-all hover:bg-white/80 dark:hover:bg-slate-700/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Hint</label>
                    <Textarea
                      value={card.hint}
                      onChange={(e) => updateCard(index, 'hint', e.target.value)}
                      rows={4}
                      className="bg-white/60 dark:bg-slate-700/60 border-white/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none transition-all hover:bg-white/80 dark:hover:bg-slate-700/80"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card backdrop-blur-xl bg-white/40 dark:bg-slate-800/40 border-white/20 border-dashed rounded-2xl p-12 text-center animate-in fade-in-up duration-500" style={{ animationDelay: '200ms' }}>
            <div className="inline-flex p-4 bg-purple-100/50 dark:bg-purple-900/20 rounded-2xl mb-4">
              <CreditCard className="h-12 w-12 text-purple-500" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">No flashcards yet</h4>
            <p className="text-muted-foreground">Start adding cards using the form above to build your deck</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardEditor;