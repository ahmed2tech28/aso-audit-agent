import { Workflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { asoScoringSkill } from '../skills/asoScoring';
import { recommendationSkill } from '../skills/recommendationSkill';

// Step 1: Parallel fetching steps (Scaffolding)
const fetchListingStep = createStep({
  id: 'fetch-listing',
  description: 'Fetches the app listing information',
  inputSchema: z.object({ appId: z.string(), storefront: z.string().optional() }),
  outputSchema: z.object({ listingData: z.any() }),
  execute: async ({ inputData }) => {
    try {
      // Scaffold: Fetch listing info
      return { listingData: { status: 'fetched', title: 'Sample App', subtitle: 'A great app' } };
    } catch (error) {
      console.error('Error fetching listing data:', error);
      throw new Error('Failed to fetch listing data');
    }
  },
});

const fetchScreenshotsStep = createStep({
  id: 'fetch-screenshots',
  description: 'Fetches the app screenshots',
  inputSchema: z.object({ appId: z.string(), storefront: z.string().optional() }),
  outputSchema: z.object({ screenshots: z.array(z.string()) }),
  execute: async ({ inputData }) => {
    try {
      // Scaffold: Fetch screenshots
      return { screenshots: ['img1.png', 'img2.png'] };
    } catch (error) {
      console.error('Error fetching screenshots:', error);
      throw new Error('Failed to fetch screenshots');
    }
  },
});

const fetchReviewsStep = createStep({
  id: 'fetch-reviews',
  description: 'Fetches the app reviews',
  inputSchema: z.object({ appId: z.string(), storefront: z.string().optional() }),
  outputSchema: z.object({ reviews: z.array(z.any()) }),
  execute: async ({ inputData }) => {
    try {
      // Scaffold: Fetch reviews
      return { reviews: [{ rating: 5, comment: 'Great app!' }] };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw new Error('Failed to fetch reviews');
    }
  },
});

const fetchCompetitorsStep = createStep({
  id: 'fetch-competitors',
  description: 'Fetches competitors for the app',
  inputSchema: z.object({ appId: z.string(), storefront: z.string().optional() }),
  outputSchema: z.object({ competitors: z.array(z.any()) }),
  execute: async ({ inputData }) => {
    try {
      // Scaffold: Fetch competitors
      return { competitors: [{ id: 'comp1', title: 'Competitor App' }] };
    } catch (error) {
      console.error('Error fetching competitors:', error);
      throw new Error('Failed to fetch competitors');
    }
  },
});

// Step 2: Compile intermediate data into a structure the scoring skill can use
const compileDataStep = createStep({
  id: 'compile-data',
  description: 'Compiles fetched data into structured format for scoring',
  inputSchema: z.object({
    'fetch-listing': z.object({ listingData: z.any() }),
    'fetch-screenshots': z.object({ screenshots: z.array(z.string()) }),
    'fetch-reviews': z.object({ reviews: z.array(z.any()) }),
    'fetch-competitors': z.object({ competitors: z.array(z.any()) }),
  }),
  outputSchema: z.object({
    metadata: z.any(),
    listingData: z.any(),
    screenshots: z.array(z.string()),
    reviews: z.array(z.any()),
    competitors: z.array(z.any()),
  }),
  execute: async ({ inputData }) => {
    try {
      return {
        metadata: inputData['fetch-listing'].listingData, // Using listing data as metadata proxy
        listingData: inputData['fetch-listing'].listingData,
        screenshots: inputData['fetch-screenshots'].screenshots,
        reviews: inputData['fetch-reviews'].reviews,
        competitors: inputData['fetch-competitors'].competitors,
      };
    } catch (error) {
      console.error('Error compiling data:', error);
      throw new Error('Failed to compile audit data');
    }
  },
});

// Step 3: Run Scoring
const scoringStep = createStep({
  id: 'run-scoring',
  description: 'Calculates the ASO score',
  inputSchema: z.object({
    metadata: z.any(),
    listingData: z.any(),
    screenshots: z.array(z.string()),
    reviews: z.array(z.any()),
    competitors: z.array(z.any()),
  }),
  outputSchema: z.object({
    scores: z.any(),
    metadata: z.any(),
    listingData: z.any(),
    screenshots: z.array(z.string()),
    reviews: z.array(z.any()),
    competitors: z.array(z.any()),
  }),
  execute: async ({ inputData, mastra, requestContext }) => {
    try {
      const result = await asoScoringSkill.execute!(
        {
          metadata: inputData.metadata,
          reviews: inputData.reviews,
          screenshots: inputData.screenshots,
          competitors: inputData.competitors,
        },
        { 
          runId: '', mastra: mastra as any, 
          requestContext: requestContext as any, 
          engine: {} as any, abortSignal: new AbortController().signal 
        } as any
      );
      
      return {
        scores: result,
        ...inputData
      };
    } catch (error) {
      console.error('Error during scoring step:', error);
      throw new Error('Failed to calculate ASO scores');
    }
  }
});

// Step 4: Run Recommendations
const recommendationStep = createStep({
  id: 'run-recommendations',
  description: 'Generates recommendations',
  inputSchema: z.object({
    metadata: z.any(),
    listingData: z.any(),
    screenshots: z.array(z.string()),
    reviews: z.array(z.any()),
    competitors: z.array(z.any()),
    scores: z.any(),
  }),
  outputSchema: z.object({
    auditPayload: z.object({
      listingData: z.any(),
      screenshots: z.array(z.string()),
      reviews: z.array(z.any()),
      competitors: z.array(z.any()),
      scores: z.any(),
      recommendations: z.any(),
    }),
  }),
  execute: async ({ inputData, mastra, requestContext }) => {
    try {
      const result = await recommendationSkill.execute!(
        {
          metadata: inputData.metadata,
          scores: inputData.scores,
          reviews: inputData.reviews,
          screenshots: inputData.screenshots,
          competitors: inputData.competitors,
        },
        { 
          runId: '', mastra: mastra as any, 
          requestContext: requestContext as any, 
          engine: {} as any, abortSignal: new AbortController().signal 
        } as any
      );

      return {
        auditPayload: {
          listingData: inputData.listingData,
          screenshots: inputData.screenshots,
          reviews: inputData.reviews,
          competitors: inputData.competitors,
          scores: inputData.scores,
          recommendations: result,
        }
      };
    } catch (error) {
      console.error('Error during recommendations step:', error);
      throw new Error('Failed to generate ASO recommendations');
    }
  }
});

export const auditWorkflow = new Workflow({
  id: 'audit-workflow',
  description: 'A workflow that coordinates fetching various ASO audit data.',
  inputSchema: z.object({
    appId: z.string(),
    storefront: z.string().optional(),
  }),
  outputSchema: z.any(),
})
  .parallel([
    fetchListingStep,
    fetchScreenshotsStep,
    fetchReviewsStep,
    fetchCompetitorsStep,
  ])
  .then(compileDataStep)
  .then(scoringStep)
  .then(recommendationStep)
  .commit();
