'use client';
import { useQuery } from '@tanstack/react-query';

type BillingStatus = {
  plan: 'free' | 'pro' | 'plus';
  isPaid: boolean;
  subscription: {
    subscriptionId?: string;
    cancelAtPeriodEnd: boolean;
    billingInterval?: string;
    periodEnd?: string;
  } | null;
  usage: {
    keywordSearches: Usage;
    visibilityScans: Usage;
  };
};

type Usage = {
  used: number;
  limit: number;
  remaining: number;
};

export function useBilling() {
  return useQuery({
    queryKey: ['billing-status'],
    queryFn: async (): Promise<BillingStatus> => {
      const response = await fetch('/api/billing/status');

      if (!response.ok) {
        throw new Error('Unable to load billing status');
      }

      return response.json() as Promise<BillingStatus>;
    },
    staleTime: 30_000,
  });
}
