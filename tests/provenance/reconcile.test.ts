/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/prisma';
import { runs } from '@trigger.dev/sdk';
import { reconcileTerminalReport } from '@/lib/reports';

vi.mock('@/lib/prisma', () => ({
  default: {
    report: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@trigger.dev/sdk', () => ({
  runs: {
    retrieve: vi.fn(),
  },
}));

describe('reconcileTerminalReport (Fix A & Fix B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip reconciliation if report is already COMPLETED', async () => {
    const report = {
      id: 'rep-completed',
      type: 'VISIBILITY' as const,
      status: 'COMPLETED' as const,
      triggerRunId: 'run-1',
      currentStep: 'Report ready',
      errorMessage: null,
    };

    const result = await reconcileTerminalReport(report);
    expect(result).toEqual(report);
    expect(runs.retrieve).not.toHaveBeenCalled();
    expect(prisma.report.updateMany).not.toHaveBeenCalled();
  });

  it('should reconcile crashed run to FAILED and clear stale result to null (Fix A)', async () => {
    const report = {
      id: 'rep-crashed',
      type: 'VISIBILITY' as const,
      status: 'ANALYZING' as const,
      triggerRunId: 'run-crashed-1',
      currentStep: 'Checking platforms',
      errorMessage: null,
    };

    vi.mocked(runs.retrieve).mockResolvedValueOnce({
      id: 'run-crashed-1',
      status: 'CRASHED',
      error: { message: 'Container out of memory' },
    } as any);

    vi.mocked(prisma.report.updateMany).mockResolvedValueOnce({
      count: 1,
    } as any);

    const result = await reconcileTerminalReport(report);

    expect(result.status).toBe('FAILED');
    expect(prisma.report.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'rep-crashed',
        status: { in: ['PENDING', 'COLLECTING', 'ANALYZING'] },
      },
      data: {
        status: 'FAILED',
        currentStep: 'AI visibility scan failed',
        errorMessage: 'An unexpected error occurred during scan execution.',
        result: null,
      },
    });
  });

  it('should protect against concurrency race when report already completed concurrently (Fix A)', async () => {
    const report = {
      id: 'rep-concurrent',
      type: 'VISIBILITY' as const,
      status: 'ANALYZING' as const,
      triggerRunId: 'run-concurrent-1',
      currentStep: 'Synthesizing AEO',
      errorMessage: null,
    };

    vi.mocked(runs.retrieve).mockResolvedValueOnce({
      id: 'run-concurrent-1',
      status: 'FAILED',
      error: { message: 'Timeout' },
    } as any);

    // Concurrently completed by background task, so updateMany matches 0 eligible processing rows
    vi.mocked(prisma.report.updateMany).mockResolvedValueOnce({
      count: 0,
    } as any);

    // findUnique returns the freshly completed record
    vi.mocked(prisma.report.findUnique).mockResolvedValueOnce({
      status: 'COMPLETED',
      currentStep: 'Report ready',
      errorMessage: null,
      result: { score: 95 },
      completedAt: new Date(),
      progress: 100,
      provenance: 'LIVE',
    } as any);

    const result = await reconcileTerminalReport(report);

    expect(result.status).toBe('COMPLETED');
    expect(result.currentStep).toBe('Report ready');
    expect(result.errorMessage).toBeNull();
    expect((result as any).provenance).toBe('LIVE');
    expect(prisma.report.findUnique).toHaveBeenCalledWith({
      where: { id: 'rep-concurrent' },
      select: expect.objectContaining({
        status: true,
        currentStep: true,
        errorMessage: true,
        result: true,
        completedAt: true,
        progress: true,
        provenance: true,
      }),
    });
  });

  it('should sanitize raw Trigger.dev error messages during reconciliation (Fix B)', async () => {
    const report = {
      id: 'rep-leak-test',
      type: 'KEYWORD' as const,
      status: 'COLLECTING' as const,
      triggerRunId: 'run-leak-1',
      currentStep: 'Reviewing citations',
      errorMessage: null,
    };

    vi.mocked(runs.retrieve).mockResolvedValueOnce({
      id: 'run-leak-1',
      status: 'FAILED',
      error: { message: 'Request to https://api.brightdata.com/dataset?token=SECRET_KEY_123 failed (401)' },
    } as any);

    vi.mocked(prisma.report.updateMany).mockResolvedValueOnce({
      count: 1,
    } as any);

    const result = await reconcileTerminalReport(report);

    expect(result.status).toBe('FAILED');
    expect(result.errorMessage).toBe('Authentication failed with upstream AI provider.');
    expect(result.errorMessage).not.toContain('SECRET_KEY_123');
    expect(result.errorMessage).not.toContain('https://api.brightdata.com');
  });

  it('should reconcile timed out runs to FAILED and clear result to null', async () => {
    const report = {
      id: 'rep-timeout',
      type: 'KEYWORD' as const,
      status: 'COLLECTING' as const,
      triggerRunId: 'run-timeout-1',
      currentStep: 'Reviewing citations',
      errorMessage: null,
    };

    vi.mocked(runs.retrieve).mockResolvedValueOnce({
      id: 'run-timeout-1',
      status: 'TIMED_OUT',
      error: undefined,
    } as any);

    vi.mocked(prisma.report.updateMany).mockResolvedValueOnce({
      count: 1,
    } as any);

    const result = await reconcileTerminalReport(report);

    expect(result.status).toBe('FAILED');
    expect(prisma.report.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'rep-timeout',
        status: { in: ['PENDING', 'COLLECTING', 'ANALYZING'] },
      },
      data: {
        status: 'FAILED',
        currentStep: 'Report generation timed out',
        errorMessage: 'This report timed out before it finished.',
        result: null,
      },
    });
  });
});
