"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import ErrorFallback from "@/components/error-fallback";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateScienceQuiz, checkGenerationProgress } from "./actions";
import Quiz from "@/components/science-quiz";
import LLMProviderToggle from "@/components/llm-provider-toggle";

// Define the question types
const questionTypes = ["multiple-choice", "definition", "problem-solving"] as const;
type QuestionType = typeof questionTypes[number];

export default function ScienceQuizGenerator() {
  const [studyTopic, setStudyTopic] = useState("");
  const [subject, setSubject] = useState<"physics" | "chemistry" | "biology" | "other">("physics");
  const [customSubject, setCustomSubject] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(["multiple-choice"]);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleQuestionTypeToggle = (type: QuestionType) => {
    if (questionTypes.includes(type)) {
      // Don't remove if it's the only type selected
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter(t => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  // Effect to track real progress during quiz generation
  useEffect(() => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (isLoading && generationId) {
      // Function to check progress
      const checkProgress = async () => {
        try {
          const progressData = await checkGenerationProgress(generationId);

          if (progressData.progress) {
            setGenerationProgress(progressData.progress);
          }

          if (progressData.statusMessage) {
            setStatusMessage(progressData.statusMessage);
          }

          // If generation is complete, stop checking
          if (progressData.status === "complete" || progressData.progress >= 100) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }
        } catch (error) {
          console.error("Error checking progress:", error);
          // If there's an error, continue with simulated progress
          setGenerationProgress(prev => Math.min(95, prev + 1));
        }
      };

      // Check progress immediately
      checkProgress();

      // Then check every 1 second
      progressIntervalRef.current = setInterval(checkProgress, 1000);

      // Cleanup function
      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      };
    } else if (!isLoading && generationProgress > 0) {
      // When loading is complete, set progress to 100%
      setGenerationProgress(100);

      // Reset progress and generation ID after a delay
      const timeout = setTimeout(() => {
        setGenerationProgress(0);
        setGenerationId(null);
        setStatusMessage("");
      }, 500);

      return () => clearTimeout(timeout);
    } else if (isLoading && !generationId) {
      // If loading but no generation ID yet, use simulated progress
      // Create a simulated progress that moves faster than the real one
      const simulateProgress = () => {
        setGenerationProgress(prev => {
          // Different rates of progress based on current progress
          if (prev < 20) {
            // Start slow - initial API connection
            return prev + 2 + Math.random() * 3; // 2-5% increments
          } else if (prev < 50) {
            // Speed up - API processing the request
            return prev + 3 + Math.random() * 4; // 3-7% increments
          } else if (prev < 75) {
            // Maintain speed - generating content
            return prev + 2 + Math.random() * 3; // 2-5% increments
          } else if (prev < 90) {
            // Slow down - finalizing
            return prev + 1 + Math.random() * 2; // 1-3% increments
          } else {
            // Very slow - waiting for response
            return Math.min(95, prev + 0.5 + Math.random() * 1); // 0.5-1.5% increments
          }
        });
      };

      // Set initial progress
      setGenerationProgress(10);

      // Update progress every 200ms for smoother animation
      progressIntervalRef.current = setInterval(simulateProgress, 200);

      // Cleanup function
      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      };
    }

    // Cleanup function
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isLoading, generationId]);

  const handleGenerateQuiz = async () => {
    if (!studyTopic.trim()) {
      // Use console.log instead of toast for error handling
      console.error("Please enter a study topic");
      return;
    }

    // Check if there's a provider preference in localStorage
    if (typeof window !== 'undefined') {
      const savedProvider = localStorage.getItem("llm-provider");
      if (savedProvider) {
        console.log(`Using provider from localStorage: ${savedProvider}`);
      }
    }

    setError(null);
    setIsLoading(true);
    setGenerationId(null); // Reset generation ID

    try {
      // Determine the actual subject to send
      const actualSubject = subject === "other" && customSubject ? customSubject : subject;

      const result = await generateScienceQuiz({
        topic: studyTopic,
        subject: actualSubject,
        count: questionCount,
        difficulty,
        questionTypes,
      });

      // Store the questions
      setQuestions(result.questions);

      // If we have a generation ID, store it for progress tracking
      if (result.generationId) {
        setGenerationId(result.generationId);
        console.log("Generation ID:", result.generationId);
      }
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      setError(new Error(error.message || "Failed to generate quiz. Please try again."));
    } finally {
      // Ensure the progress bar reaches 100% before completing
      if (!generationId) {
        // If there's no generation ID (mock data or error), simulate completion
        setGenerationProgress(100);
        // Add a small delay before setting isLoading to false to show 100% progress
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } else {
        setIsLoading(false);
      }
    }
  };

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const clearQuiz = () => {
    setQuestions([]);
  };

  if (error) {
    return <ErrorFallback error={error} reset={resetError} />;
  }

  if (questions.length > 0) {
    return (
      <Quiz
        questions={questions}
        clearQuiz={clearQuiz}
        title={`${studyTopic} Quiz`}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="fixed top-20 left-4 z-20 mt-4">
        <Button variant="outline" size="sm" asChild className="bg-black/60 backdrop-blur-sm border-white/20">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <Card className="w-full relative">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={3}
          />
          <CardHeader className="text-center space-y-6 pt-8">
            <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground">
              <div className="rounded-full bg-primary/10 p-3">
                <BookOpen className="h-7 w-7" />
              </div>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-3xl font-bold">
                IB Science Quiz Generator
              </CardTitle>
              <CardDescription className="text-lg">
                Generate custom quizzes for IB DP Chemistry, Physics, and Biology
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 px-6 py-8">
            <div className="mb-6">
              <LLMProviderToggle />
            </div>

            <div className="space-y-3">
              <Label htmlFor="subject" className="text-base">Subject</Label>
              <Select
                value={subject}
                onValueChange={(value: "physics" | "chemistry" | "biology" | "other") => {
                  setSubject(value);
                  if (value !== "other") {
                    setCustomSubject("");
                  }
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="other">Other (specify)</SelectItem>
                </SelectContent>
              </Select>

              {subject === "other" && (
                <div className="mt-3">
                  <Input
                    id="customSubject"
                    placeholder="Enter subject name"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="h-10"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="topic" className="text-base">Study Topic</Label>
              <Input
                id="topic"
                placeholder="Enter a topic (e.g., Thermodynamics, Organic Chemistry, Cell Biology)"
                value={studyTopic}
                onChange={(e) => setStudyTopic(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="questionCount" className="text-base">Number of Questions: {questionCount}</Label>
              <Input
                id="questionCount"
                type="number"
                min={3}
                max={40}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                className="h-10"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base">Difficulty</Label>
              <RadioGroup
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as "easy" | "medium" | "hard")}
                className="flex space-x-8"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="easy" />
                  <Label htmlFor="easy">Easy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="hard" />
                  <Label htmlFor="hard">Hard</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Question Types</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                <Button
                  variant={questionTypes.includes("multiple-choice") ? "default" : "outline"}
                  onClick={() => handleQuestionTypeToggle("multiple-choice")}
                  className="text-sm h-10"
                >
                  Multiple Choice
                </Button>
                <Button
                  variant={questionTypes.includes("definition") ? "default" : "outline"}
                  onClick={() => handleQuestionTypeToggle("definition")}
                  className="text-sm h-10"
                >
                  Definition
                </Button>
                <Button
                  variant={questionTypes.includes("problem-solving") ? "default" : "outline"}
                  onClick={() => handleQuestionTypeToggle("problem-solving")}
                  className="text-sm h-10"
                >
                  Problem Solving
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 px-6 py-8">
            <Button
              onClick={handleGenerateQuiz}
              disabled={isLoading || !studyTopic.trim()}
              className="w-full h-12 text-base"
            >
              {isLoading ? (
                <span className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating Quiz... {generationProgress}%</span>
                </span>
              ) : (
                "Generate Quiz"
              )}
            </Button>
            {isLoading && (
              <div className="w-full mt-2 space-y-2">
                <Progress value={generationProgress} className="h-2" />
                {statusMessage && (
                  <div className="text-xs text-muted-foreground text-center">
                    {statusMessage}
                  </div>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
