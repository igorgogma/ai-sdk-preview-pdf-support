import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import ScienceQuizScore from "./science-quiz-score";
import ScienceQuizReview from "./science-quiz-review";
import MathFormula from "./math-formula";

type QuestionType = "multiple-choice" | "definition" | "problem-solving" | "long-answer";

// Helper function to render text with math formulas
const renderWithMath = (text: string) => {
  // Handle null or undefined text
  if (!text) {
    return <p></p>;
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
    // Split the text into sentences for better math detection
    const sentences = text.split(/(?<=[.!?])\s+/);

    if (sentences.length === 1) {
      // Single sentence, check if it's math
      return <MathFormula formula={text} autoDetect={true} />;
    } else {
      // Multiple sentences, process each one
      return (
        <>
          {sentences.map((sentence, index) => (
            <React.Fragment key={index}>
              <MathFormula formula={sentence} autoDetect={true} />
              {index < sentences.length - 1 ? ' ' : ''}
            </React.Fragment>
          ))}
        </>
      );
    }
  }
};

interface BaseQuestion {
  id: string;
  question: string;
  explanation: string;
  type: QuestionType;
  hints?: string[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple-choice";
  options: string[];
  correctAnswer: string;
}

export interface DefinitionQuestion extends BaseQuestion {
  type: "definition";
  correctAnswer: string;
}

export interface ProblemSolvingQuestion extends BaseQuestion {
  type: "problem-solving";
  correctAnswer: string;
  steps?: string[];
}

export interface LongAnswerQuestion extends BaseQuestion {
  type: "long-answer";
  gradingCriteria?: string; // Optional: criteria for the LLM to use for grading
  // aiGrade and aiFeedback will be handled by the grading API later
  // Storing the grade directly on the question might be an alternative,
  // but for now, we'll manage it in the parent ScienceQuiz component
  // to align with the requirement of saving all progress data together.
}

export type Question = MultipleChoiceQuestion | DefinitionQuestion | ProblemSolvingQuestion | LongAnswerQuestion;

// Structure for saving quiz progress
export interface SavedQuizState {
  questions: Question[];
  userAnswers: { [key: string]: string | null };
  hintsUsedPerQuestion: { [key: string]: number };
  currentQuestionIndex: number;
  longAnswerGrades: { [key: string]: { score: number | null; feedback: string | null } };
  title: string; // Also save the quiz title
}

type QuizProps = {
  questions: Question[];
  clearQuiz: () => void;
  title: string;
};

const MultipleChoiceQuestionCard: React.FC<{
  question: MultipleChoiceQuestion;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  isSubmitted: boolean;
}> = ({ question, selectedAnswer, onSelectAnswer, isSubmitted }) => {
  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold leading-tight">
        {renderWithMath(question.question)}
      </div>
      <div className="grid grid-cols-1 gap-4">
        {question.options.map((option, index) => {
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...
          const isCorrect = isSubmitted && optionLabel === question.correctAnswer;
          const isIncorrect = isSubmitted && selectedAnswer === optionLabel && optionLabel !== question.correctAnswer;

          return (
            <Button
              key={index}
              variant={selectedAnswer === optionLabel ? "secondary" : "outline"}
              className={`justify-start h-auto py-4 px-4 ${
                isCorrect ? "bg-green-100 dark:bg-green-900/30 border-green-500" : ""
              } ${
                isIncorrect ? "bg-red-100 dark:bg-red-900/30 border-red-500" : ""
              }`}
              onClick={() => !isSubmitted && onSelectAnswer(optionLabel)}
              disabled={isSubmitted}
            >
              <div className="flex items-center w-full">
                <span className="font-bold mr-3">{optionLabel}</span>
                <div className="text-left flex-grow math-option">
                  {renderWithMath(option)}
                </div>
                {isCorrect && <Check className="ml-2 text-green-600 dark:text-green-400" size={20} />}
                {isIncorrect && <X className="ml-2 text-red-600 dark:text-red-400" size={20} />}
              </div>
            </Button>
          );
        })}
      </div>

      {isSubmitted && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Explanation:</h3>
          <div className="space-y-4 explanation-content">
            {renderWithMath(question.explanation)}
          </div>
        </div>
      )}
    </div>
  );
};

const DefinitionQuestionCard: React.FC<{
  question: DefinitionQuestion;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  isSubmitted: boolean;
  score?: {score: number, isCorrect: boolean, feedback: string};
}> = ({ question, userAnswer, onAnswerChange, isSubmitted, score }) => {
  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold leading-tight">
        {renderWithMath(question.question)}
      </div>
      <div className="space-y-4">
        <Textarea
          placeholder="Type your answer here..."
          value={userAnswer}
          onChange={(e) => !isSubmitted && onAnswerChange(e.target.value)}
          rows={4}
          disabled={isSubmitted}
          className="w-full"
        />
      </div>

      {isSubmitted && (
        <div className="mt-6 space-y-4">
          {score !== undefined && (
            <div className={`p-4 rounded-lg ${
              score.isCorrect ? "bg-green-100 dark:bg-green-900/30 border border-green-500" :
              score.score >= 50 ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500" :
              "bg-red-100 dark:bg-red-900/30 border border-red-500"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {score.isCorrect ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-red-500" />
                )}
                <h3 className="font-semibold">
                  {score.isCorrect ? "Correct" : "Incorrect"} - Score: {score.score}%
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {score.feedback}
              </p>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Correct Answer:</h3>
            {renderWithMath(question.correctAnswer)}
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Explanation:</h3>
            <div className="space-y-4 explanation-content">
              {renderWithMath(question.explanation)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProblemSolvingQuestionCard: React.FC<{
  question: ProblemSolvingQuestion;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  isSubmitted: boolean;
  score?: {score: number, isCorrect: boolean, feedback: string};
}> = ({ question, userAnswer, onAnswerChange, isSubmitted, score }) => {
  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold leading-tight">
        {renderWithMath(question.question)}
      </div>
      <div className="space-y-4">
        <Textarea
          placeholder="Type your answer here..."
          value={userAnswer}
          onChange={(e) => !isSubmitted && onAnswerChange(e.target.value)}
          rows={4}
          disabled={isSubmitted}
          className="w-full"
        />
      </div>

      {isSubmitted && (
        <div className="mt-6 space-y-4">
          {score !== undefined && (
            <div className={`p-4 rounded-lg ${
              score.isCorrect ? "bg-green-100 dark:bg-green-900/30 border border-green-500" :
              score.score >= 50 ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500" :
              "bg-red-100 dark:bg-red-900/30 border border-red-500"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {score.isCorrect ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-red-500" />
                )}
                <h3 className="font-semibold">
                  {score.isCorrect ? "Correct" : "Incorrect"} - Score: {score.score}%
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {score.feedback}
              </p>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Correct Answer:</h3>
            {renderWithMath(question.correctAnswer)}
          </div>

          {question.steps && question.steps.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Solution Steps:</h3>
              <ol className="list-decimal list-inside space-y-2">
                {question.steps.map((step, index) => (
                  <li key={index}>{renderWithMath(step)}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Explanation:</h3>
            <div className="space-y-4 explanation-content">
              {renderWithMath(question.explanation)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LongAnswerQuestionCard: React.FC<{
  question: LongAnswerQuestion;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  isSubmitted: boolean; // This relates to overall quiz submission
  onGrade: (questionId: string, score: number | null, feedback: string | null) => void;
  initialGrade?: { score: number | null; feedback: string | null };
}> = ({ question, userAnswer, onAnswerChange, isSubmitted, onGrade, initialGrade }) => {
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiScore, setApiScore] = useState<number | null>(initialGrade?.score ?? null);
  const [apiFeedback, setApiFeedback] = useState<string | null>(null);
  const [isGraded, setIsGraded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGradeSubmit = async () => {
    if (!userAnswer.trim()) {
      setError("Please enter an answer before submitting for grading.");
      return;
    }
    setError(null);
    setIsLoadingApi(true);
    try {
      const response = await fetch("/api/grade-long-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionDetails: {
            question: question.question,
            gradingCriteria: question.gradingCriteria,
          },
          userAnswer: userAnswer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
      }

      const data = await response.json();
      setApiScore(data.score);
      setApiFeedback(data.feedback);
      setIsGraded(true);
      onGrade(question.id, data.score, data.feedback); // Call onGrade callback
    } catch (err: any) {
      console.error("Failed to grade answer:", err);
      setError(err.message || "Failed to grade answer. Please try again.");
      // Optionally keep isGraded false so they can retry, or handle retries differently
    } finally {
      setIsLoadingApi(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold leading-tight">
        {renderWithMath(question.question)}
      </div>
      {question.gradingCriteria && (
        <div className="text-sm text-muted-foreground italic">
          Grading Criteria: {renderWithMath(question.gradingCriteria)}
        </div>
      )}
      <div className="space-y-4">
        <Textarea
          placeholder="Type your detailed answer here..."
          value={userAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          rows={8}
          disabled={isSubmitted || isGraded || isLoadingApi}
          className="w-full"
        />
      </div>

      {!isGraded && !isSubmitted && (
        <Button
          onClick={handleGradeSubmit}
          disabled={isLoadingApi || !userAnswer.trim()}
          className="w-full sm:w-auto"
        >
          {isLoadingApi ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Grading...
            </>
          ) : (
            "Submit for AI Grading"
          )}
        </Button>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-500 rounded-lg text-red-700 dark:text-red-300">
          <p>{error}</p>
        </div>
      )}

      {isGraded && apiScore !== null && apiFeedback !== null && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/40 border border-blue-400 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">AI Grading Result:</h3>
          <p className="text-sm">
            <strong>Score:</strong> {apiScore}/100
          </p>
          <p className="text-sm mt-1">
            <strong>Feedback:</strong> {renderWithMath(apiFeedback)}
          </p>
        </div>
      )}

      {/* Display general explanation if quiz is submitted (overall) and question has one */}
      {isSubmitted && question.explanation && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Explanation / Reference Answer:</h3>
          <div className="space-y-4 explanation-content">
            {renderWithMath(question.explanation)}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ScienceQuiz({
  questions,
  clearQuiz,
  title = "Science Quiz",
}: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [textScores, setTextScores] = useState<Record<string, {score: number, isCorrect: boolean, feedback: string}>>({});
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [hintsUsedPerQuestion, setHintsUsedPerQuestion] = useState<Record<string, number>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, string[]>>({});
  const [longAnswerGrades, setLongAnswerGrades] = useState<{ [key: string]: { score: number | null; feedback: string | null } }>({});

  const LOCAL_STORAGE_KEY = "currentQuizProgress";

  const currentQuestion = questions[currentQuestionIndex];

  // Effect to save progress to localStorage
  useEffect(() => {
    if (questions && questions.length > 0 && currentQuestion && !isSubmitted) { // Only save if there are questions and quiz is not submitted
      const quizStateToSave: SavedQuizState = {
        questions,
        userAnswers: answers, // Assuming 'answers' is the state for user's answers
        hintsUsedPerQuestion,
        currentQuestionIndex,
        longAnswerGrades,
        title,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quizStateToSave));
    }
  }, [currentQuestionIndex, answers, hintsUsedPerQuestion, longAnswerGrades, questions, title, isSubmitted, currentQuestion]);

  // Update progress based on current question index
  useEffect(() => {
    // Calculate progress based on current question index
    const calculatedProgress = ((currentQuestionIndex + 1) / questions.length) * 100;
    setProgress(calculatedProgress);

    // Initialize hints used for the current question if not already done
    if (currentQuestion && !hintsUsedPerQuestion[currentQuestion.id]) {
      setHintsUsedPerQuestion(prev => ({ ...prev, [currentQuestion.id]: 0 }));
    }
    if (currentQuestion && !revealedHints[currentQuestion.id]) {
      setRevealedHints(prev => ({ ...prev, [currentQuestion.id]: [] }));
    }
    // Reset long answer grades when questions change (e.g. new quiz)
    // This assumes this useEffect is the primary one reacting to 'questions' prop change for initialization.
    if (questions && questions.length > 0) {
        setLongAnswerGrades({});
    }
  }, [currentQuestionIndex, questions, currentQuestion, hintsUsedPerQuestion, revealedHints]);

  // Load progress from localStorage on component mount
  useEffect(() => {
    const savedProgressString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedProgressString) {
      try {
        const savedState: SavedQuizState = JSON.parse(savedProgressString);
        
        // Ensure savedState and its properties are valid before setting state
        if (savedState) {
          // Not setting questions or title as they are props and direct setters are not available.
          // The loaded questions and title from savedState will be ignored if they differ from current props.
          // This means progress is loaded for the quiz defined by the current props.

          const transformedUserAnswers: Record<string, string> = {};
          if (savedState.userAnswers) {
            for (const key in savedState.userAnswers) {
              if (Object.prototype.hasOwnProperty.call(savedState.userAnswers, key)) {
                transformedUserAnswers[key] = savedState.userAnswers[key] || ""; // Convert null to empty string
              }
            }
          }
          setAnswers(transformedUserAnswers);

          setHintsUsedPerQuestion(savedState.hintsUsedPerQuestion || {});
          setCurrentQuestionIndex(typeof savedState.currentQuestionIndex === 'number' ? savedState.currentQuestionIndex : 0);
          setLongAnswerGrades(savedState.longAnswerGrades || {});
        } else {
          // console.warn("Saved quiz progress was found but seems invalid or incomplete.");
        }
      } catch (error) {
        console.error("Failed to parse saved quiz progress:", error);
        // localStorage.removeItem(LOCAL_STORAGE_KEY); // Optionally clear corrupted data
      }
    }
  }, []); // Empty dependency array ensures this runs only on mount. Add setInitialQuestions, setAnswers etc. to deps if they are not stable.

  const handleLongAnswerGraded = (questionId: string, score: number | null, feedback: string | null) => {
    setLongAnswerGrades(prev => ({
      ...prev,
      [questionId]: { score, feedback }
    }));
  };

  const handleSelectAnswer = (answer: string) => {
    if (!isSubmitted) {
      setAnswers({
        ...answers,
        [currentQuestion.id]: answer,
      });
    }
  };

  const handleTextAnswer = (answer: string) => {
    if (!isSubmitted) {
      setAnswers({
        ...answers,
        [currentQuestion.id]: answer,
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleGetHint = () => {
    if (!currentQuestion || !currentQuestion.hints || isSubmitted) return;

    const questionId = currentQuestion.id;
    const currentHintCount = hintsUsedPerQuestion[questionId] || 0;

    if (currentHintCount < currentQuestion.hints.length && currentHintCount < 5) {
      const nextHint = currentQuestion.hints[currentHintCount];
      setRevealedHints(prev => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), nextHint],
      }));
      setHintsUsedPerQuestion(prev => ({
        ...prev,
        [questionId]: currentHintCount + 1,
      }));
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);

    // Calculate score for multiple choice questions
    const correctAnswers = questions.reduce((acc, question) => {
      if (question.type === "multiple-choice") {
        return acc + (question.correctAnswer === answers[question.id] ? 1 : 0);
      }
      return acc;
    }, 0);

    const totalMultipleChoice = questions.filter(q => q.type === "multiple-choice").length;
    const scorePercentage = totalMultipleChoice > 0
      ? Math.round((correctAnswers / totalMultipleChoice) * 100)
      : null;

    setScore(scorePercentage);

    // Grade text answers (definition and problem-solving questions)
    const textQuestions = questions.filter(q => q.type === "definition" || q.type === "problem-solving");
    const newTextScores: Record<string, {score: number, isCorrect: boolean, feedback: string}> = {};

    textQuestions.forEach(question => {
      const userAnswer = answers[question.id] || "";
      const correctAnswer = question.correctAnswer;

      if (!userAnswer.trim()) {
        // No answer provided
        newTextScores[question.id] = {
          score: 0,
          isCorrect: false,
          feedback: "No answer provided."
        };
      } else {
        // Improved grading algorithm for text answers
        // Normalize both answers by removing punctuation, extra spaces, and converting to lowercase
        const normalizeText = (text: string) => {
          return text
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Remove punctuation
            .replace(/\s+/g, " ")                        // Replace multiple spaces with single space
            .trim();                                     // Remove leading/trailing spaces
        };

        const normalizedUserAnswer = normalizeText(userAnswer);
        const normalizedCorrectAnswer = normalizeText(correctAnswer);

        // Extract key terms from the correct answer (words longer than 3 characters)
        const extractKeyTerms = (text: string) => {
          return text.split(/\s+/).filter(word => word.length > 3);
        };

        const keyTerms = extractKeyTerms(normalizedCorrectAnswer);

        // Check for exact match first
        const exactMatch = normalizedUserAnswer === normalizedCorrectAnswer;

        // Check for key terms match
        let keyTermMatches = 0;
        keyTerms.forEach(term => {
          if (normalizedUserAnswer.includes(term)) keyTermMatches++;
        });

        // Calculate score based on exact match or key term matches
        let termScore = 0;
        if (exactMatch) {
          termScore = 100;
        } else if (keyTerms.length > 0) {
          termScore = Math.min(95, Math.round((keyTermMatches / keyTerms.length) * 100));

          // Bonus points for answers that are close in length to the correct answer
          const lengthRatio = Math.min(normalizedUserAnswer.length, normalizedCorrectAnswer.length) /
                             Math.max(normalizedUserAnswer.length, normalizedCorrectAnswer.length);

          // Add up to 5 points for length similarity
          termScore = Math.min(100, termScore + Math.round(lengthRatio * 5));
        }

        // Determine if the answer is correct based on the score
        const isCorrect = termScore >= 70; // Consider 70% or higher as correct

        // Generate feedback based on the score
        let feedback = "";
        if (termScore >= 90) {
          feedback = "Excellent! Your answer is correct and comprehensive.";
        } else if (termScore >= 70) {
          feedback = "Good job! Your answer is correct but could include more details.";
        } else if (termScore >= 50) {
          feedback = "Partially correct. Your answer includes some key concepts but is missing important elements.";
        } else if (termScore >= 30) {
          feedback = "Needs improvement. Your answer contains some relevant information but is mostly incorrect.";
        } else {
          feedback = "Incorrect. Your answer does not match the expected response.";
        }

        newTextScores[question.id] = {
          score: termScore,
          isCorrect,
          feedback
        };
      }
    });

    setTextScores(newTextScores);

    // Calculate total score across all question types
    const totalPoints = questions.length;
    let earnedPoints = correctAnswers; // Points from multiple choice

    // Add points from text questions
    Object.values(newTextScores).forEach(scoreData => {
      earnedPoints += scoreData.score / 100; // Convert percentage to points (0-1)
    });

    const overallScore = totalPoints > 0
      ? Math.round((earnedPoints / totalPoints) * 100)
      : null;

    setTotalScore(overallScore);
    localStorage.removeItem("currentQuizProgress"); // Clear saved progress on submission
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setScore(null);
    setTextScores({});
    setTotalScore(null);
    setShowReview(false);
  };

  const renderQuestionCard = () => {
    const userAnswer = answers[currentQuestion.id] || "";
    const textScoreData = isSubmitted ? textScores[currentQuestion.id] : undefined;

    switch (currentQuestion.type) {
      case "multiple-choice":
        return (
          <MultipleChoiceQuestionCard
            question={currentQuestion}
            selectedAnswer={userAnswer}
            onSelectAnswer={handleSelectAnswer}
            isSubmitted={isSubmitted}
          />
        );
      case "definition":
        return (
          <DefinitionQuestionCard
            question={currentQuestion}
            userAnswer={userAnswer}
            onAnswerChange={handleTextAnswer}
            isSubmitted={isSubmitted}
            score={textScoreData}
          />
        );
      case "problem-solving":
        return (
          <ProblemSolvingQuestionCard
            question={currentQuestion}
            userAnswer={userAnswer}
            onAnswerChange={handleTextAnswer}
            isSubmitted={isSubmitted}
            score={textScoreData}
          />
        );
      case "long-answer":
        // Ensure currentQuestion is treated as LongAnswerQuestion for this case
        // The 'as LongAnswerQuestion' cast might not be strictly necessary if TS infers correctly from currentQuestion.type
        if (currentQuestion.type === "long-answer") {
          return (
            <LongAnswerQuestionCard
              question={currentQuestion} // currentQuestion is already narrowed by the type check
              userAnswer={userAnswer} // Defined at the start of renderQuestionCard
              onAnswerChange={handleTextAnswer}
              isSubmitted={isSubmitted}
              onGrade={handleLongAnswerGraded}
              initialGrade={longAnswerGrades[currentQuestion.id]}
            />
          );
        }
        // Fallthrough or specific error for type mismatch
        return <div>Error: Question type mismatch for long-answer.</div>;
      default:
        // Exhaustive check to ensure all question types are handled
        const _exhaustiveCheck: never = currentQuestion;
        return <div>Unsupported question type: {JSON.stringify(_exhaustiveCheck)}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
          {title}
        </h1>
        <div className="relative">
          {!isSubmitted && <Progress value={progress} className="h-1 mb-8" />}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={isSubmitted && showReview ? "review" : (isSubmitted ? "results" : currentQuestionIndex)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {!isSubmitted ? (
                  <div className="space-y-8">
                    <Card className="relative">
                      <GlowingEffect
                        spread={40}
                        glow={true}
                        disabled={false}
                        proximity={64}
                        inactiveZone={0.01}
                        borderWidth={3}
                      />
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center mb-6">
                          <div className="text-sm text-muted-foreground">
                            Question {currentQuestionIndex + 1} of {questions.length}
                          </div>
                          <div className="text-sm font-medium px-2 py-1 rounded-full bg-primary/10">
                            {currentQuestion.type === "multiple-choice"
                              ? "Multiple Choice"
                              : currentQuestion.type === "definition"
                                ? "Definition"
                                : "Problem Solving"}
                          </div>
                        </div>

                        {renderQuestionCard()}

                        <div className="flex justify-between mt-8">
                          <Button
                            onClick={handlePreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                            variant="outline"
                          >
                            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                          </Button>
                          <div>
                            {currentQuestion.hints && currentQuestion.hints.length > 0 && !isSubmitted && (
                              <Button
                                onClick={handleGetHint}
                                disabled={(hintsUsedPerQuestion[currentQuestion.id] || 0) >= Math.min(currentQuestion.hints.length, 5)}
                                variant="outline"
                                className="mr-2"
                              >
                                <Lightbulb className="mr-2 h-4 w-4" />
                                Get Hint ({Math.min(currentQuestion.hints.length, 5) - (hintsUsedPerQuestion[currentQuestion.id] || 0)} left)
                              </Button>
                            )}
                            <Button onClick={handleNextQuestion}>
                              {currentQuestionIndex === questions.length - 1
                                ? "Finish Quiz"
                                : "Next"}
                              {currentQuestionIndex < questions.length - 1 && (
                                <ChevronRight className="ml-2 h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {revealedHints[currentQuestion.id] && revealedHints[currentQuestion.id].length > 0 && !isSubmitted && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Hints:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-blue-600 dark:text-blue-400">
                              {revealedHints[currentQuestion.id].map((hint, index) => (
                                <li key={index}>{renderWithMath(hint)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : showReview ? (
                  <div className="space-y-6">
                    <ScienceQuizReview
                      questions={questions}
                      userAnswers={answers}
                    />
                    <div className="flex justify-center space-x-4 pt-4">
                      <Button
                        onClick={() => setShowReview(false)}
                        variant="outline"
                      >
                        Back to Results
                      </Button>
                      <Button
                        onClick={clearQuiz}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <BookOpen className="mr-2 h-4 w-4" /> Create New Quiz
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <ScienceQuizScore
                      score={score}
                      totalQuestions={questions.filter(q => q.type === "multiple-choice").length}
                      totalScore={totalScore}
                      totalQuestionsAll={questions.length}
                    />
                    <div className="flex justify-center space-x-4 pt-4">
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="bg-muted hover:bg-muted/80 w-full"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Retry Quiz
                      </Button>
                      <Button
                        onClick={() => setShowReview(true)}
                        className="bg-primary hover:bg-primary/90 w-full"
                      >
                        Review Answers
                      </Button>
                    </div>
                    <div className="flex justify-center pt-2">
                      <Button
                        onClick={clearQuiz}
                        variant="outline"
                        className="w-full"
                      >
                        <BookOpen className="mr-2 h-4 w-4" /> Create New Quiz
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
