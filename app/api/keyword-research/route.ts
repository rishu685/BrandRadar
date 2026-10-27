import { z } from 'zod';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { tasks } from '@trigger.dev/sdk';
import { getEffectiveUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ReportStatus } from '@/generated/prisma/client';
import type { keywordResearchTask } from '@/trigger/keyword-research';
import { checkUsageLimit } from '@/lib/billing';
import { runDirectKeywordScan } from '@/lib/engine/direct-scanner';

const keywordResearchInputSchema = z.object({
  keyword: z.string().trim().min(2).max(120),
  country: z
    .string()
    .trim()
    .transform((country) => country.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{2}$/)),
});

export async function POST(request: Request) {
  const user = await getEffectiveUser();

  const requestBody = await request.json().catch(() => null);
  const input = keywordResearchInputSchema.safeParse(requestBody);

  if (!input.success) {
    return NextResponse.json(
      {
        message: 'Enter a valid keyword and two-letter country code',
        errors: z.flattenError(input.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  await checkUsageLimit(user.id, 'keywordSearches');

  const report = await prisma.report.create({
    data: {
      userId: user.id,
      type: 'KEYWORD',
      status: ReportStatus.PENDING,
      progress: 5,
      currentStep: 'Preparing keyword search',
      keyword: input.data.keyword,
      country: input.data.country,
    },
    select: {
      id: true,
      status: true,
      progress: true,
      currentStep: true,
    },
  });

  const canUseTrigger = Boolean(
    process.env.TRIGGER_SECRET_KEY && process.env.BRIGHT_DATA_API_TOKEN,
  );

  if (canUseTrigger) {
    try {
      const handle = await tasks.trigger<typeof keywordResearchTask>(
        'keyword-research',
        {
          jobId: report.id,
          keyword: input.data.keyword,
          country: input.data.country,
        },
        {
          tags: [`report:${report.id}`, `user:${user.id}`],
        },
      );

      await prisma.report.update({
        where: { id: report.id },
        data: { triggerRunId: handle.id },
        select: { id: true },
      });

      return NextResponse.json(
        {
          jobId: report.id,
          runId: handle.id,
          publicAccessToken: handle.publicAccessToken,
          report: {
            status: report.status,
            progress: report.progress,
            currentStep: report.currentStep ?? 'Preparing keyword search',
          },
        },
        { status: 202 },
      );
    } catch (triggerError) {
      console.warn('Trigger.dev cloud dispatch bypassed, using Direct Scanner:', triggerError);
    }
  }

  // Direct scanner (Free Gemini API / Zero-key demo mode)
  void runDirectKeywordScan(report.id, input.data.keyword, input.data.country);

  return NextResponse.json(
    {
      jobId: report.id,
      runId: report.id,
      publicAccessToken: '',
      report: {
        status: report.status,
        progress: report.progress,
        currentStep: report.currentStep ?? 'Preparing keyword search',
      },
    },
    { status: 202 },
  );
}
