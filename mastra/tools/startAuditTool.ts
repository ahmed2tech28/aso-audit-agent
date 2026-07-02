import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// We just return a special structure that the Next.js Route Handler can intercept 
// to manually stream workflow execution, or we just let the agent stream natively.
// Since workflow execution might take time and we want to stream progress,
// we'll return a command object.
export const startAuditTool = createTool({
  id: 'start-audit',
  description: 'Triggers the ASO Audit Workflow. Call this ONLY after the user has explicitly confirmed the app metadata.',
  inputSchema: z.object({
    appId: z.string(),
    storefront: z.string().optional(),
  }),
  outputSchema: z.object({
    auditStarted: z.boolean(),
    appId: z.string(),
    storefront: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    // We return a structured response indicating the audit has started.
    // The Route Handler will intercept this tool call and run the workflow in the background,
    // sending progress events via custom stream chunks.
    return {
      auditStarted: true,
      appId: inputData.appId,
      storefront: inputData.storefront,
    };
  }
});
