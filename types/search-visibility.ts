export type SearchVisibilityResponse = {
  jobId: string;
  runId: string;
  publicAccessToken: string;
  report: {
    status: 'PENDING' | 'COLLECTING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
    progress: number;
    currentStep: string;
  };
};

export type VisibilityReportResult = {
  overallScore: number;
  scoreLabel: 'Hidden' | 'Low' | 'Moderate' | 'Strong' | 'Dominant';
  summary: string;
  overview: {
    promptsChecked: number;
    brandMentions: number;
    websiteCitations: number;
    competitorsFound: number;
  };
  platformResults: Array<{
    platform: 'ChatGPT' | 'Gemini';
    score: number;
    promptsChecked: number;
    mentions: number;
    citations: number;
  }>;
  promptResults: Array<{
    prompt: string;
    platforms: Array<'ChatGPT' | 'Gemini'>;
    status: 'Mentioned' | 'Opportunity';
    evidence: string;
  }>;
  competitors: Array<{
    name: string;
    domain?: string;
    mentions: number;
    score: number;
  }>;
  recommendations: string[];
};
