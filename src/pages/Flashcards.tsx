import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard } from 'lucide-react';

type Card = {
  front: string;
  back: string;
};

const sampleDeck: Card[] = [
  { front: 'Derivative of x^2', back: '2x' },
  { front: 'Hola', back: 'Hello' },
  { front: 'H2O is called', back: 'Water' },
];

const Flashcards = () => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = sampleDeck[index];

  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % sampleDeck.length);
  };

  const prev = () => {
    setFlipped(false);
    setIndex((i) => (i - 1 + sampleDeck.length) % sampleDeck.length);
  };

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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">Flashcards</h1>
            </div>
            <div className="text-sm text-muted-foreground">Card {index + 1} / {sampleDeck.length}</div>
          </div>

          {/* Flip card */}
          <div className="relative mx-auto w-full max-w-xl h-64 [perspective:1000px] select-none mb-6">
            <div
              className={`absolute inset-0 rounded-2xl glass-card border border-white/20 flex items-center justify-center text-xl font-semibold [transform-style:preserve-3d] transition-transform duration-500 ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
              onClick={() => setFlipped((f) => !f)}
            >
              <div className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden]">
                {card.front}
              </div>
              <div className="absolute inset-0 flex items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                {card.back}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" className="glass-card" onClick={prev}>Previous</Button>
            <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90" onClick={next}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;