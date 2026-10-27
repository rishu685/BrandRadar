export type ReportListType = 'keyword' | 'visibility';
export type ReportListStatus = 'processing' | 'completed' | 'failed';

export type ReportListItem = {
  id: string;
  title: string;
  description: string;
  type: ReportListType;
  status: ReportListStatus;
  progress: number;
  createdAt: string;
  completedAt: string | null;
};

export type ReportsResponse = {
  reports: ReportListItem[];
};

export type ReportDetailItem = ReportListItem & {
  keyword: string | null;
  visibilitySearch: {
    website: string;
    brand: string;
    topic: string;
  } | null;
  currentStep: string;
  errorMessage: string | null;
  triggerRunId: string | null;
  result: import('@/lib/keyword-report').KeywordReport | null;
  visibilityResult:
    | import('@/types/search-visibility').VisibilityReportResult
    | null;
};

export type ReportDetailResponse = {
  report: ReportDetailItem;
  realtimeAccessToken?: string;
};
