import 'server-only';
import { runs } from '@trigger.dev/sdk';
import prisma from '@/lib/prisma';
import type { ReportStatus, ReportType } from '@/generated/prisma/client';
import { sanitizeScanErrorMessage } from '@/lib/scan-errors';

type ProcessingReport = {
  id: string;
  type: ReportType;
  status: ReportStatus;
  triggerRunId: string | null;
  currentStep: string | null;
  errorMessage: string | null;
};

const failedRunStatuses = new Set([
  'CANCELED',
  'FAILED',
  'CRASHED',
  'SYSTEM_FAILURE',
  'EXPIRED',
  'TIMED_OUT',
]);

export async function reconcileTerminalReport<T extends ProcessingReport>(
  report: T,
): Promise<T> {
  const isProcessing =
    report.status === 'PENDING' ||
    report.status === 'COLLECTING' ||
    report.status === 'ANALYZING';

  if (!isProcessing || !report.triggerRunId) return report;

  try {
    const run = await runs.retrieve(report.triggerRunId);
    if (!failedRunStatuses.has(run.status)) return report;

    const failure = getRunFailure(run.status, run.error?.message, report.type);

    const updateResult = await prisma.report.updateMany({
      where: {
        id: report.id,
        status: { in: ['PENDING', 'COLLECTING', 'ANALYZING'] },
      },
      data: {
        status: 'FAILED',
        currentStep: failure.currentStep,
        errorMessage: failure.errorMessage,
        result: null,
      },
    });

    if (updateResult.count === 0) {
      // The report transitioned to a terminal status (e.g. COMPLETED) concurrently.
      // Retrieve the latest fresh record to avoid returning a stale in-memory object.
      const freshReport = await prisma.report.findUnique({
        where: { id: report.id },
        select: {
          status: true,
          currentStep: true,
          errorMessage: true,
          result: true,
          completedAt: true,
          progress: true,
          provenance: true,
        },
      });
      return freshReport ? ({ ...report, ...freshReport } as T) : report;
    }

    return {
      ...report,
      status: 'FAILED' as ReportStatus,
      currentStep: failure.currentStep,
      errorMessage: failure.errorMessage,
    };
  } catch (error) {
    console.warn('Unable to reconcile report with Trigger.dev', {
      reportId: report.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return report;
  }
}

function getRunFailure(
  runStatus: string,
  runError: string | undefined,
  reportType: ReportType,
) {
  if (runStatus === 'CANCELED') {
    return {
      currentStep: 'Report generation cancelled',
      errorMessage: 'This report was cancelled before it finished.',
    };
  }

  if (runStatus === 'TIMED_OUT' || runStatus === 'EXPIRED') {
    return {
      currentStep: 'Report generation timed out',
      errorMessage: 'This report timed out before it finished.',
    };
  }

  return {
    currentStep:
      reportType === 'KEYWORD'
        ? 'Keyword research failed'
        : 'AI visibility scan failed',
    errorMessage: runError
      ? sanitizeScanErrorMessage(runError)
      : `Trigger run ended with ${runStatus}`,
  };
}
