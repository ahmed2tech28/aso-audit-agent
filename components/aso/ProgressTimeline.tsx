"use client";

import { ProgressState } from "@/lib/types";
import { CheckCircle2Icon, CircleIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ProgressTimelineProps {
  state: ProgressState;
}

export function ProgressTimeline({ state }: ProgressTimelineProps) {
  const steps = [
    { key: "metadata", label: "Fetching Metadata" },
    { key: "listing", label: "Scraping Listing" },
    { key: "screenshots", label: "Reading Screenshots" },
    { key: "reviews", label: "Analyzing Reviews" },
    { key: "competitors", label: "Finding Competitors" },
    { key: "scoring", label: "Calculating Scores" },
    { key: "recommendations", label: "Generating Recommendations" },
  ];

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {state.completed ? (
            <>
              <CheckCircle2Icon className="w-6 h-6 text-green-500" />
              Audit Complete
            </>
          ) : (
            <>
              <Loader2Icon className="w-6 h-6 animate-spin text-primary" />
              Audit in Progress
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {steps.map((step, index) => {
            const status = state[step.key as keyof ProgressState];
            const isCompleted = status === "completed";
            const isRunning = status === "running";
            
            return (
              <div key={step.key} className="flex items-center gap-3 relative">
                {/* Connector Line */}
                {index !== steps.length - 1 && (
                  <div 
                    className={cn(
                      "absolute left-3 top-7 bottom-[-16px] w-[2px]",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )} 
                  />
                )}
                
                <div className="z-10 bg-card rounded-full">
                  {isCompleted ? (
                    <CheckCircle2Icon className="w-6 h-6 text-primary" />
                  ) : isRunning ? (
                    <Loader2Icon className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <CircleIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                
                <p className={cn(
                  "font-medium transition-colors duration-300",
                  isCompleted ? "text-foreground" : isRunning ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
