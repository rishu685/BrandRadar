import { NextResponse } from 'next/server';
import { auth as triggerAuth } from '@trigger.dev/sdk';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { reconcileTerminalReport } from '@/lib/reports';
import type { KeywordReport } from '@/lib/keyword-report';
import type { ReportDetailResponse, ReportProvenance } from '@/types/reports';
import type { VisibilityReportResult } from '@/types/search-visibility';

const reportIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

type ReportRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: ReportRouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const reportId = reportIdSchema.safeParse((await params).id);
  if (!reportId.success) {
    return NextResponse.json({ message: 'Report not found' }, { status: 404 });
  }

  const reportRow = await prisma.report.findFirst({
    where: {
      id: reportId.data,
      userId: user.id,
    },
    select: {
      id: true,
      type: true,
      status: true,
      provenance: true,
      keyword: true,
      language: true,
      country: true,
      website: true,
      brand: true,
      topic: true,
      progress: true,
      currentStep: true,
      triggerRunId: true,
      result: true,
      errorMessage: true,
      createdAt: true,
      completedAt: true,
    },
  });

  if (!reportRow) {
    return NextResponse.json({ message: 'Report not found' }, { status: 404 });
  }

  const report = await reconcileTerminalReport(reportRow);
  const isKeywordReport = report.type === 'KEYWORD';
  const status =
    report.status === 'COMPLETED'
      ? 'completed'
      : report.status === 'FAILED'
        ? 'failed'
        : 'processing';

  const response: ReportDetailResponse = {
    report: {
      id: report.id,
      type: isKeywordReport ? 'keyword' : 'visibility',
      status,
      provenance: parseReportProvenance(report.provenance),
      title: isKeywordReport
        ? report.keyword?.trim() || 'Untitled keyword report'
        : report.brand?.trim() ||
          report.website?.trim() ||
          'Untitled visibility report',
      description: isKeywordReport
        ? `${report.language?.trim() || 'English'} · ${report.country?.trim() || '—'}`
        : report.topic?.trim() ||
          report.website?.trim() ||
          'AI visibility scan',
      progress: Math.min(100, Math.max(0, report.progress)),
      currentStep: report.currentStep || 'Preparing report',
      errorMessage: report.errorMessage,
      triggerRunId: report.triggerRunId,
      keyword: report.keyword,
      visibilitySearch:
        !isKeywordReport && report.website && report.brand && report.topic
          ? {
              website: report.website,
              brand: report.brand,
              topic: report.topic,
            }
          : null,
      result: isKeywordReport ? (report.result as KeywordReport | null) : null,
      visibilityResult: !isKeywordReport
        ? (report.result as VisibilityReportResult | null)
        : null,
      createdAt: report.createdAt.toISOString(),
      completedAt: report.completedAt?.toISOString() ?? null,
    },
  };

  if (status === 'processing' && report.triggerRunId && process.env.TRIGGER_SECRET_KEY) {
    try {
      response.realtimeAccessToken = await triggerAuth.createPublicToken({
        scopes: { read: { runs: report.triggerRunId } },
        expirationTime: '1h',
      });
    } catch (err) {
      console.warn('Realtime token generation skipped:', err);
    }
  }

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function parseReportProvenance(value: string | null | undefined): ReportProvenance {
  if (value === 'LIVE') return 'LIVE';
  if (value === 'AI_GENERATED') return 'AI_GENERATED';
  if (value === 'DEMO') return 'DEMO';
  return 'UNKNOWN';
}
