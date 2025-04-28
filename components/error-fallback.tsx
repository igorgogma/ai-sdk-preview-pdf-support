"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export default function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center space-x-2 text-destructive mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive font-medium">{error.message || "An unexpected error occurred"}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>This could be due to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>API rate limits</li>
              <li>Network connectivity issues</li>
              <li>Invalid API key</li>
              <li>Server-side errors</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
