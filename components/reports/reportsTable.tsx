'use client';
import Link from 'next/link';
import {
  BarChart3Icon,
  CheckCircle2Icon,
  CircleAlertIcon,
  EyeIcon,
  FileTextIcon,
  SearchIcon,
} from 'lucide-react';
import { ReportsTableSkeleton } from '@/components/reports/reportsTableSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ReportListItem, ReportListStatus } from '@/types/reports';

type ReportsTableProps = {
  reports?: ReportListItem[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
};

export function ReportsTable({
  reports = [],
  isLoading = false,
  error,
  onRetry,
}: ReportsTableProps) {
  return (
    <Tabs defaultValue='all'>
      <TabsList className='h-10 rounded-xl'>
        <TabsTrigger
          value='all'
          className='h-full rounded-lg px-4 tracking-normal normal-case'
        >
          All reports
        </TabsTrigger>
        <TabsTrigger
          value='keyword'
          className='h-full rounded-lg px-4 tracking-normal normal-case'
        >
          Keyword research
        </TabsTrigger>
        <TabsTrigger
          value='visibility'
          className='h-full rounded-lg px-4 tracking-normal normal-case'
        >
          AI visibility
        </TabsTrigger>
      </TabsList>

      <TabsContent value='all' className='mt-4'>
        <ReportTableCard
          reports={reports}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
        />
      </TabsContent>
      <TabsContent value='keyword' className='mt-4'>
        <ReportTableCard
          reports={reports.filter((report) => report.type === 'keyword')}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
        />
      </TabsContent>
      <TabsContent value='visibility' className='mt-4'>
        <ReportTableCard
          reports={reports.filter((report) => report.type === 'visibility')}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
        />
      </TabsContent>
    </Tabs>
  );
}

function ReportTableCard({
  reports,
  isLoading,
  error,
  onRetry,
}: Required<Pick<ReportsTableProps, 'reports' | 'isLoading'>> &
  Pick<ReportsTableProps, 'error' | 'onRetry'>) {
  const completedReports = reports.filter(
    (report) => report.status === 'completed',
  ).length;

  return (
    <Card className='gap-0 rounded-2xl border shadow-none ring-0'>
      <CardHeader className='border-b py-7'>
        <CardTitle className='text-xl tracking-tight normal-case'>
          Recent reports
        </CardTitle>
        <CardDescription className='text-base'>
          Open completed results or follow reports that are still processing.
        </CardDescription>
      </CardHeader>

      <CardContent className='px-0'>
        {error ? (
          <div className='flex min-h-52 flex-col items-center justify-center gap-3 px-5 text-center'>
            <CircleAlertIcon className='size-6 text-destructive' />
            <div className='grid gap-1'>
              <p className='font-semibold'>Couldn&apos;t load reports</p>
              <p className='text-sm text-muted-foreground'>{error}</p>
            </div>
            {onRetry && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={onRetry}
              >
                Try again
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-5'>Report</TableHead>
                <TableHead className='hidden md:table-cell'>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='hidden sm:table-cell'>Created</TableHead>
                <TableHead className='hidden lg:table-cell'>
                  Completed
                </TableHead>
                <TableHead className='pr-5 text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <ReportsTableSkeleton />
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='h-52 text-center text-muted-foreground'
                  >
                    No reports in this view yet.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <ReportRow key={report.id} report={report} />
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <div className='flex min-h-14 flex-wrap items-center gap-4 border-t px-5 py-4 text-xs text-muted-foreground'>
        {isLoading ? (
          <Skeleton className='h-4 w-44' />
        ) : error ? (
          <span>Report data unavailable</span>
        ) : (
          <>
            <span>{reports.length} total reports</span>
            <span className='flex items-center gap-1.5'>
              <CheckCircle2Icon className='size-3.5 text-primary' />
              {completedReports} completed
            </span>
          </>
        )}
      </div>
    </Card>
  );
}

function ReportRow({ report }: { report: ReportListItem }) {
  return (
    <TableRow>
      <TableCell className='min-w-64 pl-5'>
        <div className='flex items-center gap-3'>
          <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <FileTextIcon className='size-4' aria-hidden='true' />
          </span>
          <span className='flex min-w-0 flex-col gap-0.5'>
            <Link
              href={`/reports/${report.id}`}
              className='max-w-64 truncate font-semibold hover:text-primary'
            >
              {report.title}
            </Link>
            <span className='max-w-64 truncate text-xs text-muted-foreground'>
              {report.description}
            </span>
          </span>
        </div>
      </TableCell>
      <TableCell className='hidden md:table-cell'>
        <span className='flex items-center gap-2'>
          {report.type === 'keyword' ? (
            <SearchIcon className='size-4 text-muted-foreground' />
          ) : (
            <BarChart3Icon className='size-4 text-muted-foreground' />
          )}
          {report.type === 'keyword' ? 'Keyword research' : 'AI visibility'}
        </span>
      </TableCell>
      <TableCell>
        <ReportStatusBadge status={report.status} progress={report.progress} />
      </TableCell>
      <TableCell className='hidden text-muted-foreground sm:table-cell'>
        {formatReportDate(report.createdAt)}
      </TableCell>
      <TableCell className='hidden text-muted-foreground lg:table-cell'>
        {report.completedAt ? formatReportDate(report.completedAt) : '—'}
      </TableCell>
      <TableCell className='pr-5 text-right'>
        <Button
          variant='ghost'
          size='sm'
          render={<Link href={`/reports/${report.id}`} />}
          nativeButton={false}
          className='tracking-normal'
        >
          <EyeIcon data-icon='inline-start' />
          {report.status === 'processing' ? 'View progress' : 'View'}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ReportStatusBadge({
  status,
  progress,
}: {
  status: ReportListStatus;
  progress: number;
}) {
  if (status === 'completed') {
    return (
      <Badge className='rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary tracking-normal normal-case'>
        <CheckCircle2Icon />
        Completed
      </Badge>
    );
  }

  if (status === 'failed') {
    return (
      <Badge
        variant='destructive'
        className='rounded-full bg-destructive/10 px-2.5 py-1 text-xs tracking-normal normal-case'
      >
        <CircleAlertIcon />
        Failed
      </Badge>
    );
  }

  return (
    <Badge className='rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground tracking-normal normal-case'>
      <Spinner />
      Processing · {progress}%
    </Badge>
  );
}

function formatReportDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
