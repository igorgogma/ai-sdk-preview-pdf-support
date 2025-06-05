"use client";

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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { EnhancedQuestion } from "@/lib/schemas";

type QuizProps = {
  questions: EnhancedQuestion[];
  clearPDF: () => void;
  title: string;
};

export default function EnhancedQuiz({
  questions,
  clearPDF,
  title = "Quiz",
}: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [textScores, setTextScores] = useState<Record<string, number>>({});
  // We don't need totalScore as it's redundant with score
  // const [totalScore, setTotalScore] = useState<number | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Update progress based on current question index
  useEffect(() => {
    // Calculate progress based on current question index
    const calculatedProgress = ((currentQuestionIndex + 1) / questions.length) * 100;
    setProgress(calculatedProgress);
  }, [currentQuestionIndex, questions.length]);

  const handleSelectAnswer = (answer: string) => {
    if (isSubmitted) return;

    setAnswers({
      ...answers,
      [currentQuestion.id as string]: answer,
    });
  };

  const handleTextAnswer = (answer: string) => {
    if (isSubmitted) return;

    setAnswers({
      ...answers,
      [currentQuestion.id as string]: answer,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);

    // Calculate score for multiple choice questions
    let correctCount = 0;
    let totalAnswered = 0;

    // Process text-based answers
    // No need for promises as we're calculating similarity synchronously
    const newTextScores: Record<string, number> = {};

    for (const question of questions) {
      const userAnswer = answers[question.id as string] || "";

      if (userAnswer) {
        totalAnswered++;

        if (question.type === "multiple-choice") {
          if (userAnswer === question.correctAnswer) {
            correctCount++;
          }
        } else {
          // For text-based answers, we'll calculate similarity
          const similarity = calculateSimilarity(userAnswer, question.correctAnswer);
          newTextScores[question.id as string] = similarity;

          // If similarity is above 0.7, consider it correct
          if (similarity > 0.7) {
            correctCount++;
          }
        }
      }
    }

    setTextScores(newTextScores);

    // Calculate final score
    const finalScore = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;
    setScore(Math.round(finalScore));
  };

  const calculateSimilarity = (userAnswer: string, correctAnswer: string): number => {
    // Simple similarity calculation - can be improved
    const userWords = userAnswer.toLowerCase().split(/\s+/);
    const correctWords = correctAnswer.toLowerCase().split(/\s+/);

    let matchCount = 0;
    for (const word of userWords) {
      if (correctWords.includes(word)) {
        matchCount++;
      }
    }

    return matchCount / Math.max(userWords.length, correctWords.length);
  };

  const handleReset = () => {
    setAnswers({});
    setIsSubmitted(false);
    setScore(null);
    setCurrentQuestionIndex(0);
    setTextScores({});
    setShowReview(false);
  };

  const handleStartOver = () => {
    clearPDF();
  };

  const renderWithMath = (text: string) => {
    // Return the text as is - MathJax will process it client-side
    return text;
  };

  const MultipleChoiceQuestionCard = ({
    question,
    selectedAnswer,
    onSelectAnswer,
    isSubmitted,
  }: {
    question: EnhancedQuestion & { type: "multiple-choice" };
    selectedAnswer: string | null;
    onSelectAnswer: (answer: string) => void;
    isSubmitted: boolean;
  }) => {
    const optionLabels = ["A", "B", "C", "D"];

    return (
      <div className="space-y-4">
        <div className="text-lg font-medium">{renderWithMath(question.question)}</div>
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const optionLabel = optionLabels[index];
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
                  <div className="text-left flex-grow">
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
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="font-medium mb-2">Explanation:</div>
            <div>{renderWithMath(question.explanation)}</div>
          </div>
        )}
      </div>
    );
  };

  const DefinitionQuestionCard = ({
    question,
    userAnswer,
    onAnswerChange,
    isSubmitted,
    score,
  }: {
    question: EnhancedQuestion & { type: "definition" };
    userAnswer: string | null;
    onAnswerChange: (answer: string) => void;
    isSubmitted: boolean;
    score?: number;
  }) => {
    return (
      <div className="space-y-4">
        <div className="text-lg font-medium">{renderWithMath(question.question)}</div>

        <Textarea
          value={userAnswer || ""}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          className="min-h-[120px]"
          disabled={isSubmitted}
        />

        {isSubmitted && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="font-medium mb-2">Your answer:</div>
              <div>{userAnswer}</div>
              {score !== undefined && (
                <div className="mt-2 text-sm">
                  Match score: {Math.round(score * 100)}%
                </div>
              )}
            </div>

            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <div className="font-medium mb-2">Correct answer:</div>
              <div>{renderWithMath(question.correctAnswer)}</div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="font-medium mb-2">Explanation:</div>
              <div>{renderWithMath(question.explanation)}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ProblemSolvingQuestionCard = ({
    question,
    userAnswer,
    onAnswerChange,
    isSubmitted,
    score,
  }: {
    question: EnhancedQuestion & { type: "problem-solving" };
    userAnswer: string | null;
    onAnswerChange: (answer: string) => void;
    isSubmitted: boolean;
    score?: number;
  }) => {
    return (
      <div className="space-y-4">
        <div className="text-lg font-medium">{renderWithMath(question.question)}</div>

        <Textarea
          value={userAnswer || ""}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          className="min-h-[120px]"
          disabled={isSubmitted}
        />

        {isSubmitted && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="font-medium mb-2">Your answer:</div>
              <div>{userAnswer}</div>
              {score !== undefined && (
                <div className="mt-2 text-sm">
                  Match score: {Math.round(score * 100)}%
                </div>
              )}
            </div>

            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <div className="font-medium mb-2">Correct answer:</div>
              <div>{renderWithMath(question.correctAnswer)}</div>
            </div>

            {question.steps && question.steps.length > 0 && (
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <div className="font-medium mb-2">Solution steps:</div>
                <ol className="list-decimal pl-5 space-y-1">
                  {question.steps.map((step, index) => (
                    <li key={index}>{renderWithMath(step)}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="font-medium mb-2">Explanation:</div>
              <div>{renderWithMath(question.explanation)}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuestionCard = () => {
    // Use type assertion to fix TypeScript errors
    const userAnswer = answers[currentQuestion.id as string] || null;
    const textScoreData = textScores[currentQuestion.id as string];

    if (currentQuestion.type === "multiple-choice") {
      return (
        <MultipleChoiceQuestionCard
          question={currentQuestion as EnhancedQuestion & { type: "multiple-choice" }}
          selectedAnswer={userAnswer}
          onSelectAnswer={handleSelectAnswer}
          isSubmitted={isSubmitted}
        />
      );
    } else if (currentQuestion.type === "definition") {
      return (
        <DefinitionQuestionCard
          question={currentQuestion as EnhancedQuestion & { type: "definition" }}
          userAnswer={userAnswer}
          onAnswerChange={handleTextAnswer}
          isSubmitted={isSubmitted}
          score={textScoreData}
        />
      );
    } else if (currentQuestion.type === "problem-solving") {
      return (
        <ProblemSolvingQuestionCard
          question={currentQuestion as EnhancedQuestion & { type: "problem-solving" }}
          userAnswer={userAnswer}
          onAnswerChange={handleTextAnswer}
          isSubmitted={isSubmitted}
          score={textScoreData}
        />
      );
    }

    return <div>Unknown question type</div>;
  };

  if (showReview) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 pt-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">{title} - Review</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowReview(false)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Results
            </Button>
            <Button variant="outline" onClick={handleStartOver}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {questions.map((question, index) => (
            <Card key={question.id} className="relative overflow-hidden">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-lg font-semibold">Question {index + 1}</div>
                  <div className="text-sm font-medium px-2 py-1 rounded-full bg-primary/10">
                    {question.type === "multiple-choice"
                      ? "Multiple Choice"
                      : question.type === "definition"
                        ? "Definition"
                        : "Problem Solving"}
                  </div>
                </div>

                {question.type === "multiple-choice" ? (
                  <MultipleChoiceQuestionCard
                    question={question as EnhancedQuestion & { type: "multiple-choice" }}
                    selectedAnswer={answers[question.id as string] || null}
                    onSelectAnswer={() => {}}
                    isSubmitted={true}
                  />
                ) : question.type === "definition" ? (
                  <DefinitionQuestionCard
                    question={question as EnhancedQuestion & { type: "definition" }}
                    userAnswer={answers[question.id as string] || null}
                    onAnswerChange={() => {}}
                    isSubmitted={true}
                    score={textScores[question.id as string]}
                  />
                ) : (
                  <ProblemSolvingQuestionCard
                    question={question as EnhancedQuestion & { type: "problem-solving" }}
                    userAnswer={answers[question.id as string] || null}
                    onAnswerChange={() => {}}
                    isSubmitted={true}
                    score={textScores[question.id as string]}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isSubmitted && score !== null) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 pt-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">{title} - Results</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake Quiz
            </Button>
            <Button variant="outline" onClick={handleStartOver}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          </div>
        </div>

        <Card className="relative overflow-hidden">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={3}
          />
          <CardContent className="p-8 flex flex-col items-center">
            <div className="text-4xl font-bold mb-4">{score}%</div>
            <div className="text-xl mb-6">
              You answered {Object.keys(answers).length} out of {questions.length} questions
            </div>
            <div className="flex space-x-4">
              <Button onClick={() => setShowReview(true)}>
                <BookOpen className="mr-2 h-4 w-4" />
                Review Answers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 pt-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Button variant="outline" onClick={handleStartOver}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Start Over
        </Button>
      </div>

      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="relative overflow-hidden">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <CardContent className="p-6">
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
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitted || Object.keys(answers).length === 0}
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!answers[currentQuestion.id as string]}
                  >
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
