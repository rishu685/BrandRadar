/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import prisma from '@/lib/prisma';
import { runDirectVisibilityScan, runDirectKeywordScan, sanitizeScanErrorMessage } from '@/lib/engine/direct-scanner';
import { ReportStatus } from '@/generated/prisma/client';

vi.mock('@/lib/prisma', () => ({
  default: {
    report: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => 'mock-model')),
}));

vi.mock('ai', () => ({
  generateText: vi.fn(),
  Output: {
    object: vi.fn((config) => config),
  },
}));

describe('Direct Scanner Provenance and Fail-Closed Behavior (Fix C)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('runDirectVisibilityScan', () => {
    it('should assign AI_GENERATED provenance upon successful Gemini generation', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'valid-gemini-key';
      const { generateText } = await import('ai');

      const mockResult = {
        overallScore: 85,
        scoreLabel: 'Strong',
        summary: 'Solid visibility',
        overview: { promptsChecked: 5, brandMentions: 4, websiteCitations: 3, competitorsFound: 2 },
        platformResults: [
          { platform: 'ChatGPT', score: 85, promptsChecked: 5, mentions: 4, citations: 3 },
          { platform: 'Gemini', score: 85, promptsChecked: 5, mentions: 4, citations: 3 },
        ],
        promptResults: [],
        competitors: [],
        recommendations: ['Improve schema'],
      };

      vi.mocked(generateText).mockResolvedValueOnce({
        output: mockResult,
      } as any);

      await runDirectVisibilityScan('report-123', 'https://example.com', 'Example', 'Tech');

      expect(prisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'report-123' },
          data: expect.objectContaining({
            status: ReportStatus.COMPLETED,
            progress: 100,
            provenance: 'AI_GENERATED',
            result: mockResult,
            errorMessage: null,
          }),
        }),
      );
    });

    it('should fail closed when API key is missing and protect COMPLETED status (Fix C)', async () => {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      await runDirectVisibilityScan('report-missing-key', 'https://example.com', 'Example', 'Tech');

      expect(prisma.report.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'report-missing-key',
          status: { not: ReportStatus.COMPLETED },
        },
        data: {
          status: ReportStatus.FAILED,
          progress: 100,
          currentStep: 'Visibility scan failed',
          errorMessage: 'AI analysis service is not configured.',
          result: null,
        },
      });
    });

    it('should fail closed when API key is a placeholder string (Fix C)', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'your_google_gemini_api_key';

      await runDirectVisibilityScan('report-placeholder-key', 'https://example.com', 'Example', 'Tech');

      expect(prisma.report.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'report-placeholder-key',
          status: { not: ReportStatus.COMPLETED },
        },
        data: {
          status: ReportStatus.FAILED,
          progress: 100,
          currentStep: 'Visibility scan failed',
          errorMessage: 'AI analysis service is not configured.',
          result: null,
        },
      });
    });

    it('should fail closed and sanitize error message on rate limit (429) (Fix C)', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'valid-key';
      const { generateText } = await import('ai');

      vi.mocked(generateText).mockRejectedValueOnce({
        statusCode: 429,
        message: 'Quota exceeded for gemini-2.5-flash with secret key AIzaSyD...',
      });

      await runDirectVisibilityScan('report-rate-limit', 'https://example.com', 'Example', 'Tech');

      expect(prisma.report.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'report-rate-limit',
          status: { not: ReportStatus.COMPLETED },
        },
        data: {
          status: ReportStatus.FAILED,
          progress: 100,
          currentStep: 'Visibility scan failed',
          errorMessage: 'Upstream rate limit reached. Please try again shortly.',
          result: null,
        },
      });
    });

    it('should fail closed on provider auth error (401/403) and not leak credentials (Fix C)', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'valid-key';
      const { generateText } = await import('ai');

      vi.mocked(generateText).mockRejectedValueOnce({
        status: 401,
        message: 'API_KEY_INVALID: API key AIzaSyD12345 expired',
      });

      await runDirectVisibilityScan('report-auth-err', 'https://example.com', 'Example', 'Tech');

      expect(prisma.report.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'report-auth-err',
          status: { not: ReportStatus.COMPLETED },
        },
        data: {
          status: ReportStatus.FAILED,
          progress: 100,
          currentStep: 'Visibility scan failed',
          errorMessage: 'Authentication failed with upstream AI provider.',
          result: null,
        },
      });
    });

    it('should fail closed on schema validation / AI_NoObjectGeneratedError (Fix C)', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'valid-key';
      const { generateText } = await import('ai');

      vi.mocked(generateText).mockRejectedValueOnce({
        name: 'AI_NoObjectGeneratedError',
        message: 'Malformed JSON from Gemini',
      });

      await runDirectVisibilityScan('report-schema-err', 'https://example.com', 'Example', 'Tech');

      expect(prisma.report.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'report-schema-err',
          status: { not: ReportStatus.COMPLETED },
        },
        data: {
          status: ReportStatus.FAILED,
          progress: 100,
          currentStep: 'Visibility scan failed',
          errorMessage: 'AI provider returned incompatible or incomplete data.',
          result: null,
        },
      });
    });
  });

  describe('runDirectKeywordScan', () => {
    it('should assign AI_GENERATED provenance upon successful Gemini keyword analysis', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'valid-key';
      const { generateText } = await import('ai');

      const mockKeywordResult = {
        overallScore: 82,
        scoreLabel: 'Strong',
        summary: 'Keyword overview',
        overview: { citationsAnalyzed: 10, uniqueDomains: 5, competitorsFound: 3, promptOpportunities: 2 },
        topDomains: [],
        evidenceSummary: [],
        sourceMix: [],
        competitors: [],
        contentOpportunity: { patternsThatEarnCitations: [], evidenceGaps: [], fastestOpportunities: [] },
        promptIdeas: [],
        contentKeywords: [],
      };

      vi.mocked(generateText).mockResolvedValueOnce({
        output: mockKeywordResult,
      } as any);

      await runDirectKeywordScan('keyword-123', 'ai seo', 'US');

      expect(prisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'keyword-123' },
          data: expect.objectContaining({
            status: ReportStatus.COMPLETED,
            progress: 100,
            provenance: 'AI_GENERATED',
            result: mockKeywordResult,
            errorMessage: null,
          }),
        }),
      );
    });

    it('should fail closed when API key is missing for keyword search (Fix C)', async () => {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      await runDirectKeywordScan('keyword-missing-key', 'ai seo', 'US');

      expect(prisma.report.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'keyword-missing-key',
          status: { not: ReportStatus.COMPLETED },
        },
        data: {
          status: ReportStatus.FAILED,
          progress: 100,
          currentStep: 'Keyword scan failed',
          errorMessage: 'AI analysis service is not configured.',
          result: null,
        },
      });
    });
  });

  describe('sanitizeScanErrorMessage', () => {
    it('should sanitize unknown exceptions', () => {
      expect(sanitizeScanErrorMessage(new Error('Internal socket pipe broken at 10.0.0.1'))).toBe(
        'An unexpected error occurred during scan execution.',
      );
    });

    it('should sanitize network timeout errors', () => {
      expect(sanitizeScanErrorMessage({ name: 'AbortError' })).toBe(
        'Scan timed out while communicating with external providers.',
      );
    });

    it('should sanitize string errors from external SDKs', () => {
      expect(sanitizeScanErrorMessage('Request to https://gemini.api?key=SECRET timed out')).toBe(
        'Scan timed out while communicating with external providers.',
      );
    });
  });
});
