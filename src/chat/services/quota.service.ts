import { FREE_MESSAGES_PER_MONTH } from '../../shared/type';
import { QuotaExceededError } from '../../shared/error';
import type { IMonthlyUsageRepository } from '../repositories/monthly-usage.repository';
import type { ISubscriptionRepository } from '../../subscription/repositories/subscription.repository';
import type { SubscriptionBundleModel } from '../../../prisma/generated/models';

export interface QuotaCheckResult {
  canProceed: boolean;
  useFreeQuota: boolean;
  applicableBundle: SubscriptionBundleModel | null;
  freeMessagesUsed: number;
}

export class QuotaService {
  constructor(
    private readonly usageRepo: IMonthlyUsageRepository,
    private readonly subscriptionRepo: ISubscriptionRepository
  ) {}

  async checkQuota(userId: string): Promise<QuotaCheckResult> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JS months are 0-indexed

    // Get or create monthly usage record
    const usage = await this.usageRepo.findByUserAndMonth(userId, year, month);
    const freeMessagesUsed = usage?.freeMessagesUsed ?? 0;

    // Check free quota first
    if (freeMessagesUsed < FREE_MESSAGES_PER_MONTH) {
      return {
        canProceed: true,
        useFreeQuota: true,
        applicableBundle: null,
        freeMessagesUsed,
      };
    }

    // Free quota exhausted - check subscription bundles
    const activeBundles = await this.subscriptionRepo.findActiveWithRemainingQuota(userId);

    // Filter bundles with remaining quota
    const eligibleBundles = activeBundles.filter((bundle) => {
      if (bundle.tier === 'enterprise') return true; // Unlimited
      return bundle.messagesUsed < (bundle.maxMessages ?? 0);
    });

    if (eligibleBundles.length === 0) {
      throw new QuotaExceededError({
        freeUsed: freeMessagesUsed,
        bundlesActive: activeBundles.length,
      });
    }

    // Use bundle with latest remaining quota (FIFO - first created, most remaining)
    // Sort by remaining quota descending
    const sortedBundles = eligibleBundles.sort((a, b) => {
      const remainingA = a.tier === 'enterprise' ? Infinity : (a.maxMessages ?? 0) - a.messagesUsed;
      const remainingB = b.tier === 'enterprise' ? Infinity : (b.maxMessages ?? 0) - b.messagesUsed;
      return remainingB - remainingA;
    });

    return {
      canProceed: true,
      useFreeQuota: false,
      applicableBundle: sortedBundles[0],
      freeMessagesUsed,
    };
  }

  async consumeQuota(userId: string, bundle: SubscriptionBundleModel | null): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (bundle) {
      // Deduct from subscription bundle
      await this.subscriptionRepo.deductUsage(bundle.id);
    } else {
      // Deduct from free quota
      await this.usageRepo.incrementUsage(userId, year, month);
    }
  }
}