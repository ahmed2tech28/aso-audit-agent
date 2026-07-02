import { streamText, tool, isStepCount, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { auditWorkflow } from '@/mastra/workflows/auditWorkflow';

const ASO_SYSTEM_PROMPT = `You are an App Store Optimization (ASO) Agent. Coordinate the conversation and orchestrate the ASO audit process.

Follow this strict flow:
1. Detect any Apple App Store or Google Play URLs in the user's message.
2. Call the appMetadata tool to extract the app metadata (App ID, storefront).
3. Present the extracted metadata to the user and ask: "Is this the app you meant? Reply 'yes' to start the full audit."
4. Wait for the user's confirmation.
5. When the user confirms, call the startAudit tool with the appId and storefront.
6. Once the audit completes, explain the results naturally: highlight the Overall Score, key Quick Wins, and High Impact changes.

IMPORTANT:
- Never perform scraping or scoring logic yourself.
- Keep responses concise and professional.
- Do not make up scores or recommendations.`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-1.5-pro'),
    system: ASO_SYSTEM_PROMPT,
    // convertToModelMessages converts UIMessage[] (from useChat) to model-compatible messages
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    tools: {
      appMetadata: tool({
        description: 'Extracts the App ID and storefront from an App Store or Google Play URL.',
        inputSchema: z.object({
          appUrl: z.string().describe('The App Store or Google Play URL to parse.'),
        }),
        execute: async (input) => {
          const { appUrl } = input;

          // Apple App Store URL patterns
          const appleMatch =
            appUrl.match(/apps\.apple\.com\/([a-z]{2})\/app\/[^/]+\/id(\d+)/i) ||
            appUrl.match(/apps\.apple\.com\/([a-z]{2})\/app\/id(\d+)/i);

          if (appleMatch) {
            return {
              appId: appleMatch[2],
              storefront: appleMatch[1],
              originalUrl: appUrl,
              platform: 'apple' as const,
            };
          }

          // Google Play URL patterns
          const googleMatch = appUrl.match(
            /play\.google\.com\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/i,
          );
          if (googleMatch) {
            return {
              appId: googleMatch[1],
              storefront: 'google-play',
              originalUrl: appUrl,
              platform: 'google' as const,
            };
          }

          throw new Error(`Invalid App Store or Google Play URL: ${appUrl}`);
        },
      }),

      startAudit: tool({
        description:
          'Triggers the full ASO Audit Workflow. Call this ONLY after the user has explicitly confirmed the app metadata.',
        inputSchema: z.object({
          appId: z.string().describe('The App ID extracted from the URL.'),
          storefront: z.string().optional().describe('The storefront or region code.'),
        }),
        execute: async (input) => {
          const { appId, storefront } = input;

          const run = await auditWorkflow.createRun();
          const wfResult = await run.start({
            inputData: { appId, storefront },
          });

          const auditPayload =
            (wfResult?.results as any)?.['run-recommendations']?.output?.auditPayload ?? null;

          return { success: true, appId, auditPayload };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
