import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash, GripVertical, CheckSquare, Circle, FileText, Type, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type QuestionType = 'multiple_choice' | 'checkbox' | 'essay' | 'fill_in_blank' | 'true_false';

export type QuizQuestion = {
  id?: string;
  question: string;
  options: string[] | null;
  correct_answer: string;
  correct_answers?: string[]; // For checkbox questions
  explanation: string | null;
  points: number | null;
  order_index: number | null;
  type: QuestionType;
};

type QuestionEditorProps = {
  question: QuizQuestion;
  index: number;
  onUpdate: (index: number, field: keyof QuizQuestion, value: string | string[] | number | null | undefined) => void;
  onRemove: (index: number) => void;
};

const questionTypeConfig = {
  multiple_choice: {
    icon: Circle,
    label: 'Multiple Choice',
    description: 'Single correct answer from multiple options',
    color: 'bg-blue-500/10 text-blue-600 border-blue-200',
  },
  checkbox: {
    icon: CheckSquare,
    label: 'Checkbox',
    description: 'Multiple correct answers possible',
    color: 'bg-purple-500/10 text-purple-600 border-purple-200',
  },
  essay: {
    icon: FileText,
    label: 'Essay',
    description: 'Long-form written response',
    color: 'bg-green-500/10 text-green-600 border-green-200',
  },
  fill_in_blank: {
    icon: Type,
    label: 'Fill in the Blank',
    description: 'Short answer completion',
    color: 'bg-orange-500/10 text-orange-600 border-orange-200',
  },
  true_false: {
    icon: Check,
    label: 'True/False',
    description: 'Binary choice question',
    color: 'bg-pink-500/10 text-pink-600 border-pink-200',
  },
};

export const QuestionEditor = ({ question, index, onUpdate, onRemove }: QuestionEditorProps) => {
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(
    new Set(question.correct_answers?.map(ans => question.options?.indexOf(ans) || -1).filter(i => i !== -1) || [])
  );

  const handleOptionChange = (optionIndex: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    onUpdate(index, 'options', newOptions);
  };

  const addOption = () => {
    const newOptions = [...(question.options || []), ''];
    onUpdate(index, 'options', newOptions);
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = (question.options || []).filter((_, i) => i !== optionIndex);
    onUpdate(index, 'options', newOptions);
    
    // Update selected options for checkbox
    if (question.type === 'checkbox') {
      const newSelected = new Set<number>();
      selectedOptions.forEach(idx => {
        if (idx < optionIndex) newSelected.add(idx);
        else if (idx > optionIndex) newSelected.add(idx - 1);
      });
      setSelectedOptions(newSelected);
      updateCheckboxAnswers(newSelected, newOptions);
    }
  };

  const updateCheckboxAnswers = (selected: Set<number>, options: string[]) => {
    const correctAnswers = Array.from(selected).map(idx => options[idx]).filter(Boolean);
    onUpdate(index, 'correct_answers', correctAnswers);
    onUpdate(index, 'correct_answer', correctAnswers.join('|||')); // Store as delimited string for compatibility
  };

  const toggleCheckboxOption = (optionIndex: number) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(optionIndex)) {
      newSelected.delete(optionIndex);
    } else {
      newSelected.add(optionIndex);
    }
    setSelectedOptions(newSelected);
    updateCheckboxAnswers(newSelected, question.options || []);
  };

  const config = questionTypeConfig[question.type];
  const Icon = config.icon;

  return (
    <Card className="group relative bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm border-2 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
      {/* Drag Handle */}
      <div className="absolute left-2 top-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <CardContent className="p-6 pl-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center border transition-transform group-hover:scale-110`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Question {index + 1}</h4>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={() => onRemove(index)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>

        {/* Question Type Selector */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-3 block">Question Type</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(questionTypeConfig).map(([type, typeConfig]) => {
              const TypeIcon = typeConfig.icon;
              return (
                <button
                  key={type}
                  onClick={() => {
                    onUpdate(index, 'type', type);
                    // Reset answers when type changes
                    if (type !== 'checkbox') {
                      onUpdate(index, 'correct_answers', undefined);
                      setSelectedOptions(new Set());
                    }
                    if (type === 'true_false') {
                      onUpdate(index, 'options', ['True', 'False']);
                    }
                  }}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    question.type === type
                      ? typeConfig.color + ' border-current shadow-md'
                      : 'bg-card hover:bg-accent border-border'
                  }`}
                >
                  <TypeIcon className="h-5 w-5" />
                  <span className="text-xs font-medium text-center leading-tight">{typeConfig.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Question Text</label>
          <Textarea
            value={question.question}
            onChange={(e) => onUpdate(index, 'question', e.target.value)}
            placeholder="Enter your question here..."
            rows={3}
            className="resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Dynamic Content Based on Question Type */}
        <div className="space-y-6">
          {/* Multiple Choice & Checkbox */}
          {(question.type === 'multiple_choice' || question.type === 'checkbox') && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">
                  Answer Options {question.type === 'checkbox' && <Badge variant="secondary" className="ml-2">Select all correct</Badge>}
                </label>
                <Button
                  onClick={addOption}
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-2">
                {(question.options || []).map((option, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2 group/option">
                    {question.type === 'checkbox' ? (
                      <button
                        type="button"
                        onClick={() => toggleCheckboxOption(optIdx)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
                          selectedOptions.has(optIdx)
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30 hover:border-primary/50'
                        }`}
                      >
                        {selectedOptions.has(optIdx) && <Check className="h-4 w-4" />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUpdate(index, 'correct_answer', option)}
                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all ${
                          question.correct_answer === option
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground/30 hover:border-primary/50'
                        }`}
                      >
                        {question.correct_answer === option && (
                          <div className="w-2 h-2 bg-primary-foreground rounded-full m-auto" />
                        )}
                      </button>
                    )}
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                      placeholder={`Option ${optIdx + 1}`}
                      className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover/option:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeOption(optIdx)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {question.type === 'checkbox' && selectedOptions.size === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                  ⚠️ Please select at least one correct answer
                </p>
              )}
            </div>
          )}

          {/* True/False */}
          {question.type === 'true_false' && (
            <div>
              <label className="text-sm font-medium mb-3 block">Correct Answer</label>
              <div className="grid grid-cols-2 gap-3">
                {['True', 'False'].map((answer) => (
                  <button
                    key={answer}
                    onClick={() => onUpdate(index, 'correct_answer', answer)}
                    className={`p-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                      question.correct_answer === answer
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-card hover:bg-accent border-border'
                    }`}
                  >
                    {answer}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Essay */}
          {question.type === 'essay' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Grading Rubric / Key Points</label>
              <Textarea
                value={question.correct_answer}
                onChange={(e) => onUpdate(index, 'correct_answer', e.target.value)}
                placeholder="Enter key points or grading criteria for this essay question..."
                rows={4}
                className="resize-none bg-background/50 border-border/50 focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This will be used as a reference for manual grading
              </p>
            </div>
          )}

          {/* Fill in the Blank */}
          {question.type === 'fill_in_blank' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Acceptable Answers</label>
              <Input
                value={question.correct_answer}
                onChange={(e) => onUpdate(index, 'correct_answer', e.target.value)}
                placeholder="Enter acceptable answers separated by | (e.g., answer1|answer2|answer3)"
                className="bg-background/50 border-border/50 focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-2">
                💡 Separate multiple acceptable answers with | (case-insensitive matching)
              </p>
            </div>
          )}

          {/* Points and Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div>
              <label className="text-sm font-medium mb-2 block">Points</label>
              <Input
                type="number"
                value={question.points || 1}
                onChange={(e) => onUpdate(index, 'points', Number(e.target.value))}
                min={0}
                className="bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-2 block">Explanation (optional)</label>
              <Input
                value={question.explanation || ''}
                onChange={(e) => onUpdate(index, 'explanation', e.target.value)}
                placeholder="Explain the correct answer..."
                className="bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
