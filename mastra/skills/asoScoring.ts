import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';

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
      
      const { object } = await generateObject({
        model: google('gemini-1.5-pro'),
        schema: z.object({
          title: z.number().describe('Score from 0 to 10 for the app title.'),
          subtitle: z.number().describe('Score from 0 to 5 for the app subtitle.'),
          keywords: z.number().describe('Score from 0 to 15 for keyword optimization.'),
          description: z.number().describe('Score from 0 to 10 for the app description.'),
          screenshots: z.number().describe('Score from 0 to 10 for screenshots quality.'),
          video: z.number().describe('Score from 0 to 5 for preview videos.'),
          ratings: z.number().describe('Score from 0 to 15 for ratings and reviews sentiment.'),
          icon: z.number().describe('Score from 0 to 5 for app icon quality.'),
          conversion: z.number().describe('Score from 0 to 15 for estimated conversion rate.'),
          competition: z.number().describe('Score from 0 to 10 for competition standing.'),
          overall: z.number().describe('Overall score out of 100.'),
        }),
        prompt: `You are an expert App Store Optimization (ASO) consultant.
        
Analyze the following app data and assign realistic scores based on ASO best practices. Be extremely critical.

Data:
Metadata: ${JSON.stringify(metadata).slice(0, 1000)}
Reviews: ${JSON.stringify(reviews).slice(0, 1000)}
Screenshots Count: ${Array.isArray(screenshots) ? screenshots.length : 0}
Competitors Count: ${Array.isArray(competitors) ? competitors.length : 0}

Assign individual component scores based on the requested maximums, and then sum them to calculate the overall score out of 100.
`,
      });

      return object;
    } catch (error) {
      console.error('Error generating ASO scores:', error);
      throw new Error('Failed to generate ASO scores dynamically');
    }
  },
});
