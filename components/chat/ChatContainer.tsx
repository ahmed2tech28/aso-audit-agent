"use client";

import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { Messages } from "./Messages";
import { ProgressTimeline } from "../aso/ProgressTimeline";
import { FinalReport } from "../aso/FinalReport";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SendIcon, BotIcon } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import { AuditPayload, ProgressState } from "@/lib/types";

export function ChatContainer() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({ api: "/api/chat" });

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
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Parse tool results from the new v7 UIMessage parts API
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;

      for (const part of message.parts) {
        // appMetadata call — show progress started
        if (
          part.type === "tool-invocation" &&
          part.toolInvocationId &&
          (part as any).toolName === "appMetadata" &&
          (part as any).state === "result"
        ) {
          setProgress((p) => ({ ...p, metadata: "completed" }));
        }

        // startAudit call — show all steps as running then completed
        if (
          part.type === "tool-invocation" &&
          part.toolInvocationId &&
          (part as any).toolName === "startAudit"
        ) {
          const state = (part as any).state;
          if (state === "call") {
            setProgress((p) => ({
              ...p,
              metadata: "completed",
              listing: "running",
              screenshots: "running",
              reviews: "running",
              competitors: "running",
            }));
          } else if (state === "result") {
            const result = (part as any).result;
            setProgress({
              metadata: "completed",
              listing: "completed",
              screenshots: "completed",
              reviews: "completed",
              competitors: "completed",
              scoring: "completed",
              recommendations: "completed",
              completed: true,
            });

            if (result?.auditPayload) {
              setFinalReport(result.auditPayload as AuditPayload);
            }
          }
        }
      }
    }
  }, [messages]);

  const showProgress =
    progress.metadata !== "pending" && !finalReport;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Left: Chat */}
      <div className="flex w-full max-w-md flex-col border-r border-border shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <BotIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sm">ASO Audit Agent</h2>
            <p className="text-xs text-muted-foreground">Powered by Gemini</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          <Messages messages={messages as UIMessage[]} />
          <div ref={bottomRef} />
        </ScrollArea>

        {/* Input */}
        <div className="border-t px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Paste an App Store URL…"
              className="flex-1 text-sm"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !input.trim()}
              className="shrink-0"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right: Visualization */}
      <div className="flex-1 overflow-auto bg-muted/20 p-6">
        {finalReport ? (
          <div className="mx-auto max-w-5xl">
            <FinalReport payload={finalReport} />
          </div>
        ) : showProgress ? (
          <div className="mx-auto mt-10 max-w-2xl">
            <ProgressTimeline state={progress} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <div className="space-y-2">
              <BotIcon className="mx-auto h-12 w-12 opacity-20" />
              <p className="font-medium">No audit in progress</p>
              <p className="text-sm">
                Paste an App Store or Google Play URL in the chat to begin.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
