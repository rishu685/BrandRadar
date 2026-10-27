'use client';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  KeywordSearchRow,
  KeywordSearchValues,
} from '@/components/ai-keyword/keywordSearchRow';
import { useMutation } from '@tanstack/react-query';
import { KeywordReport } from '@/lib/keyword-report';
import { KeywordLandingState } from '@/components/ai-keyword/keywordLandingState';
import { KeywordReportView } from '@/components/reports/keywordReportView';
import { ReportFailed } from '@/components/reports/reportFailed';
import { LiveReportProgress } from '@/components/reports/liveReportProgress';
import { KeywordResearchResponse } from '@/types/keyword-research';
import { useBilling } from '@/hooks/use-billing';

const AIKeyword = () => {
  const [submittedKeyword, setSubmittedKeyword] = useState<string | null>(null);
  const [researchFinished, setResearchFinished] = useState(false);
  const [researchSucceeded, setResearchSucceeded] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<KeywordReport | null>(null);
  const [submittedSearch, setSubmittedSearch] =
    useState<KeywordSearchValues | null>(null);
  const [researchResponse, setResearchResponse] =
    useState<KeywordResearchResponse | null>(null);
  const billing = useBilling();

  const startKeywordResearch = async (input: {
    keyword: string;
    country: string;
  }): Promise<KeywordResearchResponse> => {
    const response = await fetch('/api/keyword-research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    if (!response.ok) {
      throw new Error(body?.message ?? 'Unable to start keyword research');
    }

    return body as KeywordResearchResponse;
  };

  const keywordResearchMutation = useMutation({
    mutationFn: startKeywordResearch,
  });

  const handleSearch = async (values: KeywordSearchValues) => {
    if (billing.data?.usage.keywordSearches.remaining === 0) {
      toast.error('Keyword search limit reached', {
        description: billing.data.isPaid
          ? 'Your monthly allowance has been used.'
          : 'Upgrade your plan to run more keyword searches.',
      });
      return;
    }

    setSubmittedKeyword(values.keyword);
    setSubmittedSearch(values);
    setResearchFinished(false);
    setResearchSucceeded(false);
    setFailureMessage(null);
    setReportResult(null);
    setResearchResponse(null);

    try {
      const response = await keywordResearchMutation.mutateAsync({
        keyword: values.keyword,
        country: values.country,
      });

      setResearchResponse(response);
      void billing.refetch();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to start keyword research';

      setResearchFinished(true);
      setFailureMessage(message);
      toast.error(message);
    }
  };

  const handleResearchComplete = useCallback(
    (
      result: KeywordReport | null,
      succeeded: boolean,
      errorMessage?: string,
    ) => {
      setReportResult(result);
      setResearchSucceeded(succeeded);
      setFailureMessage(succeeded ? null : (errorMessage ?? null));
      setResearchFinished(true);
    },
    [],
  );

  const isResearching =
    keywordResearchMutation.isPending ||
    Boolean(researchResponse && !researchFinished);

  return (
    <div className='min-h-full bg-muted/20'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6 sm:px-8'>
        <KeywordSearchRow
          isSearching={isResearching}
          onSearch={handleSearch}
          remaining={billing.data?.usage.keywordSearches.remaining}
          isPaid={billing.data?.isPaid}
        />

        {researchResponse && submittedKeyword && !researchFinished ? (
          <LiveReportProgress
            jobId={researchResponse.jobId}
            keyword={submittedKeyword}
            initialProgress={researchResponse.report}
            runId={researchResponse.runId}
            accessToken={researchResponse.publicAccessToken}
            onComplete={handleResearchComplete}
          />
        ) : researchFinished &&
          researchSucceeded &&
          submittedKeyword &&
          reportResult ? (
          <KeywordReportView keyword={submittedKeyword} report={reportResult} />
        ) : researchFinished && !researchSucceeded ? (
          <ReportFailed
            errorMessage={failureMessage}
            isRetrying={false}
            onRetry={submittedSearch ? () => {} : undefined}
          />
        ) : (
          <KeywordLandingState />
        )}
      </div>
    </div>
  );
};

export default AIKeyword;
