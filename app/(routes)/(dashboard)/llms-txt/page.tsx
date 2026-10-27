'use client';
import { useState } from 'react';
import {
  FileCodeIcon,
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  SearchIcon,
  SparklesIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  FileTextIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

type ValidationResult = {
  targetLlmsUrl: string;
  found: boolean;
  statusCode: number;
  hasH1: boolean;
  hasBlockquote: boolean;
  linkCount: number;
  wordCount: number;
  estimatedTokens: number;
  passedChecks: string[];
  warnings: string[];
  rawContent: string;
};

export default function LlmsTxtPage() {
  // Builder state
  const [brandName, setBrandName] = useState('BrandRadar');
  const [websiteUrl, setWebsiteUrl] = useState('https://brandradar.dev');
  const [summary, setSummary] = useState(
    'The open-source Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) platform for tracking brand citations in AI search.',
  );
  const [docsLink, setDocsLink] = useState('https://brandradar.dev/docs');
  const [copied, setCopied] = useState(false);

  // Validator state
  const [validateUrl, setValidateUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Computed llms.txt content
  const generatedLlmsTxt = `# ${brandName}

> ${summary}

${brandName} is designed for developers, growth teams, and marketers to monitor and optimize how generative AI engines (ChatGPT, Google Gemini, Perplexity) perceive, rank, and cite their products.

## Documentation
- [Quickstart Guide](${docsLink}/quickstart): Getting started in under 5 minutes
- [AEO Optimization Playbook](${docsLink}/aeo-playbook): Proven patterns for AI citations
- [API Reference](${docsLink}/api): Complete programmatic endpoints

## Key Capabilities
- [Search Visibility Audit](${websiteUrl}/ai-search-visibility): Measure brand share of voice in ChatGPT and Gemini
- [AI Keyword Research](${websiteUrl}/ai-keyword): Cluster analysis and prompt opportunity finder
- [Robots.txt AI Auditor](${websiteUrl}/crawler-audit): Audit crawler permissions for GPTBot, ClaudeBot, and PerplexityBot

## Optional / Extended Context
- [Full Documentation](${websiteUrl}/llms-full.txt): Complete concatenated technical guides for LLM ingestion
`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedLlmsTxt);
    setCopied(true);
    toast.success('Copied llms.txt to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const blob = new Blob([generatedLlmsTxt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'llms.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded llms.txt');
  };

  const handleValidate = async () => {
    if (!validateUrl.trim()) return;
    let url = validateUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    setValidateUrl(url);
    setIsValidating(true);

    try {
      const res = await fetch('/api/llms-txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as ValidationResult;
      setValidationResult(data);
      if (data.found) {
        toast.success(`Found /llms.txt on ${new URL(url).hostname}`);
      } else {
        toast.error(`No /llms.txt found (HTTP ${data.statusCode})`);
      }
    } catch {
      toast.error('Validation failed. Please check the URL.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 py-4'>
      {/* Page Title */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          <h1 className='text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
            /llms.txt Generator & Validator
          </h1>
          <Badge variant='outline' className='border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'>
            GEO Standard
          </Badge>
        </div>
        <p className='text-sm leading-relaxed text-neutral-600 dark:text-neutral-400'>
          The emerging web standard to help AI search engines, Cursor, and Perplexity index your product. Generate your markdown file or validate your live deployment.
        </p>
      </div>

      <Tabs defaultValue='builder' className='w-full'>
        <TabsList className='h-11 rounded-lg bg-neutral-200/60 p-1 dark:bg-neutral-800/60'>
          <TabsTrigger value='builder' className='rounded-md px-5 text-sm font-medium'>
            <FileCodeIcon className='mr-2 size-4' /> Interactive Builder
          </TabsTrigger>
          <TabsTrigger value='validator' className='rounded-md px-5 text-sm font-medium'>
            <SparklesIcon className='mr-2 size-4' /> Live URL Validator
          </TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value='builder' className='mt-6 space-y-6'>
          <div className='grid gap-6 lg:grid-cols-2'>
            {/* Form Inputs */}
            <Card className='rounded-2xl border shadow-none'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg font-semibold'>Project Configuration</CardTitle>
                <CardDescription className='text-xs'>
                  Customize your brand facts so LLMs quote accurate details
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 text-sm'>
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Brand / Project Name
                  </label>
                  <input
                    type='text'
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className='w-full rounded-lg border border-neutral-200 bg-background px-3 py-2 text-sm focus:border-neutral-800 focus:outline-none dark:border-neutral-800'
                  />
                </div>

                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Main Website URL
                  </label>
                  <input
                    type='url'
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className='w-full rounded-lg border border-neutral-200 bg-background px-3 py-2 text-sm focus:border-neutral-800 focus:outline-none dark:border-neutral-800'
                  />
                </div>

                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Documentation / Guides Root URL
                  </label>
                  <input
                    type='url'
                    value={docsLink}
                    onChange={(e) => setDocsLink(e.target.value)}
                    className='w-full rounded-lg border border-neutral-200 bg-background px-3 py-2 text-sm focus:border-neutral-800 focus:outline-none dark:border-neutral-800'
                  />
                </div>

                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Elevator Summary (Blockquote)
                  </label>
                  <textarea
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className='w-full rounded-lg border border-neutral-200 bg-background px-3 py-2 text-sm focus:border-neutral-800 focus:outline-none dark:border-neutral-800'
                  />
                  <p className='text-[11px] text-neutral-500'>
                    Keep under 200 characters so answer engines use it as a primary description.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Generated Code Preview */}
            <Card className='rounded-2xl border shadow-none flex flex-col justify-between'>
              <CardHeader className='flex flex-row items-center justify-between border-b pb-3'>
                <div className='space-y-0.5'>
                  <CardTitle className='text-base font-semibold flex items-center gap-2'>
                    <FileTextIcon className='size-4 text-primary' />
                    Preview: /llms.txt
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    ~240 tokens · Optimal for LLM context windows
                  </CardDescription>
                </div>

                <div className='flex items-center gap-2'>
                  <Button size='sm' variant='outline' onClick={copyToClipboard} className='h-8 text-xs'>
                    {copied ? <CheckIcon className='size-3 text-emerald-600 mr-1' /> : <CopyIcon className='size-3 mr-1' />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button size='sm' onClick={downloadFile} className='h-8 text-xs bg-neutral-800 text-white hover:bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900'>
                    <DownloadIcon className='size-3 mr-1' /> Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='p-4 flex-1'>
                <pre className='h-84 overflow-y-auto rounded-lg bg-neutral-900 p-4 font-mono text-xs text-neutral-200 leading-relaxed dark:bg-neutral-950'>
                  {generatedLlmsTxt}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Validator Tab */}
        <TabsContent value='validator' className='mt-6 space-y-6'>
          <Card className='rounded-2xl border shadow-none'>
            <CardContent className='p-4 sm:p-5'>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleValidate();
                }}
                className='flex flex-col gap-3 sm:flex-row'
              >
                <InputGroup className='h-11 flex-1 rounded-lg border border-neutral-200 bg-background px-3 shadow-xs dark:border-neutral-800'>
                  <InputGroupAddon>
                    <SearchIcon className='size-4 text-neutral-400' />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder='Enter domain to validate (e.g. https://docs.anthropic.com)'
                    value={validateUrl}
                    onChange={(e) => setValidateUrl(e.target.value)}
                    disabled={isValidating}
                  />
                </InputGroup>

                <Button
                  type='submit'
                  disabled={isValidating || !validateUrl.trim()}
                  className='h-11 bg-neutral-800 px-6 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
                >
                  <FileCodeIcon className='mr-2 size-4' />
                  {isValidating ? 'Validating…' : 'Validate /llms.txt'}
                </Button>
              </form>

              {/* Sample Buttons */}
              <div className='mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500'>
                <span className='font-medium'>Test with live implementations:</span>
                {['https://docs.anthropic.com', 'https://mintlify.com'].map((u) => (
                  <button
                    key={u}
                    type='button'
                    onClick={() => {
                      setValidateUrl(u);
                      void handleValidate();
                    }}
                    className='rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                  >
                    {new URL(u).hostname}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Validation Report */}
          {validationResult && (
            <div className='flex flex-col gap-5 animate-in fade-in duration-300'>
              <div className='grid gap-4 sm:grid-cols-3'>
                <Card className='rounded-xl border shadow-none'>
                  <CardHeader className='pb-2'>
                    <CardDescription className='text-xs'>HTTP Reachability</CardDescription>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      {validationResult.found ? (
                        <CheckCircle2Icon className='size-5 text-emerald-500' />
                      ) : (
                        <AlertTriangleIcon className='size-5 text-amber-500' />
                      )}
                      {validationResult.found ? '200 OK (Found)' : `${validationResult.statusCode} Not Found`}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card className='rounded-xl border shadow-none'>
                  <CardHeader className='pb-2'>
                    <CardDescription className='text-xs'>Structured Links</CardDescription>
                    <CardTitle className='text-lg'>
                      {validationResult.linkCount} <span className='text-sm font-normal text-neutral-500'>references</span>
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card className='rounded-xl border shadow-none'>
                  <CardHeader className='pb-2'>
                    <CardDescription className='text-xs'>Token Density</CardDescription>
                    <CardTitle className='text-lg'>
                      ~{validationResult.estimatedTokens} <span className='text-sm font-normal text-neutral-500'>est. tokens</span>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Checks Passed / Warnings */}
              <Card className='rounded-2xl border shadow-none p-5 space-y-4'>
                <h3 className='font-semibold text-sm'>AEO Validation Checks</h3>
                <div className='space-y-2'>
                  {validationResult.passedChecks.map((check) => (
                    <div key={check} className='flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300'>
                      <CheckCircle2Icon className='size-4 text-emerald-500 shrink-0' />
                      <span>{check}</span>
                    </div>
                  ))}
                  {validationResult.warnings.map((warn) => (
                    <div key={warn} className='flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300'>
                      <AlertTriangleIcon className='size-4 text-amber-500 shrink-0' />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
