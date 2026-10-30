/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/prisma';
import { GET as getReports } from '@/app/api/reports/route';
import { GET as getReportById } from '@/app/api/reports/[id]/route';

vi.mock('@/lib/auth', () => ({
  getEffectiveUser: vi.fn(() => Promise.resolve({ id: 'user-test-id', email: 'test@example.com' })),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    report: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@trigger.dev/sdk', () => ({
  runs: {
    retrieve: vi.fn(),
  },
  auth: {
    createPublicToken: vi.fn(() => Promise.resolve('mock-realtime-token')),
  },
}));

describe('Reports API Provenance Serialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/reports', () => {
    it('should map null provenance on historical records to UNKNOWN', async () => {
      const mockRows = [
        {
          id: 'report-legacy',
          type: 'VISIBILITY',
          status: 'COMPLETED',
          provenance: null,
          brand: 'LegacyCorp',
          website: 'https://legacy.com',
          topic: 'Tech',
          progress: 100,
          currentStep: 'Report ready',
          triggerRunId: null,
          errorMessage: null,
          createdAt: new Date('2026-01-01'),
          completedAt: new Date('2026-01-01'),
        },
        {
          id: 'report-live',
          type: 'VISIBILITY',
          status: 'COMPLETED',
          provenance: 'LIVE',
          brand: 'LiveCorp',
          website: 'https://live.com',
          topic: 'Cloud',
          progress: 100,
          currentStep: 'Report ready',
          triggerRunId: 'trig-123',
          errorMessage: null,
          createdAt: new Date('2026-02-01'),
          completedAt: new Date('2026-02-01'),
        },
        {
          id: 'report-ai',
          type: 'KEYWORD',
          status: 'COMPLETED',
          provenance: 'AI_GENERATED',
          keyword: 'geo tracking',
          language: 'English',
          country: 'US',
          progress: 100,
          currentStep: 'Report ready',
          triggerRunId: null,
          errorMessage: null,
          createdAt: new Date('2026-02-02'),
          completedAt: new Date('2026-02-02'),
        },
        {
          id: 'report-demo',
          type: 'KEYWORD',
          status: 'COMPLETED',
          provenance: 'DEMO',
          keyword: 'demo keyword',
          language: 'English',
          country: 'US',
          progress: 100,
          currentStep: 'Report ready',
          triggerRunId: null,
          errorMessage: null,
          createdAt: new Date('2026-02-03'),
          completedAt: new Date('2026-02-03'),
        },
      ];

      vi.mocked(prisma.report.findMany).mockResolvedValueOnce(mockRows as any);

      const response = await getReports();
      expect(response.status).toBe(200);

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-test-id' },
        }),
      );

      const data = await response.json();
      expect(data.reports).toHaveLength(4);

      expect(data.reports[0].provenance).toBe('UNKNOWN');
      expect(data.reports[1].provenance).toBe('LIVE');
      expect(data.reports[2].provenance).toBe('AI_GENERATED');
      expect(data.reports[3].provenance).toBe('DEMO');
    });

    it('should resolve corrupted or arbitrary provenance strings to UNKNOWN (Fix D)', async () => {
      const mockRowsWithCorrupted = [
        {
          id: 'rep-corrupt-1',
          type: 'VISIBILITY',
          status: 'COMPLETED',
          provenance: 'ESTIMATED', // Obsolete/unsupported value
          brand: 'BrandX',
          website: 'https://brandx.com',
          topic: 'AI',
          progress: 100,
          currentStep: 'Report ready',
          triggerRunId: null,
          errorMessage: null,
          createdAt: new Date(),
          completedAt: new Date(),
        },
        {
          id: 'rep-corrupt-2',
          type: 'KEYWORD',
          status: 'COMPLETED',
          provenance: 'CORRUPTED',
          keyword: 'invalid keyword',
          progress: 100,
          currentStep: 'Report ready',
          triggerRunId: null,
          errorMessage: null,
          createdAt: new Date(),
          completedAt: new Date(),
        },
        {
          id: 'rep-corrupt-3',
          type: 'VISIBILITY',
          status: 'COMPLETED',
          provenance: 'AN_ARBITRARY_UNSUPPORTED_STRING',
          brand: 'BrandY',
          website: 'https://brandy.com',
          topic: 'Search',
          progress: 100,
          currentStep: 'Report ready',
          triggerRunId: null,
          errorMessage: null,
          createdAt: new Date(),
          completedAt: new Date(),
        },
      ];

      vi.mocked(prisma.report.findMany).mockResolvedValueOnce(mockRowsWithCorrupted as any);

      const response = await getReports();
      const data = await response.json();

      expect(data.reports[0].provenance).toBe('UNKNOWN');
      expect(data.reports[1].provenance).toBe('UNKNOWN');
      expect(data.reports[2].provenance).toBe('UNKNOWN');
    });
  });

  describe('GET /api/reports/[id]', () => {
    it('should map null provenance to UNKNOWN in report detail and enforce user isolation', async () => {
      const mockRow = {
        id: '67c1e55098319f6a27e7f011',
        type: 'VISIBILITY',
        status: 'COMPLETED',
        provenance: null,
        keyword: null,
        language: null,
        country: null,
        website: 'https://example.com',
        brand: 'ExampleBrand',
        topic: 'AI',
        progress: 100,
        currentStep: 'Report ready',
        triggerRunId: null,
        result: { overallScore: 80 },
        errorMessage: null,
        createdAt: new Date('2026-01-01'),
        completedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.report.findFirst).mockResolvedValueOnce(mockRow as any);

      const response = await getReportById(new Request('http://localhost/api/reports/67c1e55098319f6a27e7f011'), {
        params: Promise.resolve({ id: '67c1e55098319f6a27e7f011' }),
      });

      expect(prisma.report.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: '67c1e55098319f6a27e7f011',
            userId: 'user-test-id',
          },
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.report.provenance).toBe('UNKNOWN');
      expect(data.report.status).toBe('completed');
    });

    it('should resolve corrupted provenance values to UNKNOWN in detail view (Fix D)', async () => {
      const mockRowCorrupted = {
        id: '67c1e55098319f6a27e7f099',
        type: 'VISIBILITY',
        status: 'COMPLETED',
        provenance: 'ESTIMATED',
        keyword: null,
        language: null,
        country: null,
        website: 'https://example.com',
        brand: 'ExampleBrand',
        topic: 'AI',
        progress: 100,
        currentStep: 'Report ready',
        triggerRunId: null,
        result: { overallScore: 80 },
        errorMessage: null,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      vi.mocked(prisma.report.findFirst).mockResolvedValueOnce(mockRowCorrupted as any);

      const response = await getReportById(new Request('http://localhost/api/reports/67c1e55098319f6a27e7f099'), {
        params: Promise.resolve({ id: '67c1e55098319f6a27e7f099' }),
      });

      const data = await response.json();
      expect(data.report.provenance).toBe('UNKNOWN');
    });

    it('should preserve LIVE, AI_GENERATED, and DEMO provenance in report detail', async () => {
      const mockLiveRow = {
        id: '67c1e55098319f6a27e7f022',
        type: 'VISIBILITY',
        status: 'COMPLETED',
        provenance: 'LIVE',
        website: 'https://live.com',
        brand: 'LiveBrand',
        topic: 'AI',
        progress: 100,
        currentStep: 'Report ready',
        triggerRunId: 'trig-run-1',
        result: { overallScore: 92 },
        errorMessage: null,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      vi.mocked(prisma.report.findFirst).mockResolvedValueOnce(mockLiveRow as any);

      const response = await getReportById(new Request('http://localhost/api/reports/67c1e55098319f6a27e7f022'), {
        params: Promise.resolve({ id: '67c1e55098319f6a27e7f022' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.report.provenance).toBe('LIVE');
    });
  });
});
