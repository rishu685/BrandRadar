'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRealtimeRun } from '@trigger.dev/react-hooks';
import {
  CheckIcon,
  CircleAlertIcon,
  CircleIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { searchVisibilityTask } from '@/trigger/search-visibility';
import type { VisibilityReportResult } from '@/types/search-visibility';

export const visibilitySteps = [
  'Preparing visibility scan',
  'Creating customer prompts',
  'Checking ChatGPT and Gemini',
  'Analysing brand mentions',
  'Building visibility report',
] as const;

type VisibilityProgress = {
  status: 'PENDING' | 'COLLECTING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  progress: number;
  currentStep: string;
  errorMessage?: string | null;
};

type LiveVisibilityProgressProps = {
  jobId?: string;
  accessToken?: string;
  initialProgress: VisibilityProgress;
  onComplete?: (
    result: VisibilityReportResult | null,
    succeeded: boolean,
    errorMessage?: string,
  ) => void;
  runId?: string;
};

export function LiveVisibilityProgress({
  jobId,
  accessToken,
  initialProgress,
  onComplete,
  runId,
}: LiveVisibilityProgressProps) {
  const initialStepIndex = Math.max(
    0,
    visibilitySteps.findIndex((step) => step === initialProgress.currentStep),
  );

  const [maxStepIndex, setMaxStepIndex] = useState(initialStepIndex);
  const [maxProgress, setMaxProgress] = useState(
    Math.min(100, Math.max(0, initialProgress.progress ?? 0)),
  );

  // Direct scanner polling fallback when Trigger.dev realtime token is not present
  useEffect(() => {
    if (!jobId || Boolean(accessToken && accessToken.length > 0)) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/reports/${jobId}`);
        if (!response.ok) return;
        const data = await response.json();
        const report = data.report;
        if (!isSubscribed || !report) return;

        if (typeof report.progress === 'number') {
          setMaxProgress((prev) => Math.max(prev, report.progress));
        }

        if (report.currentStep) {
          const stepIndex = visibilitySteps.findIndex(
            (s) => s === report.currentStep,
          );
          if (stepIndex !== -1) {
            setMaxStepIndex((prev) => Math.max(prev, stepIndex));
          }
        }

        if (report.status === 'completed' && report.visibilityResult) {
          clearInterval(interval);
          onComplete?.(report.visibilityResult, true);
        } else if (report.status === 'failed') {
          clearInterval(interval);
          onComplete?.(
            null,
            false,
            report.errorMessage ?? 'The visibility scan failed.',
          );
        }
      } catch (err) {
        console.warn('Scan polling error:', err);
      }
    }, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [jobId, accessToken, onComplete]);

  const handleRunComplete = useCallback(
    (
      completedRun: {
        status: string;
        output?: unknown;
        error?: { message?: string };
      },
      completionError?: Error,
    ) => {
      const output = completedRun.output as
        | { report?: VisibilityReportResult | null }
        | undefined;

      const result = output?.report ?? null;
      const succeeded =
        completedRun.status === 'COMPLETED' &&
        !completionError &&
        result !== null;

      const errorMessage = succeeded
        ? undefined
        : (completionError?.message ??
          completedRun.error?.message ??
          'The visibility scan finished without a report result.');

      onComplete?.(result, succeeded, errorMessage);
    },
    [onComplete],
  );

  const { run, error } = useRealtimeRun<typeof searchVisibilityTask>(runId, {
    accessToken,
    enabled: Boolean(runId && accessToken),
    onComplete: handleRunComplete,
    skipColumns: ['payload'],
  });

  const metadataProgress = run?.metadata?.progress;
  const metadataStep = run?.metadata?.currentStep;

  const receivedStepIndex =
    typeof metadataStep === 'string'
      ? visibilitySteps.findIndex((step) => step === metadataStep)
      : -1;
  const currentStepIndex = Math.max(maxStepIndex, receivedStepIndex);

  const receivedProgress =
    typeof metadataProgress === 'number'
      ? Math.min(100, Math.max(0, metadataProgress))
      : 0;
  const currentProgress = Math.max(maxProgress, receivedProgress);

  if (currentStepIndex > maxStepIndex) {
    queueMicrotask(() => {
      setMaxStepIndex((previous) => Math.max(previous, currentStepIndex));
    });
  }

  if (currentProgress > maxProgress) {
    queueMicrotask(() => {
      setMaxProgress((previous) => Math.max(previous, currentProgress));
    });
  }

  const activeStepIndex = currentStepIndex;
  const currentStep =
    visibilitySteps[activeStepIndex] ?? initialProgress.currentStep;
  const safeProgress = currentProgress;

  const realtimeError = error?.message ?? run?.error?.message;
  const failed =
    initialProgress.status === 'FAILED' ||
    Boolean(realtimeError) ||
    Boolean(run?.isCompleted && !run.isSuccess);

  if (failed) {
    return (
      <Card
        className='rounded-2xl border border-destructive/30 shadow-none ring-0'
        role='alert'
      >
        <CardHeader>
          <CircleAlertIcon className='size-6 text-destructive' />
          <CardTitle className='text-2xl font-semibold tracking-tight normal-case'>
            We couldn&apos;t finish this visibility scan
          </CardTitle>
          <CardDescription className='text-base'>
            {realtimeError ??
              initialProgress.errorMessage ??
              'Something went wrong while checking your AI visibility.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      className='rounded-2xl border shadow-none ring-0 [--card-spacing:--spacing(7)]'
      aria-live='polite'
      aria-label='Generating AI visibility report'
    >
      <CardHeader className='border-b'>
        <CardTitle className='text-2xl font-semibold tracking-tight normal-case'>
          Checking your AI visibility
        </CardTitle>
        <CardDescription className='text-base'>
          You can leave this page. BrandRadar will keep processing the scan.
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-col gap-7'>
        <div className='flex flex-col gap-2.5'>
          <div className='flex items-center justify-between gap-4 text-sm'>
            <span className='font-semibold'>{currentStep}</span>
            <span className='font-semibold tabular-nums'>{safeProgress}%</span>
          </div>

          <div
            className='h-2 overflow-hidden rounded-full bg-muted'
            role='progressbar'
            aria-label='AI visibility scan progress'
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={safeProgress}
          >
            <div
              className='h-full rounded-full bg-primary transition-[width] duration-500'
              style={{ width: `${safeProgress}%` }}
            />
          </div>
        </div>

        <div className='grid gap-x-10 gap-y-4 sm:grid-cols-2'>
          {visibilitySteps.map((step, index) => {
            const isComplete = index < activeStepIndex;
            const isActive = index === activeStepIndex;

            return (
              <div key={step} className='flex items-center gap-3 text-sm'>
                {isComplete ? (
                  <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <CheckIcon className='size-4' aria-hidden='true' />
                  </span>
                ) : isActive ? (
                  <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <LoaderCircleIcon
                      className='size-4 animate-spin'
                      aria-hidden='true'
                    />
                  </span>
                ) : (
                  <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                    <CircleIcon className='size-3.5' aria-hidden='true' />
                  </span>
                )}

                <span className={isActive ? 'font-semibold' : undefined}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
