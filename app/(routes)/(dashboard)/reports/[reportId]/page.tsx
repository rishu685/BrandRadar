'use client';
import { useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  BarChart3Icon,
  BotIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  SearchIcon,
  SparklesIcon,
} from 'lucide-react';
import { KeywordReportView } from '@/components/reports/keywordReportView';
import { LiveReportProgress } from '@/components/reports/liveReportProgress';
import { ReportFailed } from '@/components/reports/reportFailed';
import { LiveVisibilityProgress } from '@/components/ai-search-visibility/liveVisibilityProgress';
import { VisibilityResults } from '@/components/ai-search-visibility/visibilityResults';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { ReportDetailResponse, ReportProvenance } from '@/types/reports';

const fetchReport = async (reportId: string): Promise<ReportDetailResponse> => {
  const response = await fetch(`/api/reports/${reportId}`);
  const body = (await response.json().catch(() => null)) as
    | ReportDetailResponse
    | { message?: string }
    | null;

  if (!response.ok || !body || !('report' in body)) {
    throw new Error(
      body && 'message' in body && body.message
        ? body.message
        : 'Unable to load report',
    );
  }

  return body;
};

export default function ReportPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const queryClient = useQueryClient();

  const refreshReport = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['reports', reportId] });
    void queryClient.invalidateQueries({ queryKey: ['reports'] });
  }, [reportId, queryClient]);

  const reportQuery = useQuery({
    queryKey: ['reports', reportId],
    queryFn: () => fetchReport(reportId),
    enabled: Boolean(reportId),
    refetchInterval: (query) => {
      if (query.state.data?.realtimeAccessToken) return false;
      return query.state.data?.report.status === 'processing' ? 3_000 : false;
    },
  });

  if (reportQuery.isPending) {
    return (
      <div className='flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground'>
        <Spinner />
        Loading report...
      </div>
    );
  }

  if (reportQuery.isError) {
    return (
      <div className='mx-auto w-full max-w-6xl px-5 py-8 sm:px-8'>
        <ReportFailed errorMessage={reportQuery.error.message} />
      </div>
    );
  }

  const { report, realtimeAccessToken } = reportQuery.data;

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 sm:px-8'>
      <div className='flex flex-col gap-5'>
        <Button
          variant='ghost'
          size='sm'
          render={<Link href='/reports' />}
          nativeButton={false}
          className='w-fit tracking-normal'
        >
          <ArrowLeftIcon data-icon='inline-start' />
          All reports
        </Button>

        <div className='flex flex-wrap items-center justify-between gap-3 border-b pb-5'>
          <div className='flex flex-wrap items-center gap-2.5'>
            <span className='flex items-center gap-2 text-sm tracking-normal normal-case'>
              {report.type === 'keyword' ? (
                <SearchIcon className='size-3.5' data-icon='inline-start' />
              ) : (
                <BarChart3Icon className='size-3.5' data-icon='inline-start' />
              )}
              {report.type === 'keyword' ? 'Keyword research' : 'AI visibility'}
            </span>

            <span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <CalendarIcon className='size-3.5' aria-hidden='true' />
              {formatReportDate(report.createdAt)}
            </span>
          </div>

          {report.completedAt && (
            <p className='text-xs text-muted-foreground'>
              Completed {formatReportDate(report.completedAt)}
            </p>
          )}
        </div>
      </div>

      {report.status === 'completed' && (
        <ReportProvenanceNotice provenance={report.provenance} />
      )}

      {report.type === 'visibility' && report.status === 'failed' ? (
        <ReportFailed errorMessage={report.errorMessage} />
      ) : report.type === 'visibility' && report.status === 'completed' ? (
        report.visibilitySearch && report.visibilityResult ? (
          <VisibilityResults
            search={report.visibilitySearch}
            report={report.visibilityResult}
          />
        ) : (
          <ReportFailed errorMessage='This visibility report completed without a saved result.' />
        )
      ) : report.type === 'visibility' &&
        report.triggerRunId &&
        realtimeAccessToken ? (
        <LiveVisibilityProgress
          initialProgress={{
            status: 'PENDING',
            progress: report.progress,
            currentStep: report.currentStep,
          }}
          runId={report.triggerRunId}
          accessToken={realtimeAccessToken}
          onComplete={refreshReport}
        />
      ) : report.type === 'visibility' ? (
        <ReportFailed errorMessage='This visibility report cannot reconnect to its live run.' />
      ) : report.status === 'failed' ? (
        <ReportFailed errorMessage={report.errorMessage} />
      ) : report.status === 'completed' ? (
        report.keyword && report.result ? (
          <KeywordReportView keyword={report.keyword} report={report.result} />
        ) : (
          <ReportFailed errorMessage='This keyword report completed without a saved result.' />
        )
      ) : report.triggerRunId && realtimeAccessToken ? (
        <LiveReportProgress
          keyword={report.keyword || report.title}
          initialProgress={{
            status: 'PENDING',
            progress: report.progress,
            currentStep: report.currentStep,
          }}
          runId={report.triggerRunId}
          accessToken={realtimeAccessToken}
          onComplete={refreshReport}
        />
      ) : (
        <ReportFailed errorMessage='This keyword report cannot reconnect to its live run.' />
      )}
    </div>
  );
}

function formatReportDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ReportProvenanceNotice({ provenance }: { provenance?: ReportProvenance }) {
  if (provenance === 'DEMO') {
    return (
      <div
        role='alert'
        className='flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300'
      >
        <SparklesIcon className='mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400' />
        <div className='flex flex-col gap-0.5'>
          <p className='font-semibold'>Simulated Demo Report</p>
          <p className='text-xs text-amber-700/90 dark:text-amber-400/90'>
            This report was generated using simulated benchmark data and does not represent live search engine observations.
          </p>
        </div>
      </div>
    );
  }

  if (provenance === 'AI_GENERATED') {
    return (
      <div className='flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm text-indigo-900 dark:text-indigo-200'>
        <BotIcon className='mt-0.5 size-5 shrink-0 text-indigo-600 dark:text-indigo-400' />
        <div className='flex flex-col gap-0.5'>
          <p className='font-semibold'>AI Model Estimation</p>
          <p className='text-xs text-muted-foreground'>
            This report was generated directly by AI model synthesis and does not represent independently collected live SERP observations.
          </p>
        </div>
      </div>
    );
  }

  if (provenance === 'UNKNOWN') {
    return (
      <div className='flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground'>
        <CircleAlertIcon className='mt-0.5 size-5 shrink-0 text-muted-foreground' />
        <div className='flex flex-col gap-0.5'>
          <p className='font-semibold text-foreground'>Legacy Report</p>
          <p className='text-xs'>
            This report was completed prior to provenance tracking. Execution provenance cannot be independently verified.
          </p>
        </div>
      </div>
    );
  }

  if (provenance === 'LIVE') {
    return (
      <div className='flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300'>
        <CheckCircle2Icon className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
        <span>Verified live search audit from external platform observations.</span>
      </div>
    );
  }

  return null;
}
