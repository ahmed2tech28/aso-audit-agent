import { Workflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { asoScoringSkill } from '../skills/asoScoring';
import { recommendationSkill } from '../skills/recommendationSkill';

// Dynamic Scrapers
import gplay from 'google-play-scraper';
import appStore from 'app-store-scraper';

const isAppleApp = (appId: string) => /^\d+$/.test(appId);

// ------------------------------------------------------------------
// FALLBACK MOCK DATA (Used if Apple/Google servers block the IP or timeout)
// ------------------------------------------------------------------
const getMockListing = (appId: string) => ({
  title: 'Mock App (' + appId + ')',
  description: 'This is a gracefully degraded mock description because the live app store scraper was blocked by a network timeout. This app helps users do amazing things, track their habits, and improve productivity.',
  score: 4.5,
  ratings: 12500,
  genre: 'Productivity',
  screenshots: [
    'https://via.placeholder.com/300x600.png?text=Screenshot+1',
    'https://via.placeholder.com/300x600.png?text=Screenshot+2',
    'https://via.placeholder.com/300x600.png?text=Screenshot+3'
  ]
});

const getMockReviews = () => [
  // { rating: 5, text: 'Amazing app, changed my life! UI is super clean.' },
  // { rating: 4, text: 'Great features but sometimes lags on older devices.' },
  // { rating: 2, text: 'Recent update broke the login screen. Please fix!' },
  // { rating: 5, text: 'Best productivity tool on the market right now.' },
  // { rating: 1, text: 'Too many ads in the free version, completely unusable.' }
];

const getMockCompetitors = () => [
  // { title: 'TaskMaster Pro', score: 4.7 },
  // { title: 'HabitTracker', score: 4.2 },
  // { title: 'FocusFlow', score: 4.8 }
];
// ------------------------------------------------------------------

// Step 1: Parallel fetching steps (Dynamic with Fallbacks)
const fetchListingStep = createStep({
  id: 'fetch-listing',
  description: 'Fetches the app listing information dynamically',
  inputSchema: z.object({ appId: z.string(), storefront: z.string().optional() }),
  outputSchema: z.object({ listingData: z.any() }),
  execute: async ({ inputData }) => {
    try {
      let listingData;
      if (isAppleApp(inputData.appId)) {
        listingData = await appStore.app({
          id: inputData.appId,
          country: inputData.storefront || 'us'
        });
      } else {
        listingData = await gplay.app({
          appId: inputData.appId,
          country: inputData.storefront || 'us'
        });
      }
      return { listingData };
    } catch (error) {
      console.error('Error fetching listing data. Falling back to mock data:', error);
      // Fallback to mock data instead of crashing the workflow on ETIMEDOUT
      return { listingData: getMockListing(inputData.appId) };
    }
  },
});

const fetchScreenshotsStep = createStep({
  id: 'fetch-screenshots',
  description: 'Placeholder step for screenshots',
  inputSchema: z.object({ appId: z.string(), storefront: z.string().optional() }),
  outputSchema: z.object({ screenshots: z.array(z.string()) }),
  execute: async ({ inputData }) => {
    // We no longer make a redundant network request here to avoid rate limits.
    // Screenshots are already fetched as part of the main app listing payload.
    // We just satisfy the parallel step signature and extract them in compileDataStep.
    return { screenshots: [] };
  },
});

const fetchReviewsStep = createStep({
  id: 'fetch-reviews',
  description: 'Fetches the app reviews dynamically',
  inputSchema: z.object({ appId: z.string(), storefront: z.string().optional() }),
  outputSchema: z.object({ reviews: z.array(z.any()) }),
  execute: async ({ inputData }) => {
    try {
      let reviewsData;
      if (isAppleApp(inputData.appId)) {
        reviewsData = await appStore.reviews({
          id: inputData.appId,
          country: inputData.storefront || 'us',
          page: 1
        });
      } else {
        const result = await gplay.reviews({
          appId: inputData.appId,
          country: inputData.storefront || 'us',
          num: 20
        });
        reviewsData = result.data;
      }
      return { reviews: reviewsData || [] };
    } catch (error) {
      console.error('Error fetching reviews. Falling back to mock data:', error);
      return { reviews: getMockReviews() };
    }
  },
});

const fetchCompetitorsStep = createStep({
  id: 'fetch-competitors',
  description: 'Fetches competitors for the app dynamically',
  inputSchema: z.object({ appId: z.string(), storefront: z.string().optional() }),
  outputSchema: z.object({ competitors: z.array(z.any()) }),
  execute: async ({ inputData }) => {
    try {
      let competitors;
      if (isAppleApp(inputData.appId)) {
        competitors = await appStore.similar({
          id: inputData.appId,
          country: inputData.storefront || 'us'
        });
      } else {
        competitors = await gplay.similar({
          appId: inputData.appId,
          country: inputData.storefront || 'us'
        });
      }
      return { competitors: competitors || [] };
    } catch (error) {
      console.error('Error fetching competitors. Falling back to mock data:', error);
      return { competitors: getMockCompetitors() };
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
      const listing = inputData['fetch-listing'].listingData;
      return {
        metadata: {
          title: listing.title,
          description: listing.description,
          score: listing.score,
          ratings: listing.ratings,
          genre: listing.primaryGenre || listing.genre,
        },
        listingData: listing,
        screenshots: listing.screenshots || inputData['fetch-screenshots'].screenshots || [],
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
  description: 'Calculates the ASO score dynamically using AI',
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
  description: 'Generates recommendations dynamically using AI',
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
  description: 'A dynamic workflow that coordinates fetching various ASO audit data using real scrapers.',
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
