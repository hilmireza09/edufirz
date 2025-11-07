import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GraduationCap } from 'lucide-react';

type Question = {
  prompt: string;
  options: string[];
  answerIndex: number;
};

const questions: Question[] = [
  { prompt: 'What is 3 * 4?', options: ['7', '12', '14', '18'], answerIndex: 1 },
  { prompt: 'Select the noun:', options: ['quickly', 'run', 'teacher', 'blue'], answerIndex: 2 },
  { prompt: 'H2O is the chemical formula for:', options: ['Oxygen', 'Hydrogen', 'Water', 'Salt'], answerIndex: 2 },
];

const Quizzes = () => {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const total = questions.length;
  const q = questions[idx];
  const progress = useMemo(() => Math.round(((idx) / total) * 100), [idx, total]);

  const submit = () => {
    if (selected === null) return;
    const correct = selected === q.answerIndex;
    if (correct) setScore((s) => s + 1);
    // Move to next after short delay
    setTimeout(() => {
      setSelected(null);
      setIdx((i) => Math.min(i + 1, total));
    }, 600);
  };

  const restart = () => {
    setIdx(0);
    setSelected(null);
    setScore(0);
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">Quizzes</h1>
            </div>
            <div className="text-sm text-muted-foreground">Score: {score} / {total}</div>
          </div>

          {/* Progress */}
          <div className="w-full h-2 bg-border/60 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-gradient-to-r from-secondary to-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>

          {idx < total ? (
            <div className="space-y-6">
              <p className="text-lg md:text-xl font-medium">{q.prompt}</p>
              <div className="grid gap-3">
                {q.options.map((opt, i) => {
                  const isSelected = selected === i;
                  const isCorrect = selected !== null && i === q.answerIndex;
                  const isWrong = selected !== null && i === selected && i !== q.answerIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`text-left p-4 rounded-xl transition-colors border ${
                        isCorrect
                          ? 'bg-green-500/15 border-green-500/40'
                          : isWrong
                          ? 'bg-red-500/15 border-red-500/40'
                          : isSelected
                          ? 'glass-card border-white/30'
                          : 'glass-card border-white/20 hover:border-white/40'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" className="glass-card" onClick={() => setSelected(null)}>Clear</Button>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90" onClick={submit} disabled={selected === null}>Submit</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-2xl font-semibold mb-2">Great job!</p>
              <p className="text-muted-foreground mb-6">You scored {score} out of {total}.</p>
              <Button onClick={restart} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">Try Again</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quizzes;