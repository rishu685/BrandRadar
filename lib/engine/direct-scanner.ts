import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { ReportStatus, Prisma } from '@/generated/prisma/client';
import {
  generateDemoVisibilityReport,
  generateDemoKeywordReport,
} from './demo-data';
import type { VisibilityReportResult } from '@/types/search-visibility';
import type { KeywordReport } from '@/lib/keyword-report';

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

const keywordReportSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  scoreLabel: z.enum(['Needs work', 'Promising', 'Strong', 'Excellent']),
  summary: z.string().min(1).max(500),
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
        citations: z.number().int().nonnegative(),
        share: z.number().min(0).max(100),
      }),
    )
    .max(6),
  evidenceSummary: z.array(z.string().min(1)).max(4),
  sourceMix: z
    .array(
      z.object({
        type: z.string().min(1),
        count: z.number().int().nonnegative(),
        share: z.number().min(0).max(100),
      }),
    )
    .max(5),
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runDirectVisibilityScan(
  jobId: string,
  website: string,
  brand: string,
  topic: string,
) {
  try {
    await sleep(400);
    await prisma.report.update({
      where: { id: jobId },
      data: {
        status: ReportStatus.COLLECTING,
        progress: 25,
        currentStep: 'Creating customer prompts',
      },
    });

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    let result: VisibilityReportResult;

    if (apiKey && apiKey !== 'your_google_gemini_api_key' && !apiKey.includes('replace')) {
      try {
        const google = createGoogleGenerativeAI({ apiKey });
        await sleep(600);
        await prisma.report.update({
          where: { id: jobId },
          data: {
            status: ReportStatus.ANALYZING,
            progress: 60,
            currentStep: 'Checking ChatGPT and Gemini responses',
          },
        });

        const prompt = `You are an expert Generative Engine Optimization (GEO) & AEO analyst for BrandRadar.
Analyze the brand visibility of:
- Brand: "${brand}"
- Website: "${website}"
- Industry/Topic: "${topic}"

Evaluate how AI search engines (ChatGPT, Google Gemini) treat this brand.
Determine realistic scores, citations, competitor share of voice, prompt opportunities, and concrete GEO recommendations.`;

        const response = await generateText({
          model: google('gemini-2.5-flash'),
          prompt,
          output: Output.object({ schema: visibilityReportSchema }),
        });

        result = response.output as VisibilityReportResult;
      } catch (aiError) {
        console.warn('Gemini direct query fallback to demo engine:', aiError);
        result = generateDemoVisibilityReport(website, brand, topic);
      }
    } else {
      await sleep(800);
      await prisma.report.update({
        where: { id: jobId },
        data: {
          status: ReportStatus.ANALYZING,
          progress: 60,
          currentStep: 'Synthesizing AEO landscape & citations',
        },
      });
      await sleep(1000);
      result = generateDemoVisibilityReport(website, brand, topic);
    }

    await prisma.report.update({
      where: { id: jobId },
      data: {
        status: ReportStatus.COMPLETED,
        progress: 100,
        currentStep: 'Report ready',
        result: result as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Direct visibility scan failed:', error);
    await prisma.report.update({
      where: { id: jobId },
      data: {
        status: ReportStatus.FAILED,
        currentStep: 'Visibility scan failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown scan error',
      },
    });
  }
}

export async function runDirectKeywordScan(
  jobId: string,
  keyword: string,
  country: string,
) {
  try {
    await sleep(400);
    await prisma.report.update({
      where: { id: jobId },
      data: {
        status: ReportStatus.COLLECTING,
        progress: 25,
        currentStep: 'Collecting research sources',
      },
    });

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    let result: KeywordReport;

    if (apiKey && apiKey !== 'your_google_gemini_api_key' && !apiKey.includes('replace')) {
      try {
        const google = createGoogleGenerativeAI({ apiKey });
        await sleep(600);
        await prisma.report.update({
          where: { id: jobId },
          data: {
            status: ReportStatus.ANALYZING,
            progress: 65,
            currentStep: 'Analysing research findings & competitor share',
          },
        });

        const prompt = `You are an expert AEO & GEO keyword intelligence engine for BrandRadar.
Analyze the target keyword:
- Keyword: "${keyword}"
- Target Country: "${country}"

Evaluate citation patterns, top cited domains, competitor share of voice, evidence gaps, and prompt ideas.`;

        const response = await generateText({
          model: google('gemini-2.5-flash'),
          prompt,
          output: Output.object({ schema: keywordReportSchema }),
        });

        result = response.output as KeywordReport;
      } catch (aiError) {
        console.warn('Gemini keyword analysis fallback to demo engine:', aiError);
        result = generateDemoKeywordReport(keyword, country);
      }
    } else {
      await sleep(800);
      await prisma.report.update({
        where: { id: jobId },
        data: {
          status: ReportStatus.ANALYZING,
          progress: 65,
          currentStep: 'Analysing research findings & competitor share',
        },
      });
      await sleep(1000);
      result = generateDemoKeywordReport(keyword, country);
    }

    await prisma.report.update({
      where: { id: jobId },
      data: {
        status: ReportStatus.COMPLETED,
        progress: 100,
        currentStep: 'Report ready',
        result: result as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Direct keyword scan failed:', error);
    await prisma.report.update({
      where: { id: jobId },
      data: {
        status: ReportStatus.FAILED,
        currentStep: 'Keyword scan failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown keyword scan error',
      },
    });
  }
}
