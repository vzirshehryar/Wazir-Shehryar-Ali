import type { Request, Response } from 'express';
import { z } from 'zod';
import { BillingService } from '../services/billing.service.js';
import { successResponse, errorResponse } from '../../shared/response.helper.js';
import { ValidationError } from '../../shared/error.js';
import type { BundleTier, BillingCycle } from '../../shared/type.js';

const createBundleSchema = z.object({
  userId: z.string().uuid(),
  tier: z.enum(['basic', 'pro', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']),
  autoRenew: z.boolean().optional(),
});

export class SubscriptionController {
  constructor(private readonly billingService: BillingService) {}

  createBundle = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = createBundleSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0].message);
      }

      const bundle = await this.billingService.createBundle({
        userId: parseResult.data.userId,
        tier: parseResult.data.tier as BundleTier,
        billingCycle: parseResult.data.billingCycle as BillingCycle,
        autoRenew: parseResult.data.autoRenew,
      });

      successResponse(res, bundle, 201);
    } catch (error) {
      errorResponse(res, error);
    }
  };

  getUserBundles = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId;
      if (!userId || !z.string().uuid().safeParse(userId).success) {
        throw new ValidationError('Valid userId is required');
      }

      const bundles = await this.billingService.getUserBundles(userId);
      successResponse(res, bundles);
    } catch (error) {
      errorResponse(res, error);
    }
  };

  cancelBundle = async (req: Request, res: Response): Promise<void> => {
    try {
      const bundleId = req.params.bundleId;
      if (!bundleId || !z.string().uuid().safeParse(bundleId).success) {
        throw new ValidationError('Valid bundleId is required');
      }

      const cancelled = await this.billingService.cancelBundle(bundleId);
      successResponse(res, cancelled);
    } catch (error) {
      errorResponse(res, error);
    }
  };

  processRenewals = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.billingService.processRenewals();
      successResponse(res, result);
    } catch (error) {
      errorResponse(res, error);
    }
  };
}