'use client';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { LiveVisibilityProgress } from '@/components/ai-search-visibility/liveVisibilityProgress';
import { VisibilityLandingState } from '@/components/ai-search-visibility/visibilityLandingState';
import { VisibilityResults } from '@/components/ai-search-visibility/visibilityResults';
import { VisibilitySearchForm } from '@/components/ai-search-visibility/visibilitySearchForm';
import type { SearchVisibilityResponse } from '@/types/search-visibility';
import type { VisibilityReportResult } from '@/types/search-visibility';
import { VisibilitySearchValues } from '@/lib/search-visibility-schema';
import { useBilling } from '@/hooks/use-billing';

export default function AiSearchVisibilityPage() {
  const billing = useBilling();
  const [submittedSearch, setSubmittedSearch] =
    useState<VisibilitySearchValues | null>(null);
  const [searchResponse, setSearchResponse] =
    useState<SearchVisibilityResponse | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [reportResult, setReportResult] =
    useState<VisibilityReportResult | null>(null);
  const [scanFinished, setScanFinished] = useState(false);

  async function handleSearch(values: VisibilitySearchValues) {
    if (isStarting || (searchResponse && !scanFinished)) return;

    if (billing.data?.usage.visibilityScans.remaining === 0) {
      toast.error('Visibility scan limit reached', {
        description: billing.data.isPaid
          ? 'Your monthly allowance has been used.'
          : 'Upgrade your plan to run more visibility scans.',
      });
      return;
    }

    setSubmittedSearch(values);
    setReportResult(null);
    setSearchResponse(null);
    setScanFinished(false);
    setIsStarting(true);
    setRequestError(null);

    try {
      const response = await fetch('/api/search-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body = (await response.json().catch(() => null)) as
        | SearchVisibilityResponse
        | { message?: string }
        | null;

      if (!response.ok || !body || !('runId' in body)) {
        throw new Error(
          body && 'message' in body && body.message
            ? body.message
            : 'Unable to start AI visibility scan',
        );
      }

      setSearchResponse(body);
      void billing.refetch();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to start AI visibility scan';
      setRequestError(message);
      toast.error(message);
    } finally {
      setIsStarting(false);
    }
  }

  const handleScanComplete = useCallback(
    (
      result: VisibilityReportResult | null,
      succeeded: boolean,
      errorMessage?: string,
    ) => {
      setScanFinished(true);

      if (succeeded && result) {
        setReportResult(result);
        setRequestError(null);
        return;
      }

      setRequestError(
        errorMessage ?? 'The AI visibility scan finished without a report.',
      );
    },
    [],
  );

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-6 sm:px-8'>
      <VisibilitySearchForm
        isSearching={isStarting || Boolean(searchResponse && !scanFinished)}
        onSearch={handleSearch}
        remaining={billing.data?.usage.visibilityScans.remaining}
        isPaid={billing.data?.isPaid}
      />

      {submittedSearch && reportResult ? (
        <VisibilityResults search={submittedSearch} report={reportResult} />
      ) : submittedSearch && (isStarting || searchResponse || requestError) ? (
        <LiveVisibilityProgress
          jobId={searchResponse?.jobId}
          initialProgress={
            searchResponse?.report ?? {
              status: requestError ? 'FAILED' : 'PENDING',
              progress: 5,
              currentStep: 'Preparing visibility scan',
              errorMessage: requestError,
            }
          }
          runId={searchResponse?.runId}
          accessToken={searchResponse?.publicAccessToken}
          onComplete={handleScanComplete}
        />
      ) : (
        <VisibilityLandingState />
      )}
    </div>
  );
}
