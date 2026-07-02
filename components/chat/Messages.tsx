"use client";

import { Message } from "ai";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { MetadataConfirmation } from "../aso/MetadataConfirmation";

export function Messages({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground gap-2">
        <p>Hi! I'm your ASO Audit Agent.</p>
        <p className="text-sm">Paste an App Store or Google Play URL to start.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => {
        const isUser = message.role === "user";
        
        // Check if there are tool calls in this message
        const toolCalls = message.toolInvocations || [];
        
        return (
          <div key={message.id} className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
            {message.content && (
              <div
                className={cn(
                  "rounded-lg px-4 py-3 max-w-[90%] text-sm",
                  isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    a: ({ node, ...props }) => <a className="underline font-semibold" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
            
            {/* Render any special tool UI like MetadataConfirmation */}
            {toolCalls.map((toolCall) => {
              if (toolCall.toolName === "appMetadata" && toolCall.state === "result") {
                // Renders the confirmation card with extracted metadata
                return (
                  <MetadataConfirmation 
                    key={toolCall.toolCallId} 
                    result={toolCall.result} 
                  />
                );
              }
              return null;
            })}
          </div>
        );
      })}
    </div>
  );
}
