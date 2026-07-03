import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { generateObject } from 'ai';
import { groq } from '@ai-sdk/groq';

const RecommendationSchema = z.object({
  title: z.string(),
  category: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  effort: z.enum(['high', 'medium', 'low']),
  impact: z.enum(['high', 'medium', 'low']),
  evidence: z.string(),
  reasoning: z.string(),
  before: z.string().optional(),
  after: z.string().optional(),
});

export const recommendationSkill = createTool({
  id: 'recommendation-skill',
  description: 'Generates actionable ASO recommendations based on audit data using AI.',
  inputSchema: z.object({
    metadata: z.any(),
    scores: z.any(),
    reviews: z.any(),
    screenshots: z.any(),
    competitors: z.any(),
  }),
  outputSchema: z.object({
    quickWins: z.array(RecommendationSchema),
    highImpact: z.array(RecommendationSchema),
    strategic: z.array(RecommendationSchema),
  }),
  execute: async (inputData) => {
    try {
      const { metadata, scores, reviews, screenshots, competitors } = inputData;
      
      const { object } = await generateObject({
        model: groq('qwen/qwen3-32b'),
        schema: z.object({
          quickWins: z.array(RecommendationSchema).describe('1 to 3 quick win recommendations.'),
          highImpact: z.array(RecommendationSchema).describe('1 to 3 high impact recommendations.'),
          strategic: z.array(RecommendationSchema).describe('1 to 3 long-term strategic recommendations.'),
        }),
        prompt: `You are an expert App Store Optimization (ASO) consultant.
        
Analyze the following app data and AI-generated scores.
Generate hyper-specific, actionable recommendations tailored exactly to the app's current weak points.
If the subtitle scored low, generate a subtitle recommendation with a "before" and "after" string.
If the reviews mention bugs, generate a strategic recommendation to fix them.

Data:
Scores: ${JSON.stringify(scores)}
Metadata: ${JSON.stringify(metadata).slice(0, 500)}
Reviews: ${JSON.stringify(reviews).slice(0, 1000)}
Competitors Count: ${Array.isArray(competitors) ? competitors.length : 0}

Ensure you strictly follow the output schema constraints.
`,
      });

      return object;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate ASO recommendations');
    }
  }
});
