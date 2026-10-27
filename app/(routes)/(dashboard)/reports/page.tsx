'use client';
import { useQuery } from '@tanstack/react-query';
import { FileClockIcon } from 'lucide-react';
import type { ReportsResponse } from '@/types/reports';
import { ReportsTable } from '@/components/reports/reportsTable';

const fetchReports = async (): Promise<ReportsResponse> => {
  const response = await fetch('/api/reports');
  const body = (await response.json().catch(() => null)) as
    | ReportsResponse
    | { message?: string }
    | null;

  if (!response.ok || !body || !('reports' in body)) {
    throw new Error(
      body && 'message' in body && body.message
        ? body.message
        : 'Unable to load reports',
    );
  }

  return body;
};

export default function ReportsPage() {
  const reportsQuery = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
    refetchInterval: (query) =>
      query.state.data?.reports.some((report) => report.status === 'processing')
        ? 3_000
        : false,
  });

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 sm:px-8'>
      <div className='flex flex-col gap-2'>
        <p className='flex items-center gap-2 text-sm font-semibold text-primary'>
          <FileClockIcon className='size-4' aria-hidden='true' />
          Saved report history
        </p>
        <h1 className='text-4xl font-black tracking-tighter'>All reports</h1>
        <p className='max-w-2xl text-sm leading-relaxed text-muted-foreground'>
          Review previous keyword research and AI visibility reports, or check
          the progress of work still running in the background.
        </p>
      </div>

      <ReportsTable
        reports={reportsQuery.data?.reports}
        isLoading={reportsQuery.isPending}
        error={reportsQuery.isError ? reportsQuery.error.message : undefined}
        onRetry={() => void reportsQuery.refetch()}
      />
    </div>
  );
}
