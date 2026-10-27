export const PLAN_LIMITS = {
  free: {
    keywordSearches: 999999,
    visibilityScans: 999999,
  },
  pro: {
    keywordSearches: 999999,
    visibilityScans: 999999,
  },
  plus: {
    keywordSearches: 999999,
    visibilityScans: 999999,
  },
} as const;

export type BillingPlan = keyof typeof PLAN_LIMITS;
export type UsageFeature = keyof (typeof PLAN_LIMITS)['free'];
