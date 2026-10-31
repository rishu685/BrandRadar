/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/prisma';
import { ReportStatus } from '@/generated/prisma/client';

let visibilityTaskConfig: any;
let keywordTaskConfig: any;

vi.mock('@/lib/prisma', () => ({
  default: {
    report: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@trigger.dev/sdk', () => ({
  schemaTask: vi.fn((config) => {
    if (config.id === 'search-visibility') {
      visibilityTaskConfig = config;
    } else if (config.id === 'keyword-research') {
      keywordTaskConfig = config;
    }
    return config;
  }),
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  metadata: {
    set: vi.fn().mockReturnThis(),
    flush: vi.fn().mockResolvedValue(undefined),
  },
  wait: {
    createToken: vi.fn(() => Promise.resolve({ url: 'https://callback.url' })),
    forToken: vi.fn(() => ({
      unwrap: vi.fn(() => Promise.resolve([{ sample: 'answer' }])),
    })),
  },
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => 'mock-model')),
}));

const mockPrompts = [
  'What are the best widgets for 2026?',
  'How do leading platforms compare in widgets?',
  'Top alternatives for widget tech',
  'Key features of widget products',
  'Enterprise widget pricing guide',
];

vi.mock('ai', () => ({
  generateText: vi.fn((params: any) => {
    if (params.output?.name === 'visibilityPromptPlan' || (typeof params.prompt === 'string' && params.prompt.includes('five distinct prompts'))) {
      return Promise.resolve({
        output: {
          prompts: mockPrompts,
        },
      });
    }

    return Promise.resolve({
      output: {
        overallScore: 90,
        scoreLabel: 'Dominant',
        summary: 'Excellent visibility',
        overview: { promptsChecked: 5, brandMentions: 5, websiteCitations: 4, competitorsFound: 1 },
        platformResults: [
          { platform: 'ChatGPT', score: 90, promptsChecked: 5, mentions: 5, citations: 4 },
          { platform: 'Gemini', score: 90, promptsChecked: 5, mentions: 5, citations: 4 },
        ],
        promptResults: mockPrompts.map((p) => ({
          prompt: p,
          platforms: ['ChatGPT', 'Gemini'],
          status: 'Mentioned',
          evidence: 'Cited prominently',
        })),
        competitors: [],
        recommendations: ['Maintain lead'],
      },
    });
  }),
  Output: {
    object: vi.fn((config) => config),
  },
}));

describe('Trigger.dev Provenance & Failure Handlers', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.BRIGHT_DATA_API_TOKEN = 'mock-bright-data-token';
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'mock-gemini-key';
  });

  describe('searchVisibilityTask', () => {
    it('should assign LIVE provenance upon successful SERP collection and AI synthesis', async () => {
      await import('@/trigger/search-visibility');

      const mockJob = {
        id: '67c1e55098319f6a27e7f0aa',
        type: 'VISIBILITY',
        website: 'https://acme.org',
        brand: 'Acme',
        topic: 'Widget Manufacturing',
        brightDataSnapshots: ['snap-1', 'snap-2'],
      };

      vi.mocked(prisma.report.findUnique).mockResolvedValueOnce(mockJob as any);

      await visibilityTaskConfig.run({
        jobId: mockJob.id,
        website: mockJob.website,
        brand: mockJob.brand,
        topic: mockJob.topic,
      });

      expect(prisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockJob.id },
          data: expect.objectContaining({
            status: ReportStatus.COMPLETED,
            progress: 100,
            provenance: 'LIVE',
            errorMessage: null,
          }),
        }),
      );
    });

    it('should mark job FAILED and clear result to null on task failure', async () => {
      await import('@/trigger/search-visibility');

      await visibilityTaskConfig.onFailure({
        payload: { jobId: '67c1e55098319f6a27e7f0aa' },
        error: new Error('Bright Data connection timed out (ETIMEDOUT)'),
      });

      expect(prisma.report.updateMany).toHaveBeenCalledWith({
        where: {
          id: '67c1e55098319f6a27e7f0aa',
          type: 'VISIBILITY',
          status: { not: ReportStatus.COMPLETED },
        },
        data: {
          status: ReportStatus.FAILED,
          currentStep: 'AI visibility scan failed',
          errorMessage: 'Scan timed out while communicating with external providers.',
          result: null,
        },
      });
    });
  });

  describe('keywordResearchTask', () => {
    it('should mark keyword job FAILED and clear result to null on task failure', async () => {
      await import('@/trigger/keyword-research');

      await keywordTaskConfig.onFailure({
        payload: { jobId: '67c1e55098319f6a27e7f0bb' },
        error: { statusCode: 429, message: 'Resource exhausted' },
      });

      expect(prisma.report.updateMany).toHaveBeenCalledWith({
        where: {
          id: '67c1e55098319f6a27e7f0bb',
          type: 'KEYWORD',
          status: { not: ReportStatus.COMPLETED },
        },
        data: {
          status: ReportStatus.FAILED,
          currentStep: 'Keyword research failed',
          errorMessage: 'Upstream rate limit reached. Please try again shortly.',
          result: null,
        },
      });
    });
  });
});
