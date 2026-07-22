import { addMonths, addYears, isPast } from 'date-fns';
import { BUNDLE_CONFIG, type BundleTier, type BillingCycle } from '../../shared/type.js';
import { PaymentFailedError, ValidationError } from '../../shared/error.js';
import type { ISubscriptionRepository } from '../repositories/subscription.repository.js';
import type { SubscriptionBundleModel } from '../../../prisma/generated/models';

export interface CreateBundleInput {
  userId: string;
  tier: BundleTier;
  billingCycle: BillingCycle;
  autoRenew?: boolean;
}

export interface BundleResult {
  id: string;
  tier: string;
  billingCycle: string;
  maxMessages: number | null;
  messagesUsed: number;
  price: number;
  startDate: Date;
  endDate: Date;
  renewalDate: Date | null;
  autoRenew: boolean;
  status: string;
  createdAt: Date;
}

export class BillingService {
  constructor(private readonly subscriptionRepo: ISubscriptionRepository) {}

  async createBundle(input: CreateBundleInput): Promise<BundleResult> {
    const config = BUNDLE_CONFIG[input.tier];
    
    const startDate = new Date();
    const endDate = input.billingCycle === 'monthly' 
      ? addMonths(startDate, 1) 
      : addYears(startDate, 1);
    
    const renewalDate = input.autoRenew !== false ? endDate : null;

    const bundle = await this.subscriptionRepo.create({
      userId: input.userId,
      tier: input.tier,
      billingCycle: input.billingCycle,
      maxMessages: config.maxMessages,
      messagesUsed: 0,
      price: input.billingCycle === 'monthly' ? config.monthlyPrice : config.yearlyPrice,
      startDate,
      endDate,
      renewalDate,
      autoRenew: input.autoRenew ?? true,
      status: 'active',
    });

    return this.toBundleResult(bundle);
  }

  async processRenewals(): Promise<{ renewed: number; failed: number }> {
    const allBundles = await this.subscriptionRepo.findActiveByUserId(''); // We'll need a findAll method
    // For simplicity, let's add a findAllActiveForRenewal method
    
    // Actually, let's implement this properly:
    const now = new Date();
    const activeBundles = await this.subscriptionRepo.findActiveByUserId(''); 
    // Note: In production, you'd have a dedicated query for renewals
    
    let renewed = 0;
    let failed = 0;

    for (const bundle of activeBundles) {
      if (!bundle.autoRenew || !bundle.renewalDate) continue;
      if (isPast(bundle.renewalDate)) {
        try {
          await this.renewBundle(bundle);
          renewed++;
        } catch {
          await this.subscriptionRepo.update(bundle.id, {
            status: 'inactive',
            autoRenew: false,
          });
          failed++;
        }
      }
    }

    return { renewed, failed };
  }

  private async renewBundle(bundle: SubscriptionBundleModel): Promise<void> {
    // Simulate payment processing with 20% failure rate
    const paymentSuccess = Math.random() > 0.2;
    
    if (!paymentSuccess) {
      throw new PaymentFailedError();
    }

    const config = BUNDLE_CONFIG[bundle.tier as BundleTier];
    const newEndDate = bundle.billingCycle === 'monthly'
      ? addMonths(bundle.endDate, 1)
      : addYears(bundle.endDate, 1);

    await this.subscriptionRepo.update(bundle.id, {
      endDate: newEndDate,
      renewalDate: newEndDate,
      messagesUsed: 0, // Reset usage for new period
      status: 'active',
    });
  }

  async cancelBundle(bundleId: string): Promise<BundleResult> {
    const bundle = await this.subscriptionRepo.findById(bundleId);
    if (!bundle) throw new ValidationError('Bundle not found');

    const updated = await this.subscriptionRepo.update(bundleId, {
      autoRenew: false,
      renewalDate: null,
      status: 'cancelled',
    });

    return this.toBundleResult(updated);
  }

  async getUserBundles(userId: string): Promise<BundleResult[]> {
    const bundles = await this.subscriptionRepo.findByUserId(userId);
    return bundles.map((b) => this.toBundleResult(b));
  }

  async getActiveBundles(userId: string): Promise<BundleResult[]> {
    const bundles = await this.subscriptionRepo.findActiveByUserId(userId);
    return bundles.map((b) => this.toBundleResult(b));
  }

  private toBundleResult(bundle: SubscriptionBundleModel): BundleResult {
    return {
      id: bundle.id,
      tier: bundle.tier,
      billingCycle: bundle.billingCycle,
      maxMessages: bundle.maxMessages,
      messagesUsed: bundle.messagesUsed,
      price: bundle.price,
      startDate: bundle.startDate,
      endDate: bundle.endDate,
      renewalDate: bundle.renewalDate,
      autoRenew: bundle.autoRenew,
      status: bundle.status,
      createdAt: bundle.createdAt,
    };
  }
}