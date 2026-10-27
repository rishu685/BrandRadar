import { SparklesIcon, ShieldCheckIcon, CpuIcon, CheckCircle2Icon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function BillingPage() {
  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-7 sm:px-8'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Project & Edition Status</h1>
          <Badge variant='default' className='bg-primary/10 text-primary border-primary/20'>
            100% Free & Open Source
          </Badge>
        </div>
        <p className='text-muted-foreground'>
          BrandRadar is built for developers and growth engineers. All features, scans, and competitor matrices are permanently free and unlocked.
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card className='rounded-2xl border shadow-none'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-xl normal-case tracking-tight flex items-center gap-2'>
                <ShieldCheckIcon className='size-5 text-primary' />
                Community Edition
              </CardTitle>
              <Badge variant='outline' className='border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400'>
                Active · Unlimited
              </Badge>
            </div>
            <CardDescription>
              Full access to all generative engine and keyword intelligence features.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <ul className='space-y-2.5 text-sm'>
              <li className='flex items-center gap-2'>
                <CheckCircle2Icon className='size-4 text-emerald-500 shrink-0' />
                <span><strong>Unlimited</strong> AI Keyword Research & SERP analysis</span>
              </li>
              <li className='flex items-center gap-2'>
                <CheckCircle2Icon className='size-4 text-emerald-500 shrink-0' />
                <span><strong>Unlimited</strong> AI Search Visibility scans across AI platforms</span>
              </li>
              <li className='flex items-center gap-2'>
                <CheckCircle2Icon className='size-4 text-emerald-500 shrink-0' />
                <span><strong>Full Unlocked Insights</strong>: Competitor share of voice & citation matrix</span>
              </li>
              <li className='flex items-center gap-2'>
                <CheckCircle2Icon className='size-4 text-emerald-500 shrink-0' />
                <span><strong>Zero Paywalls</strong>: No subscriptions, Stripe, or billing required</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className='rounded-2xl border shadow-none'>
          <CardHeader>
            <CardTitle className='text-xl normal-case tracking-tight flex items-center gap-2'>
              <CpuIcon className='size-5 text-primary' />
              Engine Configuration
            </CardTitle>
            <CardDescription>
              Environment and model connectivity status
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4 text-sm'>
            <div className='rounded-lg border bg-muted/40 p-4 space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='font-medium'>AI Provider</span>
                <span className='font-mono text-xs bg-background px-2 py-1 rounded border'>Google Gemini (Free Tier)</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='font-medium'>Payment Gateway</span>
                <span className='text-xs text-emerald-600 dark:text-emerald-400 font-medium'>Disabled (Free Open Source)</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='font-medium'>License</span>
                <span className='font-mono text-xs bg-background px-2 py-1 rounded border'>MIT Open Source</span>
              </div>
            </div>
            <p className='text-xs text-muted-foreground'>
              You can configure your free Google Gemini API key in your local <code>.env</code> file. No credit card or paid billing account is required.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
