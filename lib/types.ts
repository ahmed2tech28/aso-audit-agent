import { z } from 'zod';

export const RecommendationSchema = z.object({
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
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const ScoresSchema = z.object({
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
});
export type Scores = z.infer<typeof ScoresSchema>;

export const AuditPayloadSchema = z.object({
  listingData: z.any(),
  screenshots: z.array(z.string()),
  reviews: z.array(z.any()),
  competitors: z.array(z.any()),
  scores: ScoresSchema,
  recommendations: z.object({
    quickWins: z.array(RecommendationSchema),
    highImpact: z.array(RecommendationSchema),
    strategic: z.array(RecommendationSchema),
  }),
});
export type AuditPayload = z.infer<typeof AuditPayloadSchema>;

// Progress tracking types
export type ProgressStepStatus = 'pending' | 'running' | 'completed' | 'error';

export interface ProgressState {
  metadata: ProgressStepStatus;
  listing: ProgressStepStatus;
  screenshots: ProgressStepStatus;
  reviews: ProgressStepStatus;
  competitors: ProgressStepStatus;
  scoring: ProgressStepStatus;
  recommendations: ProgressStepStatus;
  completed: boolean;
}

// Tool Inputs
export const MetadataInputSchema = z.object({
  appUrl: z.string().url(),
});

// Discriminated union for generic workflow events (if needed by frontend)
export type WorkflowEvent = 
  | { type: 'step_start'; stepId: string }
  | { type: 'step_end'; stepId: string; result?: any }
  | { type: 'error'; stepId: string; error: string };
