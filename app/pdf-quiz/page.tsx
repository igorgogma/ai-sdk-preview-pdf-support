"use client";

import { useState, useEffect, useRef } from "react";
import { enhancedQuestionsSchema, pdfQuizParamsSchema } from "@/lib/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { FileUp, Plus, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Progress } from "@/components/ui/progress";
import { RangeSlider } from "@/components/ui/range-slider";
import { Label } from "@/components/ui/label";
import EnhancedQuiz from "@/components/enhanced-quiz";
import NextLink from "next/link";
import { generateQuizTitle, checkGenerationProgress } from "./actions";
import { AnimatePresence, motion } from "framer-motion";

export default function PDFQuizGenerator() {
  const [files, setFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<z.infer<typeof enhancedQuestionsSchema>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState<string>();
  const [questionCount, setQuestionCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState<string[]>(["multiple-choice"]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
            setProgress(progressData.progress);
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
          // If there's an error, don't change the progress
          // Just update the status message
          setStatusMessage("Checking progress...");
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
    } else if (!isLoading && progress > 0) {
      // When loading is complete, set progress to 100%
      setProgress(100);

      // Reset progress and generation ID after a delay
      const timeout = setTimeout(() => {
        setProgress(0);
        setGenerationId(null);
        setStatusMessage("");
      }, 500);

      return () => clearTimeout(timeout);
    }

    // Cleanup function
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isLoading, generationId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari && isDragging) {
      console.error("Safari does not support drag & drop. Please use the file picker.");
      alert("Safari does not support drag & drop. Please use the file picker.");
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf" && file.size <= 5 * 1024 * 1024,
    );
    console.log(validFiles);

    if (validFiles.length !== selectedFiles.length) {
      console.error("Only PDF files under 5MB are allowed.");
      alert("Only PDF files under 5MB are allowed.");
    }

    setFiles(validFiles);
  };

  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error("Please select a PDF file");
      return;
    }

    setIsLoading(true);
    setProgress(10);
    setStatusMessage("Preparing files...");

    try {
      const encodedFiles = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type,
          data: await encodeFileAsBase64(file),
        })),
      );

      setStatusMessage("Generating title...");

      // Generate title
      const generatedTitle = await generateQuizTitle(encodedFiles[0].name);
      setTitle(generatedTitle);

      setStatusMessage("Sending request to generate quiz...");

      // Call the new API endpoint with the enhanced parameters
      const response = await fetch("/api/generate-pdf-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: encodedFiles,
          count: questionCount,
          questionTypes: questionTypes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate quiz");
      }

      const data = await response.json();
      setQuestions(data.questions);

      // If we have a generation ID, store it for progress tracking
      if (data.generationId) {
        setGenerationId(data.generationId);
        console.log("Generation ID:", data.generationId);
        setStatusMessage("Tracking quiz generation progress...");
      } else {
        // If no generation ID, set progress to 100%
        setProgress(100);
        setStatusMessage("Quiz generation complete");
      }
    } catch (error: any) {
      console.error("Failed to generate quiz:", error);
      toast.error(error.message || "Failed to generate quiz. Please try again.");
      setFiles([]);
      setStatusMessage("Quiz generation failed");
      setProgress(0);
      setIsLoading(false);
    } finally {
      // Only set isLoading to false if we don't have a generationId
      // Otherwise, let the progress tracking handle it
      if (!generationId) {
        setIsLoading(false);
      }
    }
  };

  const clearPDF = () => {
    setFiles([]);
    setQuestions([]);
  };

  // Progress is tracked in the progress state

  if (questions.length > 0) {
    return (
      <EnhancedQuiz title={title ?? "Quiz"} questions={questions} clearPDF={clearPDF} />
    );
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex justify-center items-center pt-16"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragExit={() => setIsDragging(false)}
      onDragEnd={() => setIsDragging(false)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        console.log(e.dataTransfer.files);
        handleFileChange({
          target: { files: e.dataTransfer.files },
        } as React.ChangeEvent<HTMLInputElement>);
      }}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none dark:bg-zinc-900/90 h-dvh w-dvw z-10 justify-center items-center flex flex-col gap-1 bg-zinc-100/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>Drag and drop files here</div>
            <div className="text-sm dark:text-zinc-400 text-zinc-500">
              {"(PDFs only)"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Card className="w-full max-w-2xl h-full border-0 sm:border sm:h-fit relative">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground">
            <div className="rounded-full bg-primary/10 p-2">
              <FileUp className="h-6 w-6" />
            </div>
            <Plus className="h-4 w-4" />
            <div className="rounded-full bg-primary/10 p-2">
              <Loader2 className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              PDF Quiz Generator
            </CardTitle>
            <CardDescription className="text-base"></CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitWithFiles} className="space-y-6">
            <div
              className={`relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 transition-colors hover:border-muted-foreground/50`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{
                  color: "transparent",
                  width: "100%",
                  height: "100%",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  appearance: "none"
                }}
              />
              <FileUp className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                {files.length > 0 ? (
                  <span className="font-medium text-foreground">
                    {files[0].name}
                  </span>
                ) : (
                  <span>Drop your PDF here to upload</span>
                )}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question-count">Number of Questions: {questionCount}</Label>
                <RangeSlider
                  id="question-count"
                  min={3}
                  max={40}
                  step={1}
                  value={[questionCount]}
                  onValueChange={(value) => setQuestionCount(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>3</span>
                  <span>40</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Question Types</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  <Button
                    variant={questionTypes.includes("multiple-choice") ? "default" : "outline"}
                    onClick={() => {
                      const handleQuestionTypeToggle = (type: string) => {
                        if (questionTypes.includes(type)) {
                          // Don't remove if it's the only type selected
                          if (questionTypes.length > 1) {
                            setQuestionTypes(questionTypes.filter(t => t !== type));
                          }
                        } else {
                          setQuestionTypes([...questionTypes, type]);
                        }
                      };
                      handleQuestionTypeToggle("multiple-choice");
                    }}
                    className="text-sm h-10"
                  >
                    Multiple Choice
                  </Button>
                  <Button
                    variant={questionTypes.includes("definition") ? "default" : "outline"}
                    onClick={() => {
                      const handleQuestionTypeToggle = (type: string) => {
                        if (questionTypes.includes(type)) {
                          // Don't remove if it's the only type selected
                          if (questionTypes.length > 1) {
                            setQuestionTypes(questionTypes.filter(t => t !== type));
                          }
                        } else {
                          setQuestionTypes([...questionTypes, type]);
                        }
                      };
                      handleQuestionTypeToggle("definition");
                    }}
                    className="text-sm h-10"
                  >
                    Definition
                  </Button>
                  <Button
                    variant={questionTypes.includes("problem-solving") ? "default" : "outline"}
                    onClick={() => {
                      const handleQuestionTypeToggle = (type: string) => {
                        if (questionTypes.includes(type)) {
                          // Don't remove if it's the only type selected
                          if (questionTypes.length > 1) {
                            setQuestionTypes(questionTypes.filter(t => t !== type));
                          }
                        } else {
                          setQuestionTypes([...questionTypes, type]);
                        }
                      };
                      handleQuestionTypeToggle("problem-solving");
                    }}
                    className="text-sm h-10"
                  >
                    Problem Solving
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={files.length === 0 || questionTypes.length === 0 || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Quiz...</span>
                </span>
              ) : (
                "Generate Quiz"
              )}
            </Button>
          </form>
        </CardContent>
        {isLoading && (
          <CardFooter className="flex flex-col space-y-4">
            <div className="w-full space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="w-full space-y-2">
              <div className="grid grid-cols-6 sm:grid-cols-4 items-center space-x-2 text-sm">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isLoading ? "bg-yellow-500/50 animate-pulse" : "bg-muted"
                  }`}
                />
                <span className="text-muted-foreground text-center col-span-4 sm:col-span-2">
                  {statusMessage ? statusMessage :
                   progress < 30 ? "Analyzing PDF content" :
                   progress < 70 ? "Generating questions" :
                   progress < 95 ? "Finalizing quiz" :
                   "Completing generation"}
                </span>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      <div className="fixed top-20 left-4 z-20 mt-4">
        <Button variant="outline" size="sm" asChild className="bg-black/60 backdrop-blur-sm border-white/20">
          <NextLink href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </NextLink>
        </Button>
      </div>
    </div>
  );
}
