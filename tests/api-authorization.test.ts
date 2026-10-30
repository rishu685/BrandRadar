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

describe('API Route Authorization & Strict Tenant Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated access (Missing session returns 401)', () => {
    beforeEach(() => {
      vi.mocked(getSessionUser).mockResolvedValue(null);
    });

    it('GET /api/reports returns 401 Unauthorized without querying reports', async () => {
      const response = await getReports();
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ message: 'Unauthorized' });
      expect(prisma.report.findMany).not.toHaveBeenCalled();
    });

    it('GET /api/reports/[id] returns 401 Unauthorized without querying database', async () => {
      const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
      const request = new Request('http://localhost:3000/api/reports/507f1f77bcf86cd799439011');
      const response = await getReportById(request, { params });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ message: 'Unauthorized' });
      expect(prisma.report.findFirst).not.toHaveBeenCalled();
    });

    it('POST /api/keyword-research returns 401 Unauthorized without creating report or dispatching task', async () => {
      const request = new Request('http://localhost:3000/api/keyword-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: 'brand monitoring', country: 'US' }),
      });

      const response = await postKeywordResearch(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ message: 'Unauthorized' });
      expect(prisma.report.create).not.toHaveBeenCalled();
      expect(tasks.trigger).not.toHaveBeenCalled();
      expect(runDirectKeywordScan).not.toHaveBeenCalled();
    });

    it('POST /api/search-visibility returns 401 Unauthorized without creating report or dispatching task', async () => {
      const request = new Request('http://localhost:3000/api/search-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: 'https://example.com', brand: 'Example', topic: 'AI' }),
      });

      const response = await postSearchVisibility(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ message: 'Unauthorized' });
      expect(prisma.report.create).not.toHaveBeenCalled();
      expect(tasks.trigger).not.toHaveBeenCalled();
      expect(runDirectVisibilityScan).not.toHaveBeenCalled();
    });

    it('GET /api/billing/status returns 401 Unauthorized when unauthenticated', async () => {
      const response = await getBillingStatus();
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ message: 'Unauthorized' });
      expect(prisma.report.count).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated access & Tenant Isolation', () => {
    const userA: AuthUser = {
      id: '507f1f77bcf86cd799439011',
      name: 'User A',
      email: 'usera@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userB: AuthUser = {
      id: '507f1f77bcf86cd799439022',
      name: 'User B',
      email: 'userb@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('GET /api/reports restricts queries strictly to the authenticated user ID', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(userA);
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);

      const response = await getReports();
      expect(response.status).toBe(200);

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: userA.id },
        }),
      );
    });

    it('GET /api/reports/[id] returns report if owned by authenticated user', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(userA);
      const mockReport = {
        id: '507f1f77bcf86cd7994390aa',
        userId: userA.id,
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

      const params = Promise.resolve({ id: '507f1f77bcf86cd7994390aa' });
      const request = new Request('http://localhost:3000/api/reports/507f1f77bcf86cd7994390aa');
      const response = await getReportById(request, { params });

      expect(response.status).toBe(200);
      expect(prisma.report.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: '507f1f77bcf86cd7994390aa',
            userId: userA.id,
          },
        }),
      );
    });

    it('GET /api/reports/[id] returns 404 Report not found when User B requests User A report (Strict Tenant Isolation)', async () => {
      // User B is logged in
      vi.mocked(getSessionUser).mockResolvedValue(userB);

      // Prisma query with where: { id, userId: userB.id } returns null because report belongs to userA
      vi.mocked(prisma.report.findFirst).mockResolvedValue(null);

      const params = Promise.resolve({ id: '507f1f77bcf86cd7994390aa' });
      const request = new Request('http://localhost:3000/api/reports/507f1f77bcf86cd7994390aa');
      const response = await getReportById(request, { params });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toEqual({ message: 'Report not found' });

      // Verifies the query was scoped strictly to userB
      expect(prisma.report.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: '507f1f77bcf86cd7994390aa',
            userId: userB.id,
          },
        }),
      );
    });

    it('POST /api/keyword-research creates report strictly associated with authenticated user ID', async () => {
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

    it('POST /api/search-visibility creates report strictly associated with authenticated user ID', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(userA);
      vi.mocked(prisma.report.create).mockResolvedValue({
        id: 'new_visibility_123',
        status: 'PENDING',
        progress: 5,
        currentStep: 'Preparing visibility scan',
      } as unknown as Awaited<ReturnType<typeof prisma.report.create>>);

      const request = new Request('http://localhost:3000/api/search-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: 'https://brandradar.dev', brand: 'BrandRadar', topic: 'AEO' }),
      });

      const response = await postSearchVisibility(request);
      expect(response.status).toBe(202);

      expect(prisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: userA.id,
            website: 'https://brandradar.dev',
            brand: 'BrandRadar',
            topic: 'AEO',
          }),
        }),
      );
    });

    it('GET /api/billing/status scopes count queries strictly to authenticated user ID', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(userA);
      vi.mocked(prisma.report.count).mockResolvedValue(3);

      const response = await getBillingStatus();
      expect(response.status).toBe(200);

      expect(prisma.report.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: userA.id }),
        }),
      );
    });
  });
});
