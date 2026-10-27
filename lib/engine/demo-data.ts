import type { VisibilityReportResult } from '@/types/search-visibility';
import type { KeywordReport } from '@/lib/keyword-report';

export function generateDemoVisibilityReport(
  website: string,
  brand: string,
  topic: string,
): VisibilityReportResult {
  const cleanBrand = brand.trim();
  const cleanTopic = topic.trim();
  const cleanDomain = website.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

  return {
    overallScore: 78,
    scoreLabel: 'Strong',
    summary: `${cleanBrand} demonstrates solid generative engine visibility across key ${cleanTopic} intent queries, earning authoritative citations in both ChatGPT and Gemini answers.`,
    overview: {
      promptsChecked: 5,
      brandMentions: 4,
      websiteCitations: 3,
      competitorsFound: 4,
    },
    platformResults: [
      {
        platform: 'ChatGPT',
        score: 82,
        promptsChecked: 5,
        mentions: 4,
        citations: 3,
      },
      {
        platform: 'Gemini',
        score: 74,
        promptsChecked: 5,
        mentions: 3,
        citations: 2,
      },
    ],
    promptResults: [
      {
        prompt: `What are the best platforms for ${cleanTopic} in 2026?`,
        platforms: ['ChatGPT', 'Gemini'],
        status: 'Mentioned',
        evidence: `${cleanBrand} was highlighted among the top 3 recommended solutions for modern ${cleanTopic}.`,
      },
      {
        prompt: `How does ${cleanBrand} compare to industry standards in ${cleanTopic}?`,
        platforms: ['ChatGPT', 'Gemini'],
        status: 'Mentioned',
        evidence: `Directly cited with benchmark comparisons and technical documentation reference.`,
      },
      {
        prompt: `Open-source and developer-first alternatives for ${cleanTopic}`,
        platforms: ['ChatGPT'],
        status: 'Mentioned',
        evidence: `Cited specifically for architectural transparency and developer ergonomics.`,
      },
      {
        prompt: `Key features and capabilities required for ${cleanTopic}`,
        platforms: ['Gemini'],
        status: 'Opportunity',
        evidence: `General category features mentioned without attributing specific unique innovations to ${cleanBrand}.`,
      },
      {
        prompt: `Enterprise pricing, scalability, and benchmarks in ${cleanTopic}`,
        platforms: ['ChatGPT', 'Gemini'],
        status: 'Mentioned',
        evidence: `Quoted for transparent tier structures and integration flexibility.`,
      },
    ],
    competitors: [
      {
        name: `${cleanTopic} Leader A`,
        domain: 'leader-a.io',
        mentions: 5,
        score: 88,
      },
      {
        name: `${cleanTopic} Alternative B`,
        domain: 'alt-b.dev',
        mentions: 4,
        score: 75,
      },
      {
        name: `${cleanBrand}`,
        domain: cleanDomain,
        mentions: 4,
        score: 78,
      },
      {
        name: 'Legacy Suite Cloud',
        domain: 'legacy-suite.com',
        mentions: 3,
        score: 62,
      },
    ],
    recommendations: [
      `Deploy a verified /llms.txt and /llms-full.txt to help AI crawlers index technical feature matrices.`,
      `Add schema.org/SoftwareApplication structured data to core documentation pages to increase citation density.`,
      `Publish comparative benchmark articles answering "${cleanBrand} vs competitors" to claim direct answer citations.`,
      `Improve citation evidence on pricing and SLA benchmarks where Gemini currently defaults to general category consensus.`,
    ],
  };
}

export function generateDemoKeywordReport(
  keyword: string,
  country: string,
): KeywordReport {
  const cleanKeyword = keyword.trim();
  const upperCountry = country.toUpperCase();

  return {
    overallScore: 84,
    scoreLabel: 'Strong',
    summary: `Targeting "${cleanKeyword}" in ${upperCountry} offers high generative discovery potential with 142 analyzed citation references and strong content clustering opportunities.`,
    overview: {
      citationsAnalyzed: 142,
      uniqueDomains: 38,
      competitorsFound: 6,
      promptOpportunities: 5,
    },
    topDomains: [
      {
        domain: 'github.com',
        type: 'Developer Community',
        citations: 42,
        share: 29.5,
      },
      {
        domain: 'dev.to',
        type: 'Technical Publication',
        citations: 28,
        share: 19.7,
      },
      {
        domain: 'wikipedia.org',
        type: 'Authoritative Reference',
        citations: 22,
        share: 15.5,
      },
      {
        domain: 'stackoverflow.com',
        type: 'Q&A Knowledge Base',
        citations: 18,
        share: 12.6,
      },
    ],
    evidenceSummary: [
      `LLMs prioritize code samples and step-by-step implementation tutorials for this keyword.`,
      `High citation authority stems from open GitHub repositories with active documentation.`,
      `Emerging opportunity around benchmark comparisons and setup guides.`,
    ],
    sourceMix: [
      { type: 'Documentation & Guides', count: 64, share: 45 },
      { type: 'Open-Source Repositories', count: 48, share: 34 },
      { type: 'Articles & Reviews', count: 30, share: 21 },
    ],
    competitors: [
      {
        name: 'Market Pioneer X',
        domain: 'pioneer-x.com',
        citations: 38,
        share: 26.7,
        strength: 'High',
      },
      {
        name: 'Open Engine Y',
        domain: 'openengine-y.dev',
        citations: 27,
        share: 19.0,
        strength: 'Medium',
      },
      {
        name: 'FastCloud Labs',
        domain: 'fastcloud.io',
        citations: 16,
        share: 11.2,
        strength: 'Emerging',
      },
    ],
    contentOpportunity: {
      patternsThatEarnCitations: [
        'Interactive quickstart guides with zero dependencies',
        'Direct head-to-head performance comparisons with reproducible benchmarks',
        'Structured FAQ sections answering common developer friction points',
      ],
      evidenceGaps: [
        'Production readiness and latency under high concurrency',
        'Migration guides from legacy proprietary solutions',
      ],
      fastestOpportunities: [
        `Publish a "Getting Started with ${cleanKeyword} in 5 Minutes" tutorial`,
        'Add JSON-LD HowTo schema to code snippets',
      ],
    },
    promptIdeas: [
      {
        prompt: `How to implement ${cleanKeyword} in production?`,
        evidence: '28 sources cited',
        opportunity: 'High',
      },
      {
        prompt: `Top 5 alternatives to standard ${cleanKeyword} tooling`,
        evidence: '22 sources cited',
        opportunity: 'High',
      },
      {
        prompt: `Common architecture mistakes when scaling ${cleanKeyword}`,
        evidence: '14 sources cited',
        opportunity: 'Medium',
      },
    ],
    contentKeywords: [
      {
        keyword: `${cleanKeyword} tutorial`,
        cluster: 'Education',
        evidence: 'High search volume and strong LLM citation frequency',
        relevance: 95,
      },
      {
        keyword: `best ${cleanKeyword} tools 2026`,
        cluster: 'Evaluation',
        evidence: 'Commercial high intent with strong prompt presence',
        relevance: 90,
      },
      {
        keyword: `${cleanKeyword} architecture best practices`,
        cluster: 'Engineering',
        evidence: 'Referenced extensively across technical writeups',
        relevance: 85,
      },
    ],
  };
}
