"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LLMProviderToggle() {
  const [provider, setProvider] = useState<string>("openrouter");
  const [isLoading, setIsLoading] = useState(false);

  // Load the current provider from localStorage on component mount
  useEffect(() => {
    const savedProvider = localStorage.getItem("llm-provider");
    if (savedProvider) {
      setProvider(savedProvider);
    }
  }, []);

  const toggleProvider = async () => {
    setIsLoading(true);

    try {
      // Toggle between providers
      const newProvider = provider === "openrouter" ? "replicate" : "openrouter";

      // Save to localStorage first (client-side state)
      localStorage.setItem("llm-provider", newProvider);

      // Update the server-side environment variable
      try {
        const response = await fetch("/api/update-llm-provider", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ provider: newProvider }),
        });

        if (!response.ok) {
          // Try to get error details
          let errorMessage = "Failed to update provider on server";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
          }
          console.warn(errorMessage + " (continuing with client-side only)");
        } else {
          console.log("Provider updated successfully on server");
        }
      } catch (fetchError) {
        // If server update fails, we still have the localStorage update
        console.warn("Error updating provider on server:", fetchError, "(continuing with client-side only)");
      }

      // Update state regardless of server success
      setProvider(newProvider);
    } catch (error) {
      console.error("Error toggling provider:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlowingEffect>
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="llm-provider-toggle" className="text-sm font-medium">
                LLM Provider: {provider === "openrouter" ? "OpenRouter" : "Replicate"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {provider === "openrouter"
                  ? "Using OpenRouter (Llama 4)"
                  : "Using Replicate (Llama 3)"}
              </p>
            </div>
            <Button
              variant={provider === "replicate" ? "default" : "outline"}
              onClick={toggleProvider}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {provider === "openrouter" ? "Switch to Replicate" : "Switch to OpenRouter"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </GlowingEffect>
  );
}
