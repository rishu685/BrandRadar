import { MessageSquareTextIcon, SearchIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { KeywordReport } from '@/lib/keyword-report';

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        <p className='text-xs font-semibold text-primary uppercase'>
          {eyebrow}
        </p>
        <h2 className='mt-1 text-2xl font-black tracking-tighter'>{title}</h2>
      </div>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </div>
  );
}

export function KeywordReportOpportunities({
  report,
}: {
  report: KeywordReport;
}) {
  return (
    <>
      <section className='flex min-w-0 flex-col gap-5'>
        <SectionHeading
          eyebrow='Answer demand'
          title='Prompts worth targeting'
          description='Questions people are likely to ask about this topic'
        />
        <Card size='sm' className='min-w-0 gap-0'>
          <CardHeader className='border-b'>
            <MessageSquareTextIcon className='size-5 text-primary' />
            <CardTitle className='text-lg normal-case tracking-normal'>
              AI prompt opportunities
            </CardTitle>
            <CardDescription>
              Useful questions that can become focused pages or content
              sections.
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='hidden grid-cols-[3rem_minmax(0,1.5fr)_minmax(18rem,0.8fr)_7rem] border-b px-5 py-3 font-semibold text-muted-foreground lg:grid'>
              <span>#</span>
              <span>Prompt</span>
              <span>Why it matters</span>
              <span className='text-right'>Opportunity</span>
            </div>
            {report.promptIdeas.map((item, index) => (
              <div
                key={item.prompt}
                className='grid gap-4 border-b px-5 py-5 last:border-b-0 lg:grid-cols-[3rem_minmax(0,1.5fr)_minmax(18rem,0.8fr)_7rem] lg:items-center'
              >
                <span className='flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 font-bold text-primary tabular-nums'>
                  {index + 1}
                </span>
                <p className='text-[15px] font-medium leading-relaxed'>
                  {item.prompt}
                </p>
                <p className='text-[15px] leading-relaxed text-foreground/70'>
                  {item.evidence}
                </p>
                <span className='font-semibold text-primary lg:text-right'>
                  {item.opportunity}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className='flex min-w-0 flex-col gap-5'>
        <SectionHeading
          eyebrow='Content vocabulary'
          title='Keyword opportunities'
          description='Related terms discovered across the research'
        />
        <Card size='sm' className='min-w-0 gap-0'>
          <CardHeader className='border-b'>
            <SearchIcon className='size-5 text-primary' />
            <CardTitle className='text-lg normal-case tracking-normal'>
              Related keyword ideas
            </CardTitle>
            <CardDescription>
              Use these terms as sections and supporting concepts for the topic.
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='hidden grid-cols-[minmax(12rem,1.1fr)_10rem_minmax(18rem,1fr)_6rem] border-b px-5 py-3 font-semibold text-muted-foreground lg:grid'>
              <span>Keyword</span>
              <span>Topic group</span>
              <span>Why it matters</span>
              <span className='text-right'>Relevance</span>
            </div>
            {report.contentKeywords.map((item) => (
              <div
                key={item.keyword}
                className='grid gap-4 border-b px-5 py-5 last:border-b-0 lg:grid-cols-[minmax(12rem,1.1fr)_10rem_minmax(18rem,1fr)_6rem] lg:items-center'
              >
                <p className='truncate text-base font-semibold'>
                  {item.keyword}
                </p>
                <span className='text-[15px] text-foreground/70'>
                  {item.cluster}
                </span>
                <span className='text-[15px] leading-relaxed text-foreground/70'>
                  {item.evidence}
                </span>
                <span className='font-semibold text-primary lg:text-right tabular-nums'>
                  {item.relevance}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
