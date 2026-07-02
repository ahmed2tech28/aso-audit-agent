"use client";

import { useChat } from "ai/react";
import { Messages } from "./Messages";
import { MetadataConfirmation } from "../aso/MetadataConfirmation";
import { ProgressTimeline } from "../aso/ProgressTimeline";
import { FinalReport } from "../aso/FinalReport";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SendIcon } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { useState, useEffect } from "react";
import { ProgressState, AuditPayload } from "@/lib/types";

export function ChatContainer() {
  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
    api: "/api/chat",
  });

  const [progress, setProgress] = useState<ProgressState>({
    metadata: "pending",
    listing: "pending",
    screenshots: "pending",
    reviews: "pending",
    competitors: "pending",
    scoring: "pending",
    recommendations: "pending",
    completed: false,
  });

  const [finalReport, setFinalReport] = useState<AuditPayload | null>(null);

  // We parse the messages from the useChat hook.
  // We're looking for tool calls or specific annotations indicating progress or the final report.
  useEffect(() => {
    // Note: Vercel AI SDK 3.3+ handles tool calls in `messages`. We look through all messages.
    // Progress events are streamed as data/annotations.
    // In our api/chat/route.ts we used `dataStream.writeMessageAnnotation({ type: 'progress', ... })`.
    // We can access annotations on the last assistant message.
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage?.annotations) {
      lastMessage.annotations.forEach((annotation: any) => {
        if (annotation.type === 'progress') {
          // Update progress state based on the message
          const msg = annotation.message.toLowerCase();
          setProgress(prev => {
            const next = { ...prev };
            if (msg.includes('metadata')) next.metadata = msg.includes('✓') || msg.includes('completed') ? 'completed' : 'running';
            if (msg.includes('listing')) next.listing = msg.includes('✓') || msg.includes('completed') ? 'completed' : 'running';
            if (msg.includes('screenshots')) next.screenshots = msg.includes('✓') || msg.includes('completed') ? 'completed' : 'running';
            if (msg.includes('reviews')) next.reviews = msg.includes('✓') || msg.includes('completed') ? 'completed' : 'running';
            if (msg.includes('competitors')) next.competitors = msg.includes('✓') || msg.includes('completed') ? 'completed' : 'running';
            if (msg.includes('scores')) next.scoring = msg.includes('✓') || msg.includes('completed') ? 'completed' : 'running';
            if (msg.includes('recommendations')) next.recommendations = msg.includes('✓') || msg.includes('completed') ? 'completed' : 'running';
            if (msg.includes('completed')) next.completed = true;
            return next;
          });
        } else if (annotation.type === 'auditResult') {
          setFinalReport(annotation.result);
          setProgress(p => ({ ...p, completed: true }));
        }
      });
    }
  }, [messages]);

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left side: Chat Interface */}
      <div className="flex w-full max-w-md flex-col border-r shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-xl font-bold">ASO Audit Agent</h2>
          <p className="text-sm text-muted-foreground">Drop an App Store URL to begin.</p>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <Messages messages={messages} />
        </ScrollArea>
        
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="e.g. https://apps.apple.com/us/app/id123456789"
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <SendIcon className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right side: Visualization Area */}
      <div className="flex-1 p-6 overflow-auto bg-muted/20">
        {!finalReport && !progress.completed && progress.metadata !== 'pending' && (
          <div className="max-w-2xl mx-auto mt-10">
            <ProgressTimeline state={progress} />
          </div>
        )}
        
        {finalReport && (
          <div className="max-w-5xl mx-auto">
            <FinalReport payload={finalReport} />
          </div>
        )}

        {!finalReport && progress.metadata === 'pending' && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>No audit in progress.</p>
              <p className="text-sm">Submit an app URL to the agent to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
