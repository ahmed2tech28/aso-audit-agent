import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

export const asoScoringSkill = createTool({
  id: 'aso-scoring-skill',
  description: 'Calculates an ASO score dynamically using AI.',
  inputSchema: z.object({
    metadata: z.any(),
    reviews: z.any(),
    screenshots: z.any(),
    competitors: z.any(),
  }),
  outputSchema: z.object({
    title: z.number(),
    subtitle: z.number(),
    keywords: z.number(),
    description: z.number(),
    screenshots: z.number(),
    video: z.number(),
    ratings: z.number(),
    icon: z.number(),
    conversion: z.number(),
    competition: z.number(),
    overall: z.number(),
  }),
  execute: async (inputData) => {
    try {
      const { metadata, reviews, screenshots, competitors } = inputData;
      
      const { text } = await generateText({
        model: groq('qwen/qwen3-32b'),
        prompt: `You are an expert App Store Optimization (ASO) consultant.
        
Analyze the following app data and assign realistic scores based on ASO best practices. Be extremely critical.

Data:
Metadata: ${JSON.stringify(metadata).slice(0, 1000)}
Reviews: ${JSON.stringify(reviews).slice(0, 1000)}
Screenshots Count: ${Array.isArray(screenshots) ? screenshots.length : 0}
Competitors Count: ${Array.isArray(competitors) ? competitors.length : 0}

Assign individual component scores based on the following rules:
- title (0 to 10)
- subtitle (0 to 5)
- keywords (0 to 15)
- description (0 to 10)
- screenshots (0 to 10)
- video (0 to 5)
- ratings (0 to 15)
- icon (0 to 5)
- conversion (0 to 15)
- competition (0 to 10)
- overall (sum of the above, out of 100)

RETURN ONLY A STRICT VALID JSON OBJECT EXACTLY MATCHING THE KEYS ABOVE. DO NOT INCLUDE ANY MARKDOWN BACKTICKS OR TEXT.
`,
      });

      // Strip <think> tags and extract the JSON object to bypass Groq/Qwen limitations
      const cleanedText = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      const match = cleanedText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON object found in response');
      return JSON.parse(match[0]);
    } catch (error) {
      console.error('Error generating ASO scores:', error);
      throw new Error('Failed to generate ASO scores dynamically');
    }
  },
});
