import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const keywordBenefits = [
  {
    title: 'Research AI prompts and responses',
    description:
      'AI searches are growing fast. Stay relevant by seeing what your audience is asking.',
    image: '/assets/ai-banner.png',
    imageAlt: 'AI prompts, brand mentions, and response insights preview',
    background: 'bg-primary/5',
  },
  {
    title: 'Find secret SEO gems',
    description:
      'Discover related searches, audience questions, ranking pages, and content gaps from live search results.',
    image: '/assets/search-insights-banner.png',
    imageAlt: 'Search opportunities and related keyword preview',
    background: 'bg-secondary',
  },
  {
    title: 'Optimize for search intent',
    description:
      'Focus on useful topics that match informational, commercial, transactional, and navigational intent.',
    image: '/assets/search-intent-banner.png',
    imageAlt:
      'Informational, commercial, transactional, and navigational intent',
    background: 'bg-muted',
  },
  {
    title: 'Master local search',
    description:
      'Research location-based searches to reach the right audience and attract more customers.',
    image: '/assets/dropdown-banner.png',
    imageAlt: 'Local keyword location selection preview',
    background: 'bg-accent',
  },
];

export function KeywordLandingState() {
  return (
    <section className='space-y-4 pb-10'>
      <h1 className='text-2xl font-semibold tracking-tight'>
        AI-powered keyword research
      </h1>

      <div className='grid gap-5 lg:grid-cols-2'>
        {keywordBenefits.map((benefit) => (
          <Card
            key={benefit.title}
            className='min-h-100 gap-3 border py-7 shadow-none ring-0 [--card-spacing:--spacing(6)]'
          >
            <CardHeader>
              <CardTitle className='text-2xl font-semibold tracking-tight normal-case'>
                {benefit.title}
              </CardTitle>
              <CardDescription className='max-w-xl text-base'>
                {benefit.description}
              </CardDescription>
            </CardHeader>

            <CardContent className='flex flex-1'>
              <div className='relative flex min-h-64 w-full items-center justify-center overflow-hidden'>
                <div
                  className={cn(
                    'absolute size-64 rounded-full sm:size-72',
                    benefit.background,
                  )}
                  aria-hidden='true'
                />
                <Image
                  src={benefit.image}
                  alt={benefit.imageAlt}
                  width={564}
                  height={322}
                  sizes='(min-width: 1024px) 40vw, 80vw'
                  className='relative z-10 h-56 w-[78%] object-contain'
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
