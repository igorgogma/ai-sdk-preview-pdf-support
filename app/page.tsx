"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { BookOpen, FileUp } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <main className="container mx-auto px-4 py-24 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">IB DP Study Helper</h1>
          <p className="text-xl text-muted-foreground">
            Generate quizzes for Chemistry, Physics, and Biology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          <Card className="w-full relative">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <BookOpen className="h-7 w-7" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Science Quiz Generator</CardTitle>
              <CardDescription className="text-base mt-2">
                Create custom quizzes on any IB DP science topic
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Button asChild className="w-full">
                <Link href="/science-quiz">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="w-full relative">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <FileUp className="h-7 w-7" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">PDF Quiz Generator</CardTitle>
              <CardDescription className="text-base mt-2">
                Upload a PDF to generate a quiz based on its content
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Button asChild className="w-full">
                <Link href="/pdf-quiz">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
