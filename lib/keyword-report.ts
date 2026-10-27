export type KeywordReportTone = 'destructive' | 'warning' | 'success';

export type KeywordReport = {
  overallScore: number;
  scoreLabel?: 'Needs work' | 'Promising' | 'Strong' | 'Excellent';
  summary: string;
  overview: {
    citationsAnalyzed: number;
    uniqueDomains: number;
    competitorsFound: number;
    promptOpportunities: number;
  };
  topDomains: Array<{
    domain: string;
    type: string;
    citations: number;
    share: number;
  }>;
  evidenceSummary: string[];
  sourceMix: Array<{
    type: string;
    count: number;
    share: number;
  }>;
  competitors: Array<{
    name: string;
    domain: string;
    citations: number;
    share: number;
    strength: string;
  }>;
  contentOpportunity: {
    patternsThatEarnCitations: string[];
    evidenceGaps: string[];
    fastestOpportunities: string[];
  };
  promptIdeas: Array<{
    prompt: string;
    evidence: string;
    opportunity: 'High' | 'Medium' | 'Low';
  }>;
  contentKeywords: Array<{
    keyword: string;
    cluster: string;
    evidence: string;
    relevance: number;
  }>;
};

export function getKeywordScoreLabel(score: number) {
  if (score < 40) return 'Needs work';
  if (score < 65) return 'Promising';
  if (score < 85) return 'Strong';
  return 'Excellent';
}

export function getKeywordScoreTone(score: number): KeywordReportTone {
  if (score < 40) return 'destructive';
  if (score < 65) return 'warning';
  return 'success';
}
