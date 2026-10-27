import {
  BotIcon,
  CheckCircle2Icon,
  FileTextIcon,
  Globe2Icon,
  Link2Icon,
  SparklesIcon,
  UsersRoundIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeatureLock } from '@/components/featureLock';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getKeywordScoreLabel,
  getKeywordScoreTone,
  type KeywordReport,
  type KeywordReportTone,
} from '@/lib/keyword-report';
import { cn } from '@/lib/utils';

type KeywordReportSummaryProps = {
  keyword: string;
  report: KeywordReport;
  premiumLocked?: boolean;
};

const toneStyles: Record<
  KeywordReportTone,
  { accent: string; card: string; text: string }
> = {
  destructive: {
    accent: 'bg-destructive text-white',
    card: 'border-destructive bg-destructive/10',
    text: 'text-destructive',
  },
  warning: {
    accent: 'bg-warning text-warning-foreground',
    card: 'border-warning bg-warning/10',
    text: 'text-warning-foreground',
  },
  success: {
    accent: 'bg-primary text-primary-foreground',
    card: 'border-primary bg-primary/10',
    text: 'text-primary',
  },
};

function SignalBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: KeywordReportTone;
}) {
  return (
    <Badge
      className={cn(
        'rounded-full px-2.5 py-1 text-xs normal-case tracking-normal',
        tone === 'success' && 'bg-primary/10 text-primary',
        tone === 'warning' && 'bg-warning/20 text-warning-foreground',
        tone === 'destructive' && 'bg-destructive/10 text-destructive',
      )}
    >
      {children}
    </Badge>
  );
}

export function KeywordReportSummary({
  keyword,
  report,
  premiumLocked = false,
}: KeywordReportSummaryProps) {
  const tone = getKeywordScoreTone(report.overallScore);
  const scoreStyle = toneStyles[tone];
  const circumference = 2 * Math.PI * 52;
  const scoreOffset =
    circumference - (report.overallScore / 100) * circumference;

  const metrics = [
    {
      label: 'Sources analysed',
      value: report.overview.citationsAnalyzed,
      signal:
        report.overview.citationsAnalyzed >= 30
          ? 'Strong'
          : report.overview.citationsAnalyzed >= 12
            ? 'Moderate'
            : 'Limited',
      tone:
        report.overview.citationsAnalyzed >= 30
          ? ('success' as const)
          : report.overview.citationsAnalyzed >= 12
            ? ('warning' as const)
            : ('destructive' as const),
      detail: 'Sources reviewed',
      icon: Link2Icon,
      items: report.topDomains.slice(0, 3).map((source) => source.domain),
    },
    {
      label: 'Unique domains',
      value: report.overview.uniqueDomains,
      signal: report.overview.uniqueDomains >= 16 ? 'Broad' : 'Varied',
      tone:
        report.overview.uniqueDomains >= 16
          ? ('success' as const)
          : ('warning' as const),
      detail: 'Across relevant sources',
      icon: Globe2Icon,
      items: report.sourceMix
        .slice(0, 3)
        .map((source) => `${source.count} ${source.type}`),
    },
    {
      label: 'Competitors found',
      value: report.overview.competitorsFound,
      signal: 'Moderate',
      tone: 'warning' as const,
      detail: 'Strong competing domains',
      icon: UsersRoundIcon,
      items: report.competitors
        .slice(0, 3)
        .map((competitor) => `${competitor.name} · ${competitor.share}%`),
    },
    {
      label: 'Prompt opportunities',
      value: report.overview.promptOpportunities,
      signal: 'Plenty',
      tone: 'success' as const,
      detail: 'Useful content gaps',
      icon: SparklesIcon,
      items: report.promptIdeas.slice(0, 3).map((idea) => idea.prompt),
    },
  ];

  return (
    <section className='flex flex-col gap-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-xs font-semibold text-primary uppercase'>
            AI keyword report
          </p>
          <h1 className='mt-1 text-3xl font-black tracking-tighter'>
            {keyword}
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            A clear view of topic demand, competitors, and content
            opportunities.
          </p>
        </div>
        <Button type='button' variant='outline' size='sm'>
          Send feedback
        </Button>
      </div>

      <Card
        size='sm'
        className={cn('border-2 shadow-sm ring-0', scoreStyle.card)}
      >
        <CardContent className='grid items-center gap-6 p-1 sm:p-2 pl-5! lg:grid-cols-[minmax(0,1fr)_13rem]'>
          <div className='max-w-2xl'>
            <span
              className={cn(
                'mb-4 flex size-10 items-center justify-center rounded-xl',
                scoreStyle.accent,
              )}
            >
              <SparklesIcon className='size-5' aria-hidden='true' />
            </span>
            <h2 className='text-2xl font-bold'>Overall SEO Score</h2>
            <p className='mt-2 max-w-2xl text-base leading-relaxed text-foreground/70'>
              {report.summary}
            </p>
            <div className='mt-5 flex flex-wrap gap-x-6 gap-y-2'>
              <span className='flex items-center gap-2 font-medium'>
                <CheckCircle2Icon className={cn('size-4', scoreStyle.text)} />
                {report.overview.citationsAnalyzed} sources reviewed
              </span>
              <span className='flex items-center gap-2 font-medium'>
                <CheckCircle2Icon className={cn('size-4', scoreStyle.text)} />
                {report.overview.uniqueDomains} domains validated
              </span>
            </div>
          </div>

          <div className='relative mx-auto size-44'>
            <svg
              viewBox='0 0 120 120'
              className='-rotate-90 size-full'
              aria-hidden='true'
            >
              <circle
                cx='60'
                cy='60'
                r='52'
                fill='none'
                stroke='currentColor'
                strokeWidth='10'
                className='text-background/70'
              />
              <circle
                cx='60'
                cy='60'
                r='52'
                fill='none'
                stroke='currentColor'
                strokeWidth='10'
                strokeLinecap='round'
                strokeDasharray={circumference}
                strokeDashoffset={scoreOffset}
                className={scoreStyle.text}
              />
            </svg>
            <div className='absolute inset-0 flex flex-col items-center justify-center'>
              <div className='flex items-baseline'>
                <span className='text-5xl font-black tabular-nums'>
                  {report.overallScore}
                </span>
                <span className='ml-1 font-semibold text-muted-foreground'>
                  /100
                </span>
              </div>
              <SignalBadge tone={tone}>
                {getKeywordScoreLabel(report.overallScore)}
              </SignalBadge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size='sm' className='gap-0'>
        <CardHeader className='border-b'>
          <CardTitle className='text-lg normal-case tracking-normal'>
            Report overview
          </CardTitle>
          <CardDescription>
            The strongest signals found across the research.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='grid sm:grid-cols-2 xl:grid-cols-4'>
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className='flex min-h-56 flex-col border-b p-5 sm:border-r sm:even:border-r-0 xl:border-b-0 xl:even:border-r xl:last:border-r-0'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <p className='font-semibold'>{metric.label}</p>
                    <span className='flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                      <Icon className='size-4' aria-hidden='true' />
                    </span>
                  </div>
                  <div className='mt-5 flex items-center gap-3'>
                    <span className='text-4xl font-black tabular-nums'>
                      {metric.value}
                    </span>
                    <SignalBadge tone={metric.tone}>
                      {metric.signal}
                    </SignalBadge>
                  </div>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {metric.detail}
                  </p>
                  <ul className='mt-5 flex flex-col gap-2 border-t pt-4'>
                    {metric.items.map((item) => (
                      <li
                        key={item}
                        className='flex min-w-0 items-center gap-2 text-sm text-muted-foreground'
                      >
                        <span className='size-1.5 shrink-0 rounded-full bg-primary' />
                        <span className='truncate'>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4 xl:grid-cols-[1.25fr_0.75fr]'>
        <Card size='sm' className='gap-0'>
          <CardHeader className='border-b'>
            <Globe2Icon className='size-5 text-primary' />
            <CardTitle className='text-lg normal-case tracking-normal'>
              Top sources
            </CardTitle>
            <CardDescription>
              Websites referenced most often in the research.
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='grid grid-cols-[minmax(0,1fr)_5rem_5rem] border-b px-5 py-2 text-xs font-semibold text-muted-foreground'>
              <span>Domain</span>
              <span className='text-right'>References</span>
              <span className='text-right'>Share</span>
            </div>
            {report.topDomains.map((source) => (
              <div
                key={source.domain}
                className='grid grid-cols-[minmax(0,1fr)_5rem_5rem] items-center border-b px-5 py-3 last:border-b-0'
              >
                <div className='min-w-0'>
                  <p className='truncate font-semibold'>{source.domain}</p>
                  <p className='text-xs text-muted-foreground'>{source.type}</p>
                </div>
                <span className='text-right font-semibold tabular-nums'>
                  {source.citations}
                </span>
                <span className='text-right text-muted-foreground tabular-nums'>
                  {source.share}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card size='sm' className='gap-0 border border-primary/40 bg-primary/5'>
          <CardHeader className='border-b border-primary/20'>
            <span className='flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground'>
              <BotIcon className='size-5' aria-hidden='true' />
            </span>
            <CardTitle className='text-lg normal-case tracking-normal'>
              AI summary
            </CardTitle>
            <CardDescription>What the research suggests.</CardDescription>
          </CardHeader>
          <FeatureLock
            locked={premiumLocked}
            title='Unlock AI summary'
            description='Upgrade to see the key findings and fastest opportunity from this research.'
            className='min-h-72 rounded-none border-0'
          >
            <CardContent className='flex flex-col gap-4 pt-5'>
              {report.evidenceSummary.map((insight) => (
                <div key={insight} className='flex items-start gap-3'>
                  <CheckCircle2Icon className='mt-0.5 size-4 shrink-0 text-primary' />
                  <p className='leading-relaxed'>{insight}</p>
                </div>
              ))}
            </CardContent>
          </FeatureLock>
        </Card>
      </div>

      <p className='flex items-center gap-2 text-xs text-muted-foreground'>
        <FileTextIcon className='size-3.5' aria-hidden='true' />
        This is a directional content score, not a Google ranking or
        search-volume metric.
      </p>
    </section>
  );
}
