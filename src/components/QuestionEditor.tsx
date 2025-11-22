import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash, GripVertical, CheckSquare, Circle, FileText, Type, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type QuestionType = 'multiple_choice' | 'checkbox' | 'essay' | 'fill_in_blank' | 'true_false';

export type BlankDefinition = {
  index: number;
  accepted_answers: string[];
  case_sensitive?: boolean;
};

export type QuizQuestion = {
  id?: string;
  question: string;
  options: string[] | BlankDefinition[] | null;
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
    new Set(question.correct_answers?.map(ans => (question.options as string[])?.indexOf(ans) || -1).filter(i => i !== -1) || [])
  );

  const handleOptionChange = (optionIndex: number, value: string) => {
    const newOptions = [...(question.options || [])];
    const oldValue = newOptions[optionIndex];
    
    // Update correct_answer if it matches the old value (for multiple choice)
    if (question.type === 'multiple_choice' && question.correct_answer === oldValue) {
      onUpdate(index, 'correct_answer', value);
    }
    
    // Update correct_answers for checkbox if it contains the old value
    if (question.type === 'checkbox' && question.correct_answers?.includes(oldValue)) {
      const newCorrect = (question.correct_answers || []).map(a => a === oldValue ? value : a);
      onUpdate(index, 'correct_answers', newCorrect);
      // Also update the delimited string version
      onUpdate(index, 'correct_answer', newCorrect.join('|||'));
    }

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

  const config = questionTypeConfig[question.type] || questionTypeConfig.multiple_choice;
  const Icon = config.icon;

  return (
    <Card className="group relative bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm border-2 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
      {/* Drag Handle */}
      <div className="absolute left-2 top-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <CardContent className="p-6 pl-10 relative z-10">
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
            type="button"
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
                  type="button"
                  key={type}
                  onClick={() => {
                    if (type !== question.type) {
                      onUpdate(index, 'type', type);
                      // Reset answers when type changes
                      if (type !== 'checkbox') {
                        onUpdate(index, 'correct_answers', undefined);
                        setSelectedOptions(new Set());
                      }
                      // Set appropriate options based on question type
                      if (type === 'true_false') {
                        onUpdate(index, 'options', ['True', 'False']);
                        onUpdate(index, 'correct_answer', '');
                      } else if (type === 'essay' || type === 'fill_in_blank') {
                        // Essay and Fill-in-blank don't need options
                        onUpdate(index, 'options', null);
                        onUpdate(index, 'correct_answer', '');
                      } else if (type === 'multiple_choice' || type === 'checkbox') {
                        // Ensure options array exists for multiple choice and checkbox
                        if (!question.options || question.options.length === 0) {
                          onUpdate(index, 'options', ['', '', '', '']);
                        }
                        onUpdate(index, 'correct_answer', '');
                      }
                    }
                  }}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 cursor-pointer relative z-20 ${
                    question.type === type
                      ? typeConfig.color + ' border-current shadow-md ring-2 ring-primary/50'
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
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Question Text</label>
              {question.type === 'fill_in_blank' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    const textarea = document.getElementById(`question-text-${index}`) as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = question.question;
                      const newText = text.substring(0, start) + '[blank]' + text.substring(end);
                      onUpdate(index, 'question', newText);
                      setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(start + 7, start + 7);
                      }, 0);
                    } else {
                      onUpdate(index, 'question', question.question + ' [blank]');
                    }
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Insert Blank
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-lg border border-border/50">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Points</label>
              <Input
                type="number"
                min={0}
                value={question.points ?? 1}
                onChange={(e) => onUpdate(index, 'points', parseInt(e.target.value) || 0)}
                className="w-16 h-7 text-center bg-background border-border/50 focus:border-primary/50"
              />
            </div>
          </div>
          <Textarea
            id={`question-text-${index}`}
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
                  type="button"
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
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all cursor-pointer relative z-20 ${
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
                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all cursor-pointer relative z-20 ${
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
                      type="button"
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
                    type="button"
                    key={answer}
                    onClick={() => onUpdate(index, 'correct_answer', answer)}
                    className={`p-4 rounded-xl border-2 font-medium transition-all duration-200 cursor-pointer relative z-20 ${
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
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Blank Configuration
                </h5>
                
                {(() => {
                  // Count blanks in the question text
                  const blankCount = (question.question.match(/\[blank\]/g) || []).length;
                  
                  if (blankCount === 0) {
                    return (
                      <p className="text-sm text-muted-foreground italic">
                        Insert [blank] markers in the question text to configure answers.
                      </p>
                    );
                  }

                  return Array.from({ length: blankCount }).map((_, blankIndex) => {
                    const currentOptions = (question.options as BlankDefinition[]) || [];
                    const blankDef = currentOptions.find(o => o.index === blankIndex) || {
                      index: blankIndex,
                      accepted_answers: [],
                      case_sensitive: false
                    };

                    return (
                      <div key={blankIndex} className="mb-4 last:mb-0 p-3 bg-background rounded-md border border-border/50">
                        <label className="text-sm font-medium mb-2 block text-primary">
                          Blank #{blankIndex + 1} Accepted Answers
                        </label>
                        <Input
                          value={blankDef.accepted_answers.join('|')}
                          onChange={(e) => {
                            const newAnswers = e.target.value.split('|');
                            const newOptions = [...currentOptions];
                            const existingIdx = newOptions.findIndex(o => o.index === blankIndex);
                            
                            const newDef = {
                              ...blankDef,
                              accepted_answers: newAnswers
                            };

                            if (existingIdx >= 0) {
                              newOptions[existingIdx] = newDef;
                            } else {
                              newOptions.push(newDef);
                            }
                            
                            // Sort by index to keep things clean
                            newOptions.sort((a, b) => a.index - b.index);
                            
                            onUpdate(index, 'options', newOptions);
                          }}
                          placeholder="answer1|answer2 (separated by |)"
                          className="bg-background/50 border-border/50 focus:border-primary/50"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id={`case-sensitive-${index}-${blankIndex}`}
                            checked={blankDef.case_sensitive || false}
                            onChange={(e) => {
                              const newOptions = [...currentOptions];
                              const existingIdx = newOptions.findIndex(o => o.index === blankIndex);
                              
                              const newDef = {
                                ...blankDef,
                                case_sensitive: e.target.checked
                              };

                              if (existingIdx >= 0) {
                                newOptions[existingIdx] = newDef;
                              } else {
                                newOptions.push(newDef);
                              }
                              
                              onUpdate(index, 'options', newOptions);
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`case-sensitive-${index}-${blankIndex}`} className="text-xs text-muted-foreground cursor-pointer">
                            Case sensitive matching
                          </label>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Use <strong>[blank]</strong> in the question text where you want the input field to appear.
                Separate multiple acceptable answers with <strong>|</strong>.
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
