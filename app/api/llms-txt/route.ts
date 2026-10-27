import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const validateInputSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: Request) {

  const body = await request.json().catch(() => null);
  const input = validateInputSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json({ message: 'Enter a valid URL' }, { status: 400 });
  }

  const parsedUrl = new URL(input.data.url);
  const targetLlmsUrl = `${parsedUrl.origin}/llms.txt`;

  let content = '';
  let found = false;
  let statusCode = 404;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(targetLlmsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandRadarBot/1.0; +https://brandradar.dev)',
      },
    });
    clearTimeout(timeout);
    statusCode = res.status;

    if (res.ok) {
      content = await res.text();
      found = true;
    }
  } catch {
    statusCode = 500;
  }

  // Validate format
  const hasH1 = content.includes('# ');
  const hasBlockquote = content.includes('> ');
  const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const estimatedTokens = Math.round(wordCount * 1.3);

  const passedChecks = [];
  const warnings = [];

  if (found) {
    passedChecks.push('File reachable at /llms.txt');
    if (hasH1) passedChecks.push('Contains main project H1 heading');
    else warnings.push('Missing top-level H1 project title (# Brand)');

    if (hasBlockquote) passedChecks.push('Contains concise elevator summary blockquote (> Summary)');
    else warnings.push('Recommended to include a blockquote summary (> ...) for AI snippets');

    if (linkCount >= 3) passedChecks.push(`Contains ${linkCount} structured markdown links`);
    else warnings.push('Add more key documentation and guide links');
  } else {
    warnings.push(`No /llms.txt found at ${targetLlmsUrl} (HTTP ${statusCode})`);
  }

  return NextResponse.json({
    targetLlmsUrl,
    found,
    statusCode,
    hasH1,
    hasBlockquote,
    linkCount,
    wordCount,
    estimatedTokens,
    passedChecks,
    warnings,
    rawContent: content,
  });
}
