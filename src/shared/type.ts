export const FREE_MESSAGES_PER_MONTH = 3;

export const BUNDLE_CONFIG = {
  basic: { maxMessages: 10, monthlyPrice: 999, yearlyPrice: 9990 },
  pro: { maxMessages: 100, monthlyPrice: 2999, yearlyPrice: 29990 },
  enterprise: { maxMessages: null, monthlyPrice: 9999, yearlyPrice: 99990 },
} as const;

export type BundleTier = keyof typeof BUNDLE_CONFIG;
export type BillingCycle = 'monthly' | 'yearly';