'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRealtimeRun } from '@trigger.dev/react-hooks';
import { CheckIcon, CircleIcon, LoaderCircleIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { KeywordReport } from '@/lib/keyword-report';
import type { keywordResearchTask } from '@/trigger/keyword-research';
import type { KeywordResearchResponse } from '@/types/keyword-research';

const keywordSteps = [
  'Preparing keyword search',
  'Collecting research sources',
  'Reviewing cited sources',
  'Analysing research findings',
  'Building keyword report',
];

type LiveReportProgressProps = {
  jobId?: string;
  accessToken?: string;
  initialProgress: KeywordResearchResponse['report'];
  keyword: string;
  onComplete: (
    result: KeywordReport | null,
    succeeded: boolean,
    errorMessage?: string,
  ) => void;
  runId: string;
};

export function LiveReportProgress({
  jobId,
  accessToken,
  initialProgress,
  keyword,
  onComplete,
  runId,
}: LiveReportProgressProps) {
  const initialStepIndex = Math.max(
    0,
    keywordSteps.findIndex((step) => step === initialProgress.currentStep),
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
          const stepIndex = keywordSteps.findIndex(
            (s) => s === report.currentStep,
          );
          if (stepIndex !== -1) {
            setMaxStepIndex((prev) => Math.max(prev, stepIndex));
          }
        }

        if (report.status === 'completed' && report.result) {
          clearInterval(interval);
          onComplete(report.result, true);
        } else if (report.status === 'failed') {
          clearInterval(interval);
          onComplete(
            null,
            false,
            report.errorMessage ?? 'The keyword research failed.',
          );
        }
      } catch (err) {
        console.warn('Keyword polling error:', err);
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
      },
      subscriptionError?: Error,
    ) => {
      const output = completedRun.output as
        | { report?: KeywordReport | null }
        | undefined;

      const result = output?.report ?? null;
      const succeeded =
        completedRun.status === 'COMPLETED' &&
        !subscriptionError &&
        result !== null;

      const errorMessage = succeeded
        ? undefined
        : (subscriptionError?.message ??
          ('error' in completedRun &&
          completedRun.error &&
          typeof completedRun.error === 'object' &&
          'message' in completedRun.error &&
          typeof completedRun.error.message === 'string'
            ? completedRun.error.message
            : 'The research run finished without a report result.'));

      onComplete(result, succeeded, errorMessage);
    },
    [onComplete],
  );

  const { run, error } = useRealtimeRun<typeof keywordResearchTask>(runId, {
    accessToken,
    enabled: Boolean(runId && accessToken),
    onComplete: handleRunComplete,
    skipColumns: ['payload'],
  });

  const metadataProgress = run?.metadata?.progress;
  const metadataStep = run?.metadata?.currentStep;

  const receivedStepIndex =
    typeof metadataStep === 'string'
      ? keywordSteps.findIndex((step) => step === metadataStep)
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
    keywordSteps[activeStepIndex] ?? initialProgress.currentStep;
  const safeProgress = currentProgress;

  return (
    <Card
      className='rounded-2xl border shadow-none ring-0 [--card-spacing:--spacing(7)]'
      aria-live='polite'
      aria-label={`Generating report for ${keyword}`}
    >
      <CardHeader className='border-b'>
        <CardTitle className='text-2xl font-semibold tracking-tight normal-case'>
          Generating your report
        </CardTitle>

        <CardDescription className='text-base'>
          You can leave this page. BrandRadar will keep processing the report.
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-col gap-7'>
        {error && (
          <div
            className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'
            role='alert'
          >
            {error.message ||
              'The live report connection was interrupted. Please try again.'}
          </div>
        )}

        <div className='flex flex-col gap-2.5'>
          <div className='flex items-center justify-between gap-4 text-sm'>
            <span className='font-semibold'>{currentStep}</span>

            <span className='font-semibold tabular-nums'>{safeProgress}%</span>
          </div>

          <div
            className='h-2 overflow-hidden rounded-full bg-muted'
            role='progressbar'
            aria-label={`Report generation progress for ${keyword}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={safeProgress}
          >
            <div
              className='h-full rounded-full bg-primary transition-[width] duration-500'
              style={{
                width: `${safeProgress}%`,
              }}
            />
          </div>
        </div>

        <div className='grid gap-x-10 gap-y-4 sm:grid-cols-2'>
          {keywordSteps.map((step, index) => {
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
