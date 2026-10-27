'use client';
import { KeywordReportLandscape } from '@/components/ai-keyword/keywordReportLandscape';
import { KeywordReportOpportunities } from '@/components/ai-keyword/keywordReportOpportunities';
import { KeywordReportSummary } from '@/components/ai-keyword/keywordReportSummary';
import { useBilling } from '@/hooks/use-billing';
import type { KeywordReport } from '@/lib/keyword-report';

type KeywordReportViewProps = {
  keyword: string;
  report: KeywordReport;
};

export function KeywordReportView({ keyword, report }: KeywordReportViewProps) {
  const billing = useBilling();
  const premiumLocked = billing.data?.isPaid !== true;

  return (
    <div className='flex flex-col gap-8 pb-8'>
      <KeywordReportSummary
        keyword={keyword}
        report={report}
        premiumLocked={premiumLocked}
      />
      <KeywordReportLandscape report={report} premiumLocked={premiumLocked} />
      <KeywordReportOpportunities report={report} />
    </div>
  );
}
