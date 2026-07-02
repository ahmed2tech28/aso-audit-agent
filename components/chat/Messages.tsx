"use client";

import { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { MetadataConfirmation } from "../aso/MetadataConfirmation";
import { Loader2Icon } from "lucide-react";

interface MessagesProps {
  messages: UIMessage[];
}

export function Messages({ messages }: MessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
        <p className="font-medium">Hi! I'm your ASO Audit Agent.</p>
        <p className="text-sm">
          Paste an App Store or Google Play URL to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => {
        const isUser = message.role === "user";

        return (
          <div
            key={message.id}
            className={cn(
              "flex flex-col gap-2",
              isUser ? "items-end" : "items-start"
            )}
          >
            {message.parts.map((part, idx) => {
              // Text parts
              if (part.type === "text" && part.text) {
                return (
                  <div
                    key={idx}
                    className={cn(
                      "max-w-[90%] rounded-2xl px-4 py-2.5 text-sm",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => (
                          <p className="mb-1.5 last:mb-0" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="mb-2 list-disc pl-4" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="mb-0.5" {...props} />
                        ),
                      }}
                    >
                      {part.text}
                    </ReactMarkdown>
                  </div>
                );
              }

              // Tool invocation parts
              if (part.type === "tool-invocation") {
                const toolPart = part as any;
                const { toolName, state, result } = toolPart;

                if (toolName === "appMetadata") {
                  if (state === "call") {
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Loader2Icon className="h-3 w-3 animate-spin" />
                        Detecting app…
                      </div>
                    );
                  }
                  if (state === "result" && result) {
                    return (
                      <MetadataConfirmation key={idx} result={result} />
                    );
                  }
                }

                if (toolName === "startAudit") {
                  if (state === "call") {
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Loader2Icon className="h-3 w-3 animate-spin" />
                        Running audit workflow…
                      </div>
                    );
                  }
                }
              }

              return null;
            })}
          </div>
        );
      })}
    </div>
  );
}
