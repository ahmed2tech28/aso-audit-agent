export class AuditError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuditError';
  }
}

export class InvalidUrlError extends AuditError {
  constructor(message: string = 'Invalid App Store or Google Play URL') {
    super(message, 'INVALID_URL');
    this.name = 'InvalidUrlError';
  }
}

export class ScrapingError extends AuditError {
  constructor(message: string = 'Failed to scrape the app listing') {
    super(message, 'SCRAPING_FAILED');
    this.name = 'ScrapingError';
  }
}

export class WorkflowTimeoutError extends AuditError {
  constructor(message: string = 'The audit workflow timed out') {
    super(message, 'WORKFLOW_TIMEOUT');
    this.name = 'WorkflowTimeoutError';
  }
}
