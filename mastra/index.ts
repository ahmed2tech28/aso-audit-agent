import { Mastra } from '@mastra/core';
import { asoAgent } from './agents/asoAgent';
import { auditWorkflow } from './workflows/auditWorkflow';

/**
 * Minimal, production-ready Mastra instance.
 * Agents and tools can be registered here as they are implemented.
 */
export const mastra = new Mastra({
  agents: {
    asoAgent,
  },
  workflows: {
    auditWorkflow,
  },
});
