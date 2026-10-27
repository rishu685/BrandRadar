'use client';
import { useState } from 'react';
import {
  BotIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  SparklesIcon,
  TerminalIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import type { BotRule } from '@/app/api/crawler-audit/route';

type AuditData = {
  targetUrl: string;
  robotsUrl: string;
  fetchedSuccessfully: boolean;
  overallAeoHealth: string;
  blockedCount: number;
  totalAudited: number;
  results: BotRule[];
  rawRobotsTxt: string;
  recommendedRobotsTxt: string;
};

const presets = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Supabase', url: 'https://supabase.com' },
  { name: 'Vercel', url: 'https://vercel.com' },
  { name: 'Linear', url: 'https://linear.app' },
];

export default function CrawlerAuditPage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleAudit(targetUrl?: string) {
    const checkUrl = targetUrl ?? url;
    if (!checkUrl.trim()) return;

    let formattedUrl = checkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setUrl(formattedUrl);
    setIsLoading(true);

    try {
      const response = await fetch('/api/crawler-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl }),
      });

      if (!response.ok) {
        throw new Error('Audit failed. Please ensure the URL is valid.');
      }

      const data = (await response.json()) as AuditData;
      setAuditData(data);
      toast.success(`Audited ${new URL(formattedUrl).hostname}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to audit URL');
    } finally {
      setIsLoading(false);
    }
  }

  const copyRecommended = async () => {
    if (!auditData?.recommendedRobotsTxt) return;
    await navigator.clipboard.writeText(auditData.recommendedRobotsTxt);
    setCopied(true);
    toast.success('Copied recommended robots.txt');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 py-4'>
      {/* Header */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          <h1 className='text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
            AI Crawler & Robots.txt Auditor
          </h1>
          <Badge variant='outline' className='border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'>
            AEO Protection
          </Badge>
        </div>
        <p className='text-sm leading-relaxed text-neutral-600 dark:text-neutral-400'>
          Verify if ChatGPT, Claude, Perplexity, and Gemini are allowed to crawl and cite your website, or if your <code>robots.txt</code> is accidentally blocking generative engine discovery.
        </p>
      </div>

      {/* Input Row */}
      <Card className='rounded-2xl border shadow-none'>
        <CardContent className='p-4 sm:p-5'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleAudit();
            }}
            className='flex flex-col gap-3 sm:flex-row'
          >
            <InputGroup className='h-11 flex-1 rounded-lg border border-neutral-200 bg-background px-3 shadow-xs dark:border-neutral-800'>
              <InputGroupAddon>
                <SearchIcon className='size-4 text-neutral-400' />
              </InputGroupAddon>
              <InputGroupInput
                placeholder='Enter website URL (e.g. https://supabase.com)'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
            </InputGroup>

            <Button
              type='submit'
              disabled={isLoading || !url.trim()}
              className='h-11 bg-neutral-800 px-6 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
            >
              <BotIcon className='mr-2 size-4' />
              {isLoading ? 'Auditing Bot Rules…' : 'Audit AI Crawlers'}
            </Button>
          </form>

          {/* Quick Presets */}
          <div className='mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500'>
            <span className='font-medium'>Test with presets:</span>
            {presets.map((preset) => (
              <button
                key={preset.name}
                type='button'
                onClick={() => {
                  setUrl(preset.url);
                  void handleAudit(preset.url);
                }}
                className='rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
              >
                {preset.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Results */}
      {auditData && (
        <div className='flex flex-col gap-6 animate-in fade-in duration-300'>
          {/* Summary Banner */}
          <div className='grid gap-4 sm:grid-cols-3'>
            <Card className='rounded-xl border shadow-none'>
              <CardHeader className='pb-2'>
                <CardDescription className='text-xs'>AEO Health Status</CardDescription>
                <CardTitle className='text-xl flex items-center gap-2'>
                  {auditData.blockedCount === 0 ? (
                    <ShieldCheckIcon className='size-5 text-emerald-500' />
                  ) : (
                    <ShieldAlertIcon className='size-5 text-amber-500' />
                  )}
                  {auditData.overallAeoHealth}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className='rounded-xl border shadow-none'>
              <CardHeader className='pb-2'>
                <CardDescription className='text-xs'>Blocked AI Engines</CardDescription>
                <CardTitle className='text-xl'>
                  {auditData.blockedCount} <span className='text-sm font-normal text-neutral-500'>of {auditData.totalAudited} bots</span>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className='rounded-xl border shadow-none'>
              <CardHeader className='pb-2'>
                <CardDescription className='text-xs'>Checked robots.txt</CardDescription>
                <CardTitle className='text-sm font-mono truncate text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5'>
                  <a href={auditData.robotsUrl} target='_blank' rel='noopener noreferrer' className='hover:underline flex items-center gap-1'>
                    {new URL(auditData.robotsUrl).pathname}
                    <ExternalLinkIcon className='size-3 text-neutral-400' />
                  </a>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Crawler Breakdown Table */}
          <Card className='rounded-2xl border shadow-none overflow-hidden'>
            <CardHeader className='border-b bg-neutral-50/50 py-4 dark:bg-neutral-900/40'>
              <CardTitle className='text-base font-semibold'>AI Search Engine Permissions</CardTitle>
              <CardDescription className='text-xs'>
                Status of verified crawlers representing major generative engines
              </CardDescription>
            </CardHeader>
            <div className='divide-y divide-neutral-200 dark:divide-neutral-800'>
              {auditData.results.map((bot) => (
                <div key={bot.botUserAgent} className='flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold text-neutral-900 dark:text-neutral-100 text-sm'>
                        {bot.name}
                      </span>
                      <span className='font-mono text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded'>
                        {bot.botUserAgent}
                      </span>
                    </div>
                    <p className='text-xs text-neutral-500'>
                      Powers <strong>{bot.engine}</strong> ({bot.company})
                    </p>
                    <p className='text-xs text-neutral-600 dark:text-neutral-400'>
                      {bot.recommendation}
                    </p>
                  </div>

                  <div className='shrink-0'>
                    {bot.status === 'Blocked' ? (
                      <Badge variant='destructive' className='font-medium text-xs'>
                        Blocked ✕
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium text-xs'>
                        Allowed ✓
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommended AEO robots.txt Snippet */}
          <Card className='rounded-2xl border shadow-none'>
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <div className='space-y-0.5'>
                <CardTitle className='text-base font-semibold flex items-center gap-2'>
                  <TerminalIcon className='size-4 text-primary' />
                  Recommended AEO-Optimized robots.txt
                </CardTitle>
                <CardDescription className='text-xs'>
                  Copy this snippet into your public <code>robots.txt</code> to maximize citation density and indexability
                </CardDescription>
              </div>

              <Button
                size='sm'
                variant='outline'
                onClick={copyRecommended}
                className='h-8 text-xs'
              >
                {copied ? (
                  <>
                    <CheckIcon className='mr-1.5 size-3.5 text-emerald-600' /> Copied
                  </>
                ) : (
                  <>
                    <CopyIcon className='mr-1.5 size-3.5' /> Copy snippet
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <pre className='overflow-x-auto rounded-lg bg-neutral-900 p-4 font-mono text-xs text-neutral-200 leading-relaxed dark:bg-neutral-950'>
                {auditData.recommendedRobotsTxt}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
