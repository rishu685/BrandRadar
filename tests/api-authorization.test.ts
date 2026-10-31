import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock lib/auth
vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    report: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock @trigger.dev/sdk
vi.mock('@trigger.dev/sdk', () => ({
  tasks: {
    trigger: vi.fn(),
  },
  auth: {
    createPublicToken: vi.fn(),
  },
}));

// Mock direct scanner
vi.mock('@/lib/engine/direct-scanner', () => ({
  runDirectKeywordScan: vi.fn(),
  runDirectVisibilityScan: vi.fn(),
}));

// Mock reconcileTerminalReport
vi.mock('@/lib/reports', () => ({
  reconcileTerminalReport: vi.fn((report) => Promise.resolve(report)),
}));

import { getSessionUser, type AuthUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { tasks } from '@trigger.dev/sdk';
import { runDirectKeywordScan, runDirectVisibilityScan } from '@/lib/engine/direct-scanner';

import { GET as getReports } from '@/app/api/reports/route';
import { GET as getReportById } from '@/app/api/reports/[id]/route';
import { POST as postKeywordResearch } from '@/app/api/keyword-research/route';
import { POST as postSearchVisibility } from '@/app/api/search-visibility/route';
import { GET as getBillingStatus } from '@/app/api/billing/status/route';

describe('Open Direct Access API Routes (No Sign-in Barrier)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated direct access (Anyone can directly access the search)', () => {
    beforeEach(() => {
      vi.mocked(getSessionUser).mockResolvedValue(null);
    });

    it('GET /api/reports allows direct retrieval without sign-in', async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      const response = await getReports();
      expect(response.status).toBe(200);
      expect(prisma.report.findMany).toHaveBeenCalledTimes(1);
    });

    it('GET /api/reports/[id] allows direct access to report by ID without sign-in', async () => {
      const mockReport = {
        id: '507f1f77bcf86cd799439011',
        userId: null,
        type: 'KEYWORD' as const,
        status: 'COMPLETED' as const,
        keyword: 'seo tools',
        language: 'en',
        country: 'US',
        website: null,
        brand: null,
        topic: null,
        progress: 100,
        currentStep: null,
        triggerRunId: null,
        result: {},
        errorMessage: null,
        createdAt: new Date(),
        completedAt: new Date(),
      };
      vi.mocked(prisma.report.findFirst).mockResolvedValue(mockReport as unknown as Awaited<ReturnType<typeof prisma.report.findFirst>>);

      const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
      const request = new Request('http://localhost:3000/api/reports/507f1f77bcf86cd799439011');
      const response = await getReportById(request, { params });

      expect(response.status).toBe(200);
      expect(prisma.report.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '507f1f77bcf86cd799439011' },
        }),
      );
    });

    it('POST /api/keyword-research allows anyone to start keyword search directly', async () => {
      vi.mocked(prisma.report.create).mockResolvedValue({
        id: 'kw_report_123',
        status: 'PENDING',
        progress: 5,
        currentStep: 'Preparing keyword search',
      } as unknown as Awaited<ReturnType<typeof prisma.report.create>>);

      const request = new Request('http://localhost:3000/api/keyword-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: 'brand monitoring', country: 'US' }),
      });

      const response = await postKeywordResearch(request);
      expect(response.status).toBe(202);
      expect(prisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: null,
            keyword: 'brand monitoring',
            country: 'US',
          }),
        }),
      );
      expect(runDirectKeywordScan).toHaveBeenCalled();
    });

    it('POST /api/search-visibility allows anyone to start visibility scan directly', async () => {
      vi.mocked(prisma.report.create).mockResolvedValue({
        id: 'vis_report_123',
        status: 'PENDING',
        progress: 5,
        currentStep: 'Preparing visibility scan',
      } as unknown as Awaited<ReturnType<typeof prisma.report.create>>);

      const request = new Request('http://localhost:3000/api/search-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: 'https://example.com', brand: 'Example', topic: 'AEO' }),
      });

      const response = await postSearchVisibility(request);
      expect(response.status).toBe(202);
      expect(prisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: null,
            website: 'https://example.com',
            brand: 'Example',
          }),
        }),
      );
      expect(runDirectVisibilityScan).toHaveBeenCalled();
    });

    it('GET /api/billing/status returns unlimited open source status without sign-in', async () => {
      vi.mocked(prisma.report.count).mockResolvedValue(0);
      const response = await getBillingStatus();
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.isPaid).toBe(true);
      expect(json.plan).toBe('pro');
    });
  });

  describe('Authenticated user linkage (when session is present)', () => {
    const userA: AuthUser = {
      id: '507f1f77bcf86cd799439011',
      name: 'User A',
      email: 'usera@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('POST /api/keyword-research links userId when session exists', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(userA);
      vi.mocked(prisma.report.create).mockResolvedValue({
        id: 'new_report_123',
        status: 'PENDING',
        progress: 5,
        currentStep: 'Preparing keyword search',
      } as unknown as Awaited<ReturnType<typeof prisma.report.create>>);

      const request = new Request('http://localhost:3000/api/keyword-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: 'keyword intelligence', country: 'US' }),
      });

      const response = await postKeywordResearch(request);
      expect(response.status).toBe(202);

      expect(prisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: userA.id,
            keyword: 'keyword intelligence',
            country: 'US',
          }),
        }),
      );
    });

    it('POST /api/search-visibility links userId when session exists', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(userA);
      vi.mocked(prisma.report.create).mockResolvedValue({
        id: 'new_report_456',
        status: 'PENDING',
        progress: 5,
        currentStep: 'Preparing visibility scan',
      } as unknown as Awaited<ReturnType<typeof prisma.report.create>>);

      const request = new Request('http://localhost:3000/api/search-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: 'https://example.com', brand: 'BrandRadar', topic: 'AEO' }),
      });

      const response = await postSearchVisibility(request);
      expect(response.status).toBe(202);

      expect(prisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: userA.id,
            website: 'https://example.com',
            brand: 'BrandRadar',
            topic: 'AEO',
          }),
        }),
      );
    });
  });
});
