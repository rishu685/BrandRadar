import { CircleAlertIcon, LoaderCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ReportFailedProps = {
  errorMessage?: string | null;
  isRetrying?: boolean;
  onRetry?: () => void;
};

export function ReportFailed({
  errorMessage,
  isRetrying = false,
  onRetry,
}: ReportFailedProps) {
  return (
    <Card
      className='min-h-72 rounded-2xl border shadow-none ring-0 [--card-spacing:--spacing(7)] sm:min-h-80'
      role='alert'
    >
      <CardHeader className='gap-4 pb-0 sm:pt-3'>
        <CircleAlertIcon
          className='size-7 text-destructive'
          strokeWidth={2}
          aria-hidden='true'
        />

        <div className='grid gap-2'>
          <CardTitle className='text-2xl font-semibold tracking-tight normal-case'>
            We couldn&apos;t finish this report
          </CardTitle>
          <CardDescription className='max-w-3xl text-base'>
            {errorMessage?.trim() ||
              'Something went wrong while generating this report. Please try again.'}
          </CardDescription>
        </div>
      </CardHeader>

      {onRetry && (
        <CardContent className='mt-auto pb-3'>
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying && (
              <LoaderCircleIcon className='animate-spin' aria-hidden='true' />
            )}
            Retry report
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
