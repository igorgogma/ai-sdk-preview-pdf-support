import { Check, X, RotateCcw } from "lucide-react"; // Added RotateCcw
import { Button } from "@/components/ui/button"; // Added Button
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Added CardFooter
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import MathFormula from "./math-formula";
import type { Question, LongAnswerQuestion, MultipleChoiceQuestion, DefinitionQuestion, ProblemSolvingQuestion } from "./science-quiz"; // Import necessary types

// Helper function to render text with math formulas
const renderWithMath = (text: string) => {
  // Handle null or undefined text
  if (!text) {
    return <span></span>;
  }

  // First check if the text contains dollar sign notation
  const inlineMathRegex = /\$([^$]+)\$/g;
  const displayMathRegex = /\$\$([^$]+)\$\$/g;

  // Check if the text contains LaTeX commands
  const latexCommandsRegex = /\\[a-zA-Z]+|\\[^a-zA-Z]/;

  const hasDollarNotation = inlineMathRegex.test(text) || displayMathRegex.test(text);
  const hasLatexCommands = latexCommandsRegex.test(text);

  // Reset regex patterns since test() advances the lastIndex
  inlineMathRegex.lastIndex = 0;
  displayMathRegex.lastIndex = 0;

  if (hasDollarNotation) {
    // Process with dollar sign notation
    // First, split by display math
    const displayParts = text.split(displayMathRegex);

    if (displayParts.length === 1) {
      // No display math, check for inline math
      const inlineParts = text.split(inlineMathRegex);

      if (inlineParts.length === 1) {
        // No math at all
        return <>{text}</>;
      }

      // Has inline math
      const result: React.ReactNode[] = [];
      let i = 0;

      text.replace(inlineMathRegex, (match, formula) => {
        // Add text before the match
        if (inlineParts[i]) {
          result.push(<span key={`text-${i}`}>{inlineParts[i]}</span>);
        }

        // Add the formula with the dollar signs to ensure proper rendering
        result.push(<MathFormula key={`formula-${i}`} formula={`$${formula}$`} />);

        i++;
        return match; // This return value is not used
      });

      // Add the last text part
      if (inlineParts[i]) {
        result.push(<span key={`text-${i}`}>{inlineParts[i]}</span>);
      }

      return <>{result}</>;
    } else {
      // Has display math
      const result: React.ReactNode[] = [];
      let i = 0;

      text.replace(displayMathRegex, (match, formula) => {
        // Add text before the match (which might contain inline math)
        if (displayParts[i]) {
          const inlineParts = displayParts[i].split(inlineMathRegex);

          if (inlineParts.length === 1) {
            // No inline math in this part
            result.push(<span key={`text-${i}`}>{displayParts[i]}</span>);
          } else {
            // Has inline math in this part
            const inlineResult: React.ReactNode[] = [];
            let j = 0;

            displayParts[i].replace(inlineMathRegex, (match, inlineFormula) => {
              // Add text before the match
              if (inlineParts[j]) {
                inlineResult.push(<span key={`inline-text-${i}-${j}`}>{inlineParts[j]}</span>);
              }

              // Add the formula with the dollar signs
              inlineResult.push(<MathFormula key={`inline-formula-${i}-${j}`} formula={`$${inlineFormula}$`} />);

              j++;
              return match; // This return value is not used
            });

            // Add the last text part
            if (inlineParts[j]) {
              inlineResult.push(<span key={`inline-text-${i}-${j}`}>{inlineParts[j]}</span>);
            }

            result.push(<span key={`mixed-${i}`}>{inlineResult}</span>);
          }
        }

        // Add the display formula with the dollar signs
        result.push(<MathFormula key={`display-formula-${i}`} formula={`$$${formula}$$`} display={true} />);

        i++;
        return match; // This return value is not used
      });

      // Add the last text part (which might contain inline math)
      if (displayParts[i]) {
        const inlineParts = displayParts[i].split(inlineMathRegex);

        if (inlineParts.length === 1) {
          // No inline math in this part
          result.push(<span key={`text-${i}`}>{displayParts[i]}</span>);
        } else {
          // Has inline math in this part
          const inlineResult: React.ReactNode[] = [];
          let j = 0;

          displayParts[i].replace(inlineMathRegex, (match, inlineFormula) => {
            // Add text before the match
            if (inlineParts[j]) {
              inlineResult.push(<span key={`inline-text-${i}-${j}`}>{inlineParts[j]}</span>);
            }

            // Add the formula with the dollar signs
            inlineResult.push(<MathFormula key={`inline-formula-${i}-${j}`} formula={`$${inlineFormula}$`} />);

            j++;
            return match; // This return value is not used
          });

          // Add the last text part
          if (inlineParts[j]) {
            inlineResult.push(<span key={`inline-text-${i}-${j}`}>{inlineParts[j]}</span>);
          }

          result.push(<span key={`mixed-${i}`}>{inlineResult}</span>);
        }
      }

      return <>{result}</>;
    }
  } else if (hasLatexCommands) {
    // If it has LaTeX commands but no dollar signs, wrap the entire text in dollar signs
    return <MathFormula formula={`$${text}$`} />;
  } else {
    // No dollar notation or LaTeX commands, use auto-detection
    return <MathFormula formula={text} autoDetect={true} />;
  }
};

interface ScienceQuizReviewProps {
  questions: Question[];
  userAnswers: Record<string, string | null>; // Can be null if not answered
  onRestartQuiz: () => void;
  title?: string;
  // We might also want to pass scores or AI feedback for long answers if available
  // For now, keeping it simple as per the immediate requirement.
}

export default function ScienceQuizReview({ questions, userAnswers, onRestartQuiz, title = "Quiz Review" }: ScienceQuizReviewProps) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Card className="w-full relative">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-250px)] pr-4"> {/* Adjusted height */}
            <div className="space-y-8">
              {questions.map((question, index) => (
                <div key={question.id} className="pb-6 border-b last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">
                      Question {index + 1}: {question.type === "multiple-choice"
                        ? "Multiple Choice"
                        : question.type === "definition"
                          ? "Definition"
                          : question.type === "problem-solving"
                            ? "Problem Solving"
                            : question.type === "long-answer"
                              ? "Long Answer"
                              : "Unknown Question Type"}
                    </h3>
                    {question.type === "multiple-choice" && userAnswers[question.id] !== null && (
                      <div className={`px-2 py-1 rounded-full text-sm font-medium ${
                        (question as MultipleChoiceQuestion).correctAnswer === userAnswers[question.id]
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {(question as MultipleChoiceQuestion).correctAnswer === userAnswers[question.id] ? "Correct" : "Incorrect"}
                      </div>
                    )}
                    {/* Add similar badges for other question types if direct comparison is possible and desired */}
                  </div>

                  <div className="mb-4 text-base">
                    {renderWithMath(question.question)}
                  </div>

                  {question.type === "multiple-choice" && (
                    <div className="space-y-2 mb-4">
                      {(question as MultipleChoiceQuestion).options.map((option: string, optionIndex: number) => {
                        const optionLabel = String.fromCharCode(65 + optionIndex); // A, B, C, D...
                        const isCorrect = optionLabel === (question as MultipleChoiceQuestion).correctAnswer;
                        const isSelected = optionLabel === userAnswers[question.id];

                        return (
                          <div
                            key={optionIndex}
                            className={`flex items-center p-3 rounded-lg ${
                              isCorrect
                                ? "bg-green-100 dark:bg-green-900/30 border border-green-500"
                                : isSelected
                                  ? "bg-red-100 dark:bg-red-900/30 border border-red-500"
                                  : "border border-border"
                            }`}
                          >
                            <span className="font-medium mr-3">{optionLabel}</span>
                            <div className="flex-grow math-option">
                              {renderWithMath(option)}
                            </div>
                            {isCorrect && (
                              <Check className="ml-2 text-green-600 dark:text-green-400" size={18} />
                            )}
                            {isSelected && !isCorrect && (
                              <X className="ml-2 text-red-600 dark:text-red-400" size={18} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(question.type === "definition" || question.type === "problem-solving" || question.type === "long-answer") && (
                    <div className="space-y-4 mb-4">
                      <div className="p-3 rounded-lg border border-border">
                        <div className="font-medium mb-1">Your Answer:</div>
                        <div className="text-sm">
                          {userAnswers[question.id] ? renderWithMath(userAnswers[question.id]!) : <span className="italic text-muted-foreground">No answer provided</span>}
                        </div>
                      </div>

                      {(question.type === "definition" || question.type === "problem-solving") && (
                        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-500">
                          <div className="font-medium mb-1">Correct Answer:</div>
                          <div className="text-sm">{renderWithMath((question as DefinitionQuestion | ProblemSolvingQuestion).correctAnswer)}</div>
                        </div>
                      )}
                      
                      {/* Explanation for Definition and Problem Solving */}
                      {(question.type === "definition" || question.type === "problem-solving") && typeof question.explanation === 'string' && question.explanation.length > 0 && (
                        <div className="p-3 rounded-lg bg-muted mt-2">
                          <h4 className="font-semibold mb-1">Explanation:</h4>
                          <div className="text-sm explanation-content">
                            {renderWithMath(question.explanation)}
                          </div>
                        </div>
                      )}

                      {/* For LongAnswerQuestion, the explanation serves as a reference/model answer */}
                      {question.type === "long-answer" && typeof question.explanation === 'string' && question.explanation.length > 0 && (
                         <div className="p-3 rounded-lg bg-muted mt-2">
                          <h4 className="font-semibold mb-1">Reference Answer / Explanation:</h4>
                           <div className="text-sm explanation-content">
                            {renderWithMath(question.explanation)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* General explanation for MCQs */}
                  {question.type === "multiple-choice" && typeof question.explanation === 'string' && question.explanation.length > 0 && (
                     <div className="p-3 rounded-lg bg-muted mt-2">
                      <h4 className="font-semibold mb-1">Explanation:</h4>
                       <div className="text-sm explanation-content">
                        {renderWithMath(question.explanation)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-center py-6">
          <Button onClick={onRestartQuiz} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Back to Setup
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
