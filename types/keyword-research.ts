export type KeywordResearchResponse = {
  jobId: string;
  runId: string;
  publicAccessToken: string;
  report: {
    status: 'PENDING' | 'COLLECTING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
    progress: number;
    currentStep: string;
  };
};
