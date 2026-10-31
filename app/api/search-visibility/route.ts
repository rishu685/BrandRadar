import { z } from 'zod';
import { tasks } from '@trigger.dev/sdk';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ReportStatus } from '@/generated/prisma/client';
import { visibilitySearchSchema } from '@/lib/search-visibility-schema';
import type { searchVisibilityTask } from '@/trigger/search-visibility';
import { checkUsageLimit } from '@/lib/billing';
import { runDirectVisibilityScan } from '@/lib/engine/direct-scanner';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const requestBody = await request.json().catch(() => null);
  const input = visibilitySearchSchema.safeParse(requestBody);
  if (!input.success) {
    return NextResponse.json(
      {
        message: 'Enter a valid website, brand, and topic',
        errors: z.flattenError(input.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  await checkUsageLimit(user.id, 'visibilityScans');

  const report = await prisma.report.create({
    data: {
      userId: user.id,
      type: 'VISIBILITY',
      status: ReportStatus.PENDING,
      progress: 5,
      currentStep: 'Preparing visibility scan',
      website: input.data.website,
      brand: input.data.brand,
      topic: input.data.topic,
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
      const handle = await tasks.trigger<typeof searchVisibilityTask>(
        'search-visibility',
        {
          jobId: report.id,
          website: input.data.website,
          brand: input.data.brand,
          topic: input.data.topic,
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
            currentStep: report.currentStep ?? 'Preparing visibility scan',
          },
        },
        { status: 202 },
      );
    } catch (triggerError) {
      console.warn('Trigger.dev cloud dispatch bypassed, using Direct Scanner:', triggerError);
    }
  }

  // Direct scanner (Free Gemini API / Zero-key demo mode)
  void runDirectVisibilityScan(
    report.id,
    input.data.website,
    input.data.brand,
    input.data.topic,
  );

  return NextResponse.json(
    {
      jobId: report.id,
      runId: report.id,
      publicAccessToken: '',
      report: {
        status: report.status,
        progress: report.progress,
        currentStep: report.currentStep ?? 'Preparing visibility scan',
      },
    },
    { status: 202 },
  );
}
