'use client';
import Link from 'next/link';
import { CheckIcon, SparklesIcon, StarIcon, ShieldCheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { BillingPlan } from '@/lib/plans';
import { cn } from '@/lib/utils';

type PricingSectionProps = {
  context?: 'public' | 'billing';
  currentPlan?: BillingPlan;
  currentSubscriptionId?: string;
};

const freeFeatures = [
  'Unlimited AI keyword research & analysis',
  'Unlimited AI search visibility audits',
  'Multi-platform coverage (ChatGPT, Gemini, Perplexity)',
  'Full competitor share-of-voice breakdown',
  'Evidence gap & prompt opportunity detection',
  'Complete citation & reference analysis',
  'No credit card or paywalls, forever',
  'Self-hostable & open source under MIT',
];

export function PricingSection({
  context = 'public',
}: PricingSectionProps) {
  return (
    <section className='flex flex-col gap-8'>
      <div className='mx-auto flex max-w-3xl flex-col items-center gap-3 text-center'>
        <p className='flex items-center gap-2 text-sm font-semibold text-primary'>
          <SparklesIcon className='size-4' aria-hidden='true' />
          100% Free & Open Source
        </p>
        <h1 className='text-4xl font-black tracking-tighter sm:text-5xl'>
          Generative Engine Optimization for Everyone
        </h1>
        <p className='max-w-2xl text-base leading-relaxed text-muted-foreground'>
          No hidden fees, no subscription tiers, and no credit card required.
          BrandRadar is completely open source and community-powered.
        </p>
      </div>

      <div className='mx-auto w-full max-w-2xl'>
        <Card className='rounded-2xl border-2 border-primary shadow-lg ring-1 ring-primary/20'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-3xl font-black tracking-tight'>
                  Community Edition
                </CardTitle>
                <CardDescription className='mt-1 text-base'>
                  Full, unrestricted access to the complete BrandRadar engine.
                </CardDescription>
              </div>
              <CardAction className='rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider'>
                Free Forever
              </CardAction>
            </div>
          </CardHeader>

          <CardContent className='flex flex-col gap-6'>
            <div className='flex items-baseline gap-2 border-b pb-4'>
              <span className='text-5xl font-black tracking-tighter'>$0</span>
              <span className='text-muted-foreground font-medium'>/month forever</span>
            </div>

            <div className='space-y-3'>
              <p className='text-sm font-semibold text-foreground'>Included with BrandRadar:</p>
              <ul className='grid gap-3 sm:grid-cols-2'>
                {freeFeatures.map((feature) => (
                  <li
                    key={feature}
                    className='flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground'
                  >
                    <CheckIcon
                      className='mt-0.5 size-4 shrink-0 text-emerald-500'
                      aria-hidden='true'
                    />
                    <span className='text-foreground'>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>

          <CardFooter className='flex flex-col sm:flex-row gap-3 pt-2'>
            {context === 'public' ? (
              <Button
                size='lg'
                className='w-full border-0 bg-linear-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90'
                nativeButton={false}
                render={<Link href='/auth/sign-up' />}
              >
                Get Started for Free
              </Button>
            ) : (
              <Button
                size='lg'
                className='w-full'
                nativeButton={false}
                render={<Link href='/ai-keyword' />}
              >
                Launch Research Dashboard
              </Button>
            )}
            <Button
              size='lg'
              variant='outline'
              className='w-full sm:w-auto shrink-0'
              render={
                <a
                  href='https://github.com/rishu685/BrandRadar'
                  target='_blank'
                  rel='noopener noreferrer'
                />
              }
              nativeButton={false}
            >
              <StarIcon className='mr-2 size-4 text-amber-400 fill-amber-400' />
              Star on GitHub
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}

export function ManageBillingButton() {
  return (
    <Button
      type='button'
      variant='outline'
      nativeButton={false}
      render={<Link href='/billing' />}
    >
      <ShieldCheckIcon className='mr-2 size-4 text-emerald-500' />
      Open Source Edition
    </Button>
  );
}
