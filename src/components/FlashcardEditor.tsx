import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Save, X } from 'lucide-react';
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
  flashcards: Card[];
};

interface FlashcardEditorProps {
  deck: Deck;
  onSave: (updatedDeck: Deck) => void;
  onCancel: () => void;
}

const FlashcardEditor = ({ deck, onSave, onCancel }: FlashcardEditorProps) => {
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description);
  const [isPublic, setIsPublic] = useState(deck.is_public);
  const [cards, setCards] = useState<Card[]>(deck.flashcards || []);
  const [newCard, setNewCard] = useState({ front: '', back: '', hint: '' });

  const addCard = () => {
    if (newCard.front.trim() && newCard.back.trim()) {
      setCards([...cards, { ...newCard }]);
      setNewCard({ front: '', back: '', hint: '' });
    }
  };

  const removeCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const updateCard = (index: number, field: keyof Card, value: string) => {
    const updatedCards = [...cards];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setCards(updatedCards);
  };

  const handleSave = async () => {
    try {
      // Save deck
      const deckData = {
        title,
        description,
        is_public: isPublic,
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

      // Delete existing flashcards
      if (deck.id) {
        await supabase
          .from('flashcards')
          .delete()
          .eq('deck_id', deck.id);
      }

      // Insert new flashcards
      if (cards.length > 0) {
        const flashcardData = cards.map(card => ({
          deck_id: savedDeck.id,
          front: card.front,
          back: card.back,
          hint: card.hint,
        }));

        const { error } = await supabase
          .from('flashcards')
          .insert(flashcardData);

        if (error) throw error;
      }

      toast.success('Deck saved successfully');
      onSave({ ...savedDeck, flashcards: cards });
    } catch (error) {
      console.error('Error saving deck:', error);
      toast.error('Failed to save deck');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">
          {deck.id ? 'Edit Deck' : 'Create New Deck'}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            <Save className="h-4 w-4 mr-2" />
            Save Deck
          </Button>
        </div>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm border border-border">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Deck Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter deck title"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter deck description"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="public" className="text-sm font-medium text-foreground">
                Make this deck public
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Flashcards</h3>
        
        {/* Add new card form */}
        <Card className="bg-card/80 backdrop-blur-sm border border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Front</label>
                <Textarea
                  value={newCard.front}
                  onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                  placeholder="Question or term"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Back</label>
                <Textarea
                  value={newCard.back}
                  onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                  placeholder="Answer or definition"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Hint (Optional)</label>
                <Textarea
                  value={newCard.hint}
                  onChange={(e) => setNewCard({ ...newCard, hint: e.target.value })}
                  placeholder="Additional hint"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={addCard} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Card
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing cards list */}
        <div className="space-y-3">
          {cards.map((card, index) => (
            <Card key={index} className="bg-card/80 backdrop-blur-sm border border-border">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Front</label>
                    <Textarea
                      value={card.front}
                      onChange={(e) => updateCard(index, 'front', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Back</label>
                    <Textarea
                      value={card.back}
                      onChange={(e) => updateCard(index, 'back', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Hint</label>
                    <Textarea
                      value={card.hint}
                      onChange={(e) => updateCard(index, 'hint', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCard(index)}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashcardEditor;