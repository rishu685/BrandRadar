import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import prisma from '@/lib/prisma';
import { ReportStatus } from '@/generated/prisma/client';
import { sanitizeScanErrorMessage } from '@/lib/scan-errors';
import { getKeywordScoreLabel } from '@/lib/keyword-report';
import { logger, metadata, schemaTask, wait } from '@trigger.dev/sdk';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const keywordResearchPayloadSchema = z.object({
  jobId: z.string().regex(/^[a-f\d]{24}$/i),
  keyword: z.string().trim().min(2).max(120),
  country: z.string().regex(/^[A-Z]{2}$/),
});

export const keywordScoreLabels = [
  'Needs work',
  'Promising',
  'Strong',
  'Excellent',
] as const;

const keywordReportSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  scoreLabel: z.enum(keywordScoreLabels),
  summary: z
    .string()
    .min(1)
    .max(600)
    .describe(
      'Exactly two or three concise sentences under 90 words: demand and dominant competitors, the biggest content gap, then one specific action.',
    ),
  overview: z.object({
    citationsAnalyzed: z.number().int().nonnegative(),
    uniqueDomains: z.number().int().nonnegative(),
    competitorsFound: z.number().int().nonnegative(),
    promptOpportunities: z.number().int().nonnegative(),
  }),
  topDomains: z
    .array(
      z.object({
        domain: z.string().min(1),
        type: z.string().min(1),
        citations: z
          .number()
          .int()
          .nonnegative()
          .describe(
            'Number of unique source pages collected from this domain.',
          ),
        share: z
          .number()
          .min(0)
          .max(100)
          .describe(
            'Percentage of all collected source pages that came from this domain.',
          ),
      }),
    )
    .max(8),
  evidenceSummary: z
    .array(
      z
        .string()
        .min(1)
        .max(220)
        .describe('A specific research insight or content recommendation.'),
    )
    .min(3)
    .max(5),
  sourceMix: z
    .array(
      z.object({
        type: z.string().min(1),
        count: z.number().int().nonnegative(),
        share: z.number().min(0).max(100),
      }),
    )
    .max(6),
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        domain: z.string().min(1),
        citations: z.number().int().nonnegative(),
        share: z.number().min(0).max(100),
        strength: z.enum(['High', 'Medium', 'Emerging', 'Not mentioned']),
      }),
    )
    .max(8),
  contentOpportunity: z.object({
    patternsThatEarnCitations: z.array(z.string().min(1)).max(4),
    evidenceGaps: z.array(z.string().min(1)).max(4),
    fastestOpportunities: z.array(z.string().min(1)).max(4),
  }),
  promptIdeas: z
    .array(
      z.object({
        prompt: z.string().min(1),
        evidence: z.string().min(1),
        opportunity: z.enum(['High', 'Medium', 'Low']),
      }),
    )
    .max(10),
  contentKeywords: z
    .array(
      z.object({
        keyword: z.string().min(1),
        cluster: z.string().min(1),
        evidence: z.string().min(1),
        relevance: z.number().int().min(0).max(100),
      }),
    )
    .max(12),
});

export type KeywordReportResult = z.infer<typeof keywordReportSchema>;

const brightDataSnapshotSchema = z.object({
  snapshot_id: z.string().min(1),
});

const brightDataOutputFields = [
  'url',
  'prompt',
  'answer_text',
  'answer_text_markdown',
  'sources',
  'timestamp',
  'input',
  'error',
  'error_code',
  'warning',
  'warning_code',
] as const;

export const keywordResearchTask = schemaTask({
  id: 'keyword-research',
  schema: keywordResearchPayloadSchema,
  maxDuration: 900,
  run: async (payload) => {
    const apiToken = getBrightDataApiToken();

    logger.info('Starting keyword research collection', {
      jobId: payload.jobId,
      keyword: payload.keyword,
      country: payload.country,
    });

    const job = await prisma.report.findUnique({
      where: {
        id: payload.jobId,
      },
      select: {
        id: true,
        type: true,
        keyword: true,
        country: true,
        brightDataSnapshots: true,
      },
    });

    if (!job) {
      throw new Error(`Keyword research job ${payload.jobId} was not found`);
    }

    if (job.type !== 'KEYWORD') {
      throw new Error(`Report ${payload.jobId} is not a keyword report`);
    }

    const keyword = job.keyword?.trim();
    const country = job.country?.trim().toUpperCase();

    if (!keyword || keyword !== payload.keyword) {
      throw new Error(`Report ${job.id} has an invalid keyword`);
    }

    if (
      !country ||
      !/^[A-Z]{2}$/.test(country) ||
      country !== payload.country
    ) {
      throw new Error(`Report ${job.id} has an invalid country code`);
    }

    await updateJobProgress(job.id, {
      status: ReportStatus.COLLECTING,
      progress: 20,
      currentStep: 'Collecting research sources',
    });

    const callbackToken = await wait.createToken({
      idempotencyKey: `keyword-research-${job.id}`,
      idempotencyKeyTTL: '24h',
      timeout: '15m',
      tags: [`keyword-report:${job.id}`],
    });

    const existingSnapshotId = job.brightDataSnapshots.find(
      (snapshotId) =>
        snapshotId.startsWith('s_') || snapshotId.startsWith('sd_'),
    );

    const snapshotId =
      existingSnapshotId ??
      (await triggerKeywordCollection({
        apiToken,
        keyword,
        country,
        webhookUrl: callbackToken.url,
      }));

    if (!existingSnapshotId) {
      await prisma.report.update({
        where: {
          id: job.id,
        },
        data: {
          brightDataSnapshots: {
            push: snapshotId,
          },
        },
        select: {
          id: true,
        },
      });
    }

    logger.info('Waiting for Bright Data webhook', {
      jobId: job.id,
      snapshotId,
      reusedSnapshot: Boolean(existingSnapshotId),
    });

    await updateJobProgress(job.id, {
      status: ReportStatus.COLLECTING,
      progress: 35,
      currentStep: 'Reviewing cited sources',
    });

    const rawDeliveryData = await wait.forToken<any>(callbackToken).unwrap();

    const researchRecords = Array.isArray(rawDeliveryData)
      ? rawDeliveryData
      : Array.isArray(rawDeliveryData?.data)
        ? rawDeliveryData.data
        : Array.isArray(rawDeliveryData?.response)
          ? rawDeliveryData.response
          : [];

    if (!Array.isArray(researchRecords) || researchRecords.length === 0) {
      throw new Error('Bright Data returned an empty keyword research result');
    }

    logger.info('Bright Data webhook delivery received', {
      jobId: job.id,
      snapshotId,
      deliveredRecords: researchRecords.length,
    });

    await updateJobProgress(job.id, {
      status: ReportStatus.ANALYZING,
      progress: 50,
      currentStep: 'Analyzing research findings',
    });

    const report = await generateReport({
      keyword,
      country,
      brightDataResult: researchRecords,
    });

    await updateJobProgress(job.id, {
      status: ReportStatus.ANALYZING,
      progress: 85,
      currentStep: 'Building keyword report',
    });

    await prisma.report.update({
      where: {
        id: job.id,
      },
      data: {
        status: ReportStatus.COMPLETED,
        progress: 100,
        currentStep: 'Report ready',
        provenance: 'LIVE',
        result: report,
        errorMessage: null,
        completedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    metadata
      .set('status', ReportStatus.COMPLETED)
      .set('progress', 100)
      .set('currentStep', 'Report ready');
    await metadata.flush();

    return {
      jobId: job.id,
      status: 'completed',
      snapshotId,
      collectedRecords: researchRecords.length,
      report,
    };
  },
  onFailure: async ({ payload, error }) => {
    await markJobFailed(
      payload.jobId,
      'Keyword research failed',
      sanitizeScanErrorMessage(error),
    );
  },
  onCancel: async ({ payload }) => {
    await markJobFailed(
      payload.jobId,
      'Report generation cancelled',
      'This report was cancelled before it finished.',
    );
  },
});

function getBrightDataApiToken() {
  const apiToken = process.env.BRIGHT_DATA_API_TOKEN;
  if (!apiToken) {
    throw new Error('BRIGHT_DATA_API_TOKEN is not configured');
  }
  return apiToken;
}

async function triggerKeywordCollection({
  apiToken,
  keyword,
  country,
  webhookUrl,
}: {
  apiToken: string;
  keyword: string;
  country: string;
  webhookUrl: string;
}) {
  const endpoint = new URL('https://api.brightdata.com/datasets/v3/trigger');

  endpoint.searchParams.set('dataset_id', 'gd_m7dhdot1vw9a7gc1n');
  endpoint.searchParams.set('endpoint', webhookUrl);
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('uncompressed_webhook', 'true');
  endpoint.searchParams.set('force_deliver', 'true');
  endpoint.searchParams.set('include_errors', 'true');
  endpoint.searchParams.set(
    'custom_output_fields',
    brightDataOutputFields.join('|'),
  );

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        url: 'https://www.perplexity.ai',
        prompt: keyword,
        country,
        index: 1,
      },
    ]),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const responseText = await response.text();

    logger.error('Bright Data collection request failed', {
      status: response.status,
      response: responseText.slice(0, 500),
    });

    throw new Error(
      `Bright Data collection failed with status ${response.status}`,
    );
  }

  const responseBody = brightDataSnapshotSchema.safeParse(
    await response.json(),
  );

  if (!responseBody.success) {
    throw new Error('Bright Data did not return a snapshot ID');
  }

  return responseBody.data.snapshot_id;
}

async function generateReport({
  keyword,
  country,
  brightDataResult,
}: {
  keyword: string;
  country: string;
  brightDataResult: unknown[];
}): Promise<KeywordReportResult> {
  logger.info('Generating structured keyword report', {
    keyword,
    country,
    researchRecords: brightDataResult.length,
  });

  const { output } = await generateText({
    model: google('gemini-3.5-flash-lite'),
    output: Output.object({
      schema: keywordReportSchema,
      name: 'keywordSeoReport',
      description:
        'An evidence-based SEO opportunity report derived from the supplied Bright Data research.',
    }),
    system: [
      'You are the research analyst for BrandRadar.',
      'Use only the supplied current web research to build the report.',
      'Never invent search volume, traffic, rankings, sources, facts, competitors, or any other metric that the supplied research does not support.',
      'Ignore sources that are not directly relevant to the requested keyword. Generic SEO or marketing sources are valid only when the keyword itself is about SEO or marketing.',
      'A competitor means a genuine peer: a comparable creator for a person, a direct alternative for a product or company, or a leading entity for a general topic. A publisher is not automatically a competitor.',
      'For competitor citations, count occurrences in the supplied answer and citations. Calculate competitor share from total competitor occurrences.',
      "Keep relevant known competitors or peers even when they have zero mentions for this keyword. A competitor with zero mentions must have 0 share and the strength label 'Not mentioned'; it must never be labeled High, Medium, or Emerging.",
      'Counts must match the supplied research. Deduplicate source URLs before calculating domains and group URLs by hostname for top domains.',
      'When citationsAnalyzed is greater than zero, topDomains must contain up to eight of the most referenced source domains. Never leave topDomains empty when sources were reviewed.',
      "Score the keyword's directional organic content potential out of 100: audience breadth 25 points, question diversity 20, content depth 20, competitive opportunity 20, and source confidence 15. Weak source coverage may reduce only the source-confidence portion; it must not erase clear audience or content opportunity.",
      'Use score labels Needs work for 0-39, Promising for 40-64, Strong for 65-84, and Excellent for 85-100.',
      'The summary field must be exactly two or three sentences and strictly under 90 words total, with no exceptions.',
      'evidenceSummary must contain three to five bullet points. Keep each bullet to one concise sentence under 28 words.',
      'The relevance value on contentKeywords is a confidence score from 0 to 100 showing how directly relevant the keyword is to the main topic based only on the research found.',
      'overview.competitorsFound must equal competitors.length and overview.promptOpportunities must equal promptIdeas.length.',
      'Keep every recommendation concise, specific, and understandable to a non-expert.',
    ].join(' '),
    prompt: [
      `Create a keyword opportunity report for "${keyword}" in country ${country}.`,
      'The summary must be two or three sentences under 90 words: describe the evidence and dominant competitors, identify the biggest content gap, then recommend one concrete action.',
      'Make competitorsFound equal the number of competitors and promptOpportunities equal the number of promptIdeas.',
      'Classify each proposed top domain by source type so the application can reuse that classification when calculating exact domain metrics.',
      'Bright Data research result:',
      JSON.stringify(brightDataResult),
    ].join('\n\n'),
    temperature: 0.2,
  });

  const sourceUrls = extractResearchSourceUrls(brightDataResult);
  const metrics = buildSourceMetrics(sourceUrls, output.topDomains);
  const competitors = output.competitors.map((competitor) =>
    competitor.citations === 0
      ? {
          ...competitor,
          share: 0,
          strength: 'Not mentioned' as const,
        }
      : competitor,
  );

  return {
    ...output,
    scoreLabel: getKeywordScoreLabel(output.overallScore),
    overview: {
      citationsAnalyzed: metrics.sourcesAnalyzed,
      uniqueDomains: metrics.uniqueDomains,
      competitorsFound: competitors.length,
      promptOpportunities: output.promptIdeas.length,
    },
    topDomains: metrics.topDomains,
    sourceMix: metrics.sourceMix,
    competitors,
  };
}

function extractResearchSourceUrls(brightDataResult: unknown[]) {
  const sourceUrls = brightDataResult.flatMap((record) => {
    if (!record || typeof record !== 'object') {
      return [];
    }

    const researchRecord = record as Record<string, unknown>;

    return [researchRecord.sources, researchRecord.citations].flatMap(
      (sources) => {
        if (!Array.isArray(sources)) {
          return [];
        }

        return sources.flatMap((source) => {
          if (typeof source === 'string') {
            return [source];
          }

          if (!source || typeof source !== 'object') {
            return [];
          }

          const sourceRecord = source as Record<string, unknown>;
          const sourceUrl = sourceRecord.url ?? sourceRecord.link;

          return typeof sourceUrl === 'string' ? [sourceUrl] : [];
        });
      },
    );
  });

  return [...new Set(sourceUrls)];
}

function buildSourceMetrics(
  sourceUrls: string[],
  generatedTopDomains: KeywordReportResult['topDomains'],
) {
  const generatedTypes = new Map(
    generatedTopDomains.map((domain) => [
      normalizeDomain(domain.domain),
      domain.type,
    ]),
  );

  const domainCounts = new Map<string, number>();

  for (const sourceUrl of sourceUrls) {
    try {
      const domain = normalizeDomain(new URL(sourceUrl).hostname);
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    } catch {
      logger.warn('Ignoring invalid Bright Data source URL', {
        sourceUrl: sourceUrl.slice(0, 200),
      });
    }
  }

  const sourcesAnalyzed = [...domainCounts.values()].reduce(
    (total, count) => total + count,
    0,
  );
  const allDomains = [...domainCounts.entries()]
    .map(([domain, citations]) => ({
      domain,
      type: generatedTypes.get(domain) ?? 'Other',
      citations,
      share:
        sourcesAnalyzed === 0
          ? 0
          : Number(((citations / sourcesAnalyzed) * 100).toFixed(1)),
    }))
    .sort(
      (left, right) =>
        right.citations - left.citations ||
        left.domain.localeCompare(right.domain),
    );

  const sourceTypeCounts = new Map<string, number>();
  for (const domain of allDomains) {
    sourceTypeCounts.set(
      domain.type,
      (sourceTypeCounts.get(domain.type) ?? 0) + domain.citations,
    );
  }

  const sourceMix = [...sourceTypeCounts.entries()]
    .map(([type, count]) => ({
      type,
      count,
      share:
        sourcesAnalyzed === 0
          ? 0
          : Number(((count / sourcesAnalyzed) * 100).toFixed(1)),
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.type.localeCompare(right.type),
    )
    .slice(0, 6);

  return {
    sourcesAnalyzed,
    uniqueDomains: domainCounts.size,
    topDomains: allDomains.slice(0, 8),
    sourceMix,
  };
}

function normalizeDomain(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  try {
    const domainUrl = normalizedValue.includes('://')
      ? new URL(normalizedValue)
      : new URL(`https://${normalizedValue}`);

    return domainUrl.hostname.replace(/^www\./, '');
  } catch {
    return normalizedValue.replace(/^www\./, '').replace(/\/+$/, '');
  }
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
    where: {
      id: jobId,
    },
    data: {
      ...data,
      errorMessage: null,
    },
    select: {
      id: true,
    },
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
      type: 'KEYWORD',
      status: {
        not: ReportStatus.COMPLETED,
      },
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
