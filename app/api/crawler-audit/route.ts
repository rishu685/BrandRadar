import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const auditInputSchema = z.object({
  url: z.string().url(),
});

export type BotRule = {
  name: string;
  botUserAgent: string;
  company: string;
  engine: string;
  status: 'Allowed' | 'Blocked' | 'Default (Allowed)';
  recommendation: string;
};

const knownAiBots = [
  {
    name: 'ChatGPT Search & Ingestion',
    botUserAgent: 'GPTBot',
    company: 'OpenAI',
    engine: 'ChatGPT, SearchGPT',
  },
  {
    name: 'Claude Search & Training',
    botUserAgent: 'ClaudeBot',
    company: 'Anthropic',
    engine: 'Claude 3.7 / 3.5 Sonnet',
  },
  {
    name: 'Perplexity AI Search',
    botUserAgent: 'PerplexityBot',
    company: 'Perplexity AI',
    engine: 'Perplexity Answer Engine',
  },
  {
    name: 'Google Gemini & AI Overviews',
    botUserAgent: 'Google-Extended',
    company: 'Google',
    engine: 'Google AI Overviews & Gemini',
  },
  {
    name: 'Apple Intelligence',
    botUserAgent: 'Applebot-Extended',
    company: 'Apple',
    engine: 'Siri & Apple Intelligence',
  },
  {
    name: 'Meta AI Crawler',
    botUserAgent: 'Meta-ExternalAgent',
    company: 'Meta',
    engine: 'Meta AI / Llama Search',
  },
];

export async function POST(request: Request) {

  const body = await request.json().catch(() => null);
  const input = auditInputSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json({ message: 'Enter a valid URL' }, { status: 400 });
  }

  const parsedUrl = new URL(input.data.url);
  const robotsUrl = `${parsedUrl.origin}/robots.txt`;

  let robotsContent = '';
  let fetchedSuccessfully = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandRadarBot/1.0; +https://brandradar.dev)',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      robotsContent = await res.text();
      fetchedSuccessfully = true;
    }
  } catch {
    // If external fetch fails, analyze default rules
    robotsContent = `# Default or unreachable robots.txt for ${parsedUrl.hostname}\nUser-agent: *\nAllow: /`;
  }

  const normalized = robotsContent.toLowerCase();

  const auditResults: BotRule[] = knownAiBots.map((bot) => {
    const ua = bot.botUserAgent.toLowerCase();
    let status: BotRule['status'] = 'Default (Allowed)';
    let recommendation = 'Permissions optimal for generative engine citations.';

    // Check specific user-agent blocks
    if (normalized.includes(`user-agent: ${ua}`)) {
      const blockIndex = normalized.indexOf(`user-agent: ${ua}`);
      const slice = normalized.slice(blockIndex, blockIndex + 300);
      if (slice.includes('disallow: /')) {
        status = 'Blocked';
        recommendation = `CRITICAL: ${bot.engine} cannot crawl your content. Remove 'Disallow: /' to restore citations.`;
      } else {
        status = 'Allowed';
        recommendation = `Explicitly allowed for ${bot.engine}. Excellent for AEO.`;
      }
    } else if (normalized.includes('user-agent: *') && normalized.includes('disallow: /')) {
      const allIndex = normalized.indexOf('user-agent: *');
      const allSlice = normalized.slice(allIndex, allIndex + 200);
      if (allSlice.includes('disallow: /')) {
        status = 'Blocked';
        recommendation = `Global wildcard 'Disallow: /' is blocking ${bot.engine}.`;
      }
    }

    return {
      name: bot.name,
      botUserAgent: bot.botUserAgent,
      company: bot.company,
      engine: bot.engine,
      status,
      recommendation,
    };
  });

  const blockedCount = auditResults.filter((r) => r.status === 'Blocked').length;
  const overallAeoHealth =
    blockedCount === 0 ? 'Optimal (100%)' : blockedCount <= 2 ? 'At Risk (65%)' : 'Severely Impaired (20%)';

  const recommendedRobotsTxt = `# Recommended robots.txt for Generative Engine Optimization (BrandRadar)
User-agent: *
Allow: /

# Allow AI Answer Engines to cite and reference documentation
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

# Link your machine-readable LLM context
# llms.txt: ${parsedUrl.origin}/llms.txt
Sitemap: ${parsedUrl.origin}/sitemap.xml`;

  return NextResponse.json({
    targetUrl: input.data.url,
    robotsUrl,
    fetchedSuccessfully,
    overallAeoHealth,
    blockedCount,
    totalAudited: knownAiBots.length,
    results: auditResults,
    rawRobotsTxt: robotsContent,
    recommendedRobotsTxt,
  });
}
