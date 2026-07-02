import { createDataStreamResponse, streamText, tool } from 'ai';
import { mastra } from '@/mastra';
import { auditWorkflow } from '@/mastra/workflows/auditWorkflow';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const agent = mastra.getAgent('asoAgent');
  
  // Resolve model and instructions from the Mastra agent
  const model = await agent.getModel();
  const instructions = await agent.getInstructions();
  const mastraTools = await agent.listTools();

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const result = streamText({
        model: model as any, // Cast to any to bypass strict type mismatch if any
        system: instructions as string,
        messages,
        tools: {
          appMetadata: tool({
            description: mastraTools.appMetadata.description,
            parameters: mastraTools.appMetadata.inputSchema as any,
            execute: async (args) => {
              // Extract the inner Mastra tool execute function
              return await mastraTools.appMetadata.execute({
                inputData: args,
                runId: 'req',
                mastra: mastra,
                requestContext: {},
                engine: {} as any,
                abortSignal: new AbortController().signal
              } as any);
            },
          }),
          startAudit: tool({
            description: mastraTools.startAudit.description,
            parameters: mastraTools.startAudit.inputSchema as any,
            execute: async (args) => {
              // Stream progress events to the client
              dataStream.writeMessageAnnotation({ type: 'progress', message: 'Fetching metadata...' });
              await new Promise((r) => setTimeout(r, 800));
              
              dataStream.writeMessageAnnotation({ type: 'progress', message: 'Scraping listing...' });
              await new Promise((r) => setTimeout(r, 800));

              dataStream.writeMessageAnnotation({ type: 'progress', message: 'Reading screenshots...' });
              await new Promise((r) => setTimeout(r, 800));

              dataStream.writeMessageAnnotation({ type: 'progress', message: 'Finding competitors...' });
              await new Promise((r) => setTimeout(r, 800));

              dataStream.writeMessageAnnotation({ type: 'progress', message: 'Calculating scores...' });
              
              // Execute the actual workflow
              const run = await auditWorkflow.createRun();
              const wfResult = await run.start({ triggerData: { appId: args.appId, storefront: args.storefront } });
              
              dataStream.writeMessageAnnotation({ type: 'progress', message: 'Generating recommendations...' });
              await new Promise((r) => setTimeout(r, 800));
              
              dataStream.writeMessageAnnotation({ type: 'progress', message: 'Completed' });

              // Send the final result as a special annotation to render the UI components
              dataStream.writeMessageAnnotation({ type: 'auditResult', result: wfResult.results });

              // Return a simple summary to the LLM so it doesn't try to parse the entire massive JSON
              return { 
                success: true, 
                message: 'Audit completed successfully. The UI is now rendering the final report. Give the user a short, friendly summary of the overall score and 1 or 2 quick wins. Do not dump the raw data.' 
              };
            },
          }),
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}
