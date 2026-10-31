import 'server-only';
import { ReportType } from '@/generated/prisma/client';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PLAN_LIMITS, type BillingPlan, type UsageFeature } from '@/lib/plans';

export async function getBillingStatus(userId: string) {
  const plan: BillingPlan = 'pro';
  const limits = PLAN_LIMITS[plan];

  const [keywordSearches, visibilityScans] = await Promise.all([
    prisma.report.count({
      where: {
        userId,
        type: ReportType.KEYWORD,
      },
    }),
    prisma.report.count({
      where: {
        userId,
        type: ReportType.VISIBILITY,
      },
    }),
  ]);

  return {
    plan,
    isPaid: true, // All features unlocked for everyone
    subscription: null,
    usage: {
      keywordSearches: {
        used: keywordSearches,
        limit: limits.keywordSearches,
        remaining: limits.keywordSearches,
      },
      visibilityScans: {
        used: visibilityScans,
        limit: limits.visibilityScans,
        remaining: limits.visibilityScans,
      },
    },
  };
}

export async function getCurrentBillingStatus() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }
  return getBillingStatus(user.id);
}

export async function checkUsageLimit(userId: string, _feature: UsageFeature) {
  const billing = await getBillingStatus(userId);
  return {
    allowed: true, // Unlimited usage for free open-source users
    billing,
  };
}
