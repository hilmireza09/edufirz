import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

type Card = {
  front: string;
  back: string;
};

const sampleDeck: Card[] = [
  { front: 'Derivative of x^2', back: '2x' },
  { front: 'Hola', back: 'Hello' },
  { front: 'H2O is called', back: 'Water' },
  { front: 'Capital of France', back: 'Paris' },
  { front: 'Photosynthesis equation', back: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂' },
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

  const reset = () => {
    setIndex(0);
    setFlipped(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        
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
            
            <div className="flex items-center gap-4">
              <div className="bg-muted px-4 py-2 rounded-lg">
                <span className="text-sm text-muted-foreground">Card</span>
                <span className="font-semibold ml-2">{index + 1} / {sampleDeck.length}</span>
              </div>
              <Button variant="outline" onClick={reset} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Flashcard Container */}
          <div className="flex justify-center my-12">
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
                    <p className="text-xl text-foreground">{card.front}</p>
                  </div>
                </div>
                
                {/* Back of card */}
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-accent/5 rounded-2xl border border-border flex items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden] p-6">
                  <div>
                    <span className="text-xs text-secondary font-semibold mb-2 block">ANSWER</span>
                    <p className="text-xl text-foreground">{card.back}</p>
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
              className="w-full sm:w-auto flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {sampleDeck.map((_, i) => (
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
        </div>
      </div>
    </div>
  );
};

export default Flashcards;