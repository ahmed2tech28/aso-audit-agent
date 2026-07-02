import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const asoScoringSkill = createTool({
  id: 'aso-scoring-skill',
  description: 'Calculates an ASO score out of 100 from various inputs.',
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
  execute: async ({ inputData }) => {
    const { metadata, reviews, screenshots, competitors } = inputData;
    
    // The implementation would dynamically calculate these based on the inputs.
    // We define maximum weights that sum to 100 for normalization.
    const maxWeights = {
      title: 10,
      subtitle: 5,
      keywords: 15,
      description: 10,
      screenshots: 10,
      video: 5,
      ratings: 15,
      icon: 5,
      conversion: 15,
      competition: 10,
    };

    // Scaffolding: assume some calculated raw scores between 0 and 1
    const rawScores = {
      title: 0.8,
      subtitle: 0.9,
      keywords: 0.7,
      description: 0.85,
      screenshots: Array.isArray(screenshots) && screenshots.length > 0 ? 0.9 : 0.0,
      video: 0.0, // Assuming no video initially
      ratings: Array.isArray(reviews) && reviews.length > 0 ? 0.8 : 0.5,
      icon: 0.95,
      conversion: 0.75,
      competition: Array.isArray(competitors) && competitors.length > 0 ? 0.6 : 0.8,
    };

    // Calculate final scores by applying weights
    const scores = {
      title: rawScores.title * maxWeights.title,
      subtitle: rawScores.subtitle * maxWeights.subtitle,
      keywords: rawScores.keywords * maxWeights.keywords,
      description: rawScores.description * maxWeights.description,
      screenshots: rawScores.screenshots * maxWeights.screenshots,
      video: rawScores.video * maxWeights.video,
      ratings: rawScores.ratings * maxWeights.ratings,
      icon: rawScores.icon * maxWeights.icon,
      conversion: rawScores.conversion * maxWeights.conversion,
      competition: rawScores.competition * maxWeights.competition,
    };

    // Normalize to 100
    const totalMax = Object.values(maxWeights).reduce((a, b) => a + b, 0);
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    
    const overall = (totalScore / totalMax) * 100;

    return {
      title: Number(scores.title.toFixed(2)),
      subtitle: Number(scores.subtitle.toFixed(2)),
      keywords: Number(scores.keywords.toFixed(2)),
      description: Number(scores.description.toFixed(2)),
      screenshots: Number(scores.screenshots.toFixed(2)),
      video: Number(scores.video.toFixed(2)),
      ratings: Number(scores.ratings.toFixed(2)),
      icon: Number(scores.icon.toFixed(2)),
      conversion: Number(scores.conversion.toFixed(2)),
      competition: Number(scores.competition.toFixed(2)),
      overall: Number(overall.toFixed(2)),
    };
  },
});
