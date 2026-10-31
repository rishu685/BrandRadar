import { z } from 'zod';
import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import prisma from '@/lib/prisma';
import { ReportStatus } from '@/generated/prisma/client';
import { sanitizeScanErrorMessage } from '@/lib/scan-errors';
import { logger, metadata, schemaTask, wait } from '@trigger.dev/sdk';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const searchVisibilityPayloadSchema = z.object({
  jobId: z.string().regex(/^[a-f\d]{24}$/i),
  website: z.string().url(),
  brand: z.string().trim().min(2).max(120),
  topic: z.string().trim().min(3).max(180),
});

const visibilityPromptPlanSchema = z.object({
  prompts: z.array(z.string().trim().min(10).max(180)).length(5),
});

const visibilityReportSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  scoreLabel: z.enum(['Hidden', 'Low', 'Moderate', 'Strong', 'Dominant']),
  summary: z.string().min(1).max(500),
  overview: z.object({
    promptsChecked: z.number().int().nonnegative(),
    brandMentions: z.number().int().nonnegative(),
    websiteCitations: z.number().int().nonnegative(),
    competitorsFound: z.number().int().nonnegative(),
  }),
  platformResults: z
    .array(
      z.object({
        platform: z.enum(['ChatGPT', 'Gemini']),
        score: z.number().int().min(0).max(100),
        promptsChecked: z.number().int().nonnegative(),
        mentions: z.number().int().nonnegative(),
        citations: z.number().int().nonnegative(),
      }),
    )
    .length(2),
  promptResults: z.array(
    z.object({
      prompt: z.string().min(1),
      platforms: z.array(z.enum(['ChatGPT', 'Gemini'])).max(2),
      status: z.enum(['Mentioned', 'Opportunity']),
      evidence: z.string().min(1).max(280),
    }),
  ),
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        domain: z.string().optional(),
        mentions: z.number().int().nonnegative(),
        score: z.number().int().min(0).max(100),
      }),
    )
    .max(8),
  recommendations: z.array(z.string().min(1).max(240)).min(1).max(4),
});

export type VisibilityReportResult = z.infer<typeof visibilityReportSchema>;
type VisibilityPlatform = 'ChatGPT' | 'Gemini';

const platformConfig = {
  ChatGPT: {
    datasetId: 'gd_m7aof0k82r803d5bjm',
    url: 'https://chatgpt.com/',
  },
  Gemini: {
    datasetId: 'gd_mbz66arm2mf9cu856y',
    url: 'https://gemini.google.com/',
  },
} as const;

const brightDataSnapshotSchema = z.object({
  snapshot_id: z.string().min(1),
});

export const searchVisibilityTask = schemaTask({
  id: 'search-visibility',
  schema: searchVisibilityPayloadSchema,
  maxDuration: 300,
  run: async (payload) => {
    const apiToken = getBrightDataApiToken();

    logger.info('Starting AI search visibility scan', {
      jobId: payload.jobId,
      brand: payload.brand,
      topic: payload.topic,
    });

    const job = await prisma.report.findUnique({
      where: { id: payload.jobId },
      select: {
        id: true,
        type: true,
        website: true,
        brand: true,
        topic: true,
        brightDataSnapshots: true,
      },
    });

    if (!job) {
      throw new Error(`Visibility report ${payload.jobId} was not found`);
    }

    if (job.type !== 'VISIBILITY') {
      throw new Error(`Report ${payload.jobId} is not a visibility report`);
    }

    const website = job.website?.trim();
    const brand = job.brand?.trim();
    const topic = job.topic?.trim();

    if (!website || website !== payload.website) {
      throw new Error(`Report ${job.id} has an invalid website`);
    }

    if (!brand || brand !== payload.brand) {
      throw new Error(`Report ${job.id} has an invalid brand`);
    }

    if (!topic || topic !== payload.topic) {
      throw new Error(`Report ${job.id} has an invalid topic`);
    }

    await updateJobProgress(job.id, {
      status: ReportStatus.COLLECTING,
      progress: 20,
      currentStep: 'Creating customer prompts',
    });

    const prompts = await generateVisibilityPrompts({ website, brand, topic });

    const chatgptCallback = await wait.createToken({
      idempotencyKey: `search-visibility-chatgpt-${job.id}`,
      idempotencyKeyTTL: '24h',
      timeout: '15m',
      tags: [`visibility-report:${job.id}`, 'platform:chatgpt'],
    });
    const geminiCallback = await wait.createToken({
      idempotencyKey: `search-visibility-gemini-${job.id}`,
      idempotencyKeyTTL: '24h',
      timeout: '15m',
      tags: [`visibility-report:${job.id}`, 'platform:gemini'],
    });

    await updateJobProgress(job.id, {
      status: ReportStatus.COLLECTING,
      progress: 35,
      currentStep: 'Checking ChatGPT and Gemini',
    });

    const snapshotIds = [...job.brightDataSnapshots.slice(0, 2)];
    const collections = [
      { platform: 'ChatGPT', callbackUrl: chatgptCallback.url },
      { platform: 'Gemini', callbackUrl: geminiCallback.url },
    ] as const;

    for (const [index, collection] of collections.entries()) {
      if (snapshotIds[index]) {
        logger.info(`Reusing ${collection.platform} snapshot`, {
          jobId: job.id,
          snapshotId: snapshotIds[index],
        });
        continue;
      }

      snapshotIds[index] = await triggerVisibilityCollection({
        apiToken,
        platform: collection.platform,
        prompts,
        webhookUrl: collection.callbackUrl,
      });

      await prisma.report.update({
        where: { id: job.id },
        data: { brightDataSnapshots: snapshotIds },
        select: { id: true },
      });
    }

    logger.info('Waiting for AI answer delivery', {
      jobId: job.id,
      chatgptSnapshotId: snapshotIds[0],
      geminiSnapshotId: snapshotIds[1],
      prompts: prompts.length,
    });

    const chatgptRecords = await wait
      .forToken<unknown[]>(chatgptCallback)
      .unwrap();
    const geminiRecords = await wait
      .forToken<unknown[]>(geminiCallback)
      .unwrap();

    if (
      !Array.isArray(chatgptRecords) ||
      chatgptRecords.length === 0 ||
      !Array.isArray(geminiRecords) ||
      geminiRecords.length === 0
    ) {
      throw new Error('Bright Data returned incomplete AI visibility answers');
    }

    await updateJobProgress(job.id, {
      status: ReportStatus.ANALYZING,
      progress: 65,
      currentStep: 'Analysing brand mentions',
    });

    const report = await generateVisibilityReport({
      website,
      brand,
      topic,
      prompts,
      platformAnswers: {
        ChatGPT: chatgptRecords,
        Gemini: geminiRecords,
      },
    });

    await updateJobProgress(job.id, {
      status: ReportStatus.ANALYZING,
      progress: 85,
      currentStep: 'Building visibility report',
    });

    await prisma.report.update({
      where: { id: job.id },
      data: {
        status: ReportStatus.COMPLETED,
        progress: 100,
        currentStep: 'Report ready',
        provenance: 'LIVE',
        result: report,
        errorMessage: null,
        completedAt: new Date(),
      },
      select: { id: true },
    });

    metadata
      .set('status', ReportStatus.COMPLETED)
      .set('progress', 100)
      .set('currentStep', 'Report ready');
    await metadata.flush();

    return {
      jobId: job.id,
      status: 'completed',
      snapshotIds,
      report,
    };
  },
  onFailure: async ({ payload, error }) => {
    await markJobFailed(
      payload.jobId,
      'AI visibility scan failed',
      sanitizeScanErrorMessage(error),
    );
  },
  onCancel: async ({ payload }) => {
    await markJobFailed(
      payload.jobId,
      'Visibility scan cancelled',
      'This visibility scan was cancelled before it finished.',
    );
  },
});

async function generateVisibilityPrompts({
  website,
  brand,
  topic,
}: {
  website: string;
  brand: string;
  topic: string;
}) {
  const { output } = await generateText({
    model: google('gemini-3.5-flash-lite'),
    output: Output.object({
      schema: visibilityPromptPlanSchema,
      name: 'visibilityPromptPlan',
      description: 'Customer prompts used to measure AI search visibility.',
    }),
    system: [
      'You create neutral AI-search prompts for a brand visibility audit.',
      'Create natural questions a real potential customer would ask about the provided topic.',
      'Assume the customer does not already know which brand to choose.',
      'Never include the audited brand, website, or domain because that would bias the results.',
      'Create exactly one prompt for each intent: recommendation, specific use case, alternatives, comparison, and purchase decision.',
      'Keep every prompt distinct, specific, and commercially useful.',
    ].join(' '),
    prompt: [
      `Website: ${website}`,
      `Brand being audited: ${brand}`,
      `Topic: ${topic}`,
      'Return exactly five distinct prompts.',
    ].join('\n'),
    temperature: 0.2,
    maxOutputTokens: 1_200,
  });

  const forbiddenTerms = [
    ...(brand.trim().length >= 4 ? [brand] : []),
    new URL(website).hostname,
  ].map((value) => value.toLowerCase().replace(/^www\./, ''));
  const biasedPrompt = output.prompts.find((prompt) =>
    forbiddenTerms.some((term) => prompt.toLowerCase().includes(term)),
  );

  if (biasedPrompt) {
    throw new Error('Generated visibility prompts included the audited brand');
  }

  return output.prompts;
}

async function triggerVisibilityCollection({
  apiToken,
  platform,
  prompts,
  webhookUrl,
}: {
  apiToken: string;
  platform: VisibilityPlatform;
  prompts: string[];
  webhookUrl: string;
}) {
  const config = platformConfig[platform];
  const endpoint = new URL('https://api.brightdata.com/datasets/v3/trigger');

  endpoint.searchParams.set('dataset_id', config.datasetId);
  endpoint.searchParams.set('endpoint', webhookUrl);
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('uncompressed_webhook', 'true');
  endpoint.searchParams.set('force_deliver', 'true');
  endpoint.searchParams.set('include_errors', 'true');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: prompts.map((prompt, index) => ({
        url: config.url,
        prompt,
        index: index + 1,
        ...(platform === 'ChatGPT'
          ? { country: '', web_search: false, additional_prompt: '' }
          : {}),
      })),
      custom_output_fields: [
        'url',
        'prompt',
        'answer_text',
        'citations',
        'links_attached',
        'model',
        'timestamp',
        'error',
        'error_code',
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const responseText = await response.text();
    logger.error(`Bright Data ${platform} request failed`, {
      status: response.status,
      response: responseText.slice(0, 500),
    });
    throw new Error(
      `Bright Data ${platform} collection failed with status ${response.status}`,
    );
  }

  const responseBody = brightDataSnapshotSchema.safeParse(
    await response.json(),
  );
  if (!responseBody.success) {
    throw new Error(`Bright Data did not return a ${platform} snapshot ID`);
  }

  return responseBody.data.snapshot_id;
}

async function generateVisibilityReport({
  website,
  brand,
  topic,
  prompts,
  platformAnswers,
}: {
  website: string;
  brand: string;
  topic: string;
  prompts: string[];
  platformAnswers: Record<VisibilityPlatform, unknown[]>;
}): Promise<VisibilityReportResult> {
  const websiteHost = new URL(website).hostname.replace(/^www\./, '');
  const { output } = await generateText({
    model: google('gemini-3.5-flash-lite'),
    output: Output.object({
      schema: visibilityReportSchema,
      name: 'aiSearchVisibilityReport',
      description:
        'A structured report measuring a brand in collected AI answers.',
    }),
    system: [
      'You are the visibility analyst for BrandRadar.',
      'Use only the collected AI answers. Never invent mentions, citations, competitors, prompts, or scores.',
      'A brand mention counts only when the audited brand appears in an answer. A website citation counts only when a cited URL uses the audited website hostname.',
      'A competitor must be a genuine alternative recommended for the same topic, not a publisher or incidental source.',
      'Calculate each platform score from 0 to 100 using brand mention rate for 60 points and audited-website citation rate for 40 points.',
      'Use score labels Hidden for 0-9, Low for 10-34, Moderate for 35-64, Strong for 65-84, and Dominant for 85-100.',
      'The summary must state what the visibility data means, the biggest gap, and one practical next action in no more than 80 words.',
      'Every recommendation must address a missing prompt, weak citation signal, or competitor advantage found in the answers.',
      'promptResults must contain one row for every submitted prompt and preserve the submitted prompt text exactly.',
      'platformResults must contain exactly one ChatGPT result and exactly one Gemini result.',
      'Count no more than one brand mention and one audited-website citation per prompt on each platform.',
    ].join(' '),
    prompt: [
      `Audited brand: ${brand}`,
      `Audited website hostname: ${websiteHost}`,
      `Topic: ${topic}`,
      `Prompts submitted: ${JSON.stringify(prompts)}`,
      `Collected ChatGPT answers: ${JSON.stringify(platformAnswers.ChatGPT)}`,
      `Collected Gemini answers: ${JSON.stringify(platformAnswers.Gemini)}`,
    ].join('\n\n'),
    temperature: 0.1,
    maxOutputTokens: 8_000,
  });

  const platformResults = (['ChatGPT', 'Gemini'] as const).map((platform) => {
    const result = output.platformResults.find(
      (platformResult) => platformResult.platform === platform,
    );
    if (!result) {
      throw new Error(`Visibility report omitted ${platform}`);
    }

    const mentions = Math.min(prompts.length, result.mentions);
    const citations = Math.min(prompts.length, result.citations);
    return {
      ...result,
      promptsChecked: prompts.length,
      mentions,
      citations,
      score: Math.round(
        (mentions / prompts.length) * 60 + (citations / prompts.length) * 40,
      ),
    };
  });

  if (output.promptResults.length !== prompts.length) {
    throw new Error('Visibility report did not return one result per prompt');
  }

  const brandMentions = platformResults.reduce(
    (total, result) => total + result.mentions,
    0,
  );
  const websiteCitations = platformResults.reduce(
    (total, result) => total + result.citations,
    0,
  );
  const overallScore = Math.round(
    platformResults.reduce((total, result) => total + result.score, 0) /
      platformResults.length,
  );

  return {
    ...output,
    overallScore,
    scoreLabel: getVisibilityScoreLabel(overallScore),
    overview: {
      promptsChecked: prompts.length,
      brandMentions,
      websiteCitations,
      competitorsFound: output.competitors.length,
    },
    platformResults,
  };
}

function getVisibilityScoreLabel(
  score: number,
): VisibilityReportResult['scoreLabel'] {
  if (score < 10) return 'Hidden';
  if (score < 35) return 'Low';
  if (score < 65) return 'Moderate';
  if (score < 85) return 'Strong';
  return 'Dominant';
}

function getBrightDataApiToken() {
  const apiToken = process.env.BRIGHT_DATA_API_TOKEN;
  if (!apiToken) {
    throw new Error('BRIGHT_DATA_API_TOKEN is not configured');
  }
  return apiToken;
}

async function updateJobProgress(
  jobId: string,
  data: {
    status: ReportStatus;
    progress: number;
    currentStep: string;
  },
) {
  await prisma.report.update({
    where: { id: jobId },
    data: { ...data, errorMessage: null },
    select: { id: true },
  });

  metadata
    .set('status', data.status)
    .set('progress', data.progress)
    .set('currentStep', data.currentStep);
  await metadata.flush();
}

async function markJobFailed(
  jobId: string,
  currentStep: string,
  errorMessage: string,
) {
  await prisma.report.updateMany({
    where: {
      id: jobId,
      type: 'VISIBILITY',
      status: { not: ReportStatus.COMPLETED },
    },
    data: {
      status: ReportStatus.FAILED,
      currentStep,
      errorMessage,
      result: null,
    },
  });

  metadata
    .set('status', ReportStatus.FAILED)
    .set('currentStep', currentStep)
    .set('errorMessage', errorMessage);
  await metadata.flush();
}
