import { prisma } from '../../db/prisma.js';
import type { SubscriptionBundleModel } from '../../../prisma/generated/models';
import type { IRepository } from '../../shared/repository.interface.js';

export interface ISubscriptionRepository extends IRepository<SubscriptionBundleModel> {
  findActiveByUserId(userId: string): Promise<SubscriptionBundleModel[]>;
  findActiveWithRemainingQuota(userId: string): Promise<SubscriptionBundleModel[]>;
  deductUsage(bundleId: string): Promise<SubscriptionBundleModel>;
  findByUserId(userId: string): Promise<SubscriptionBundleModel[]>;
}

export class SubscriptionRepository implements ISubscriptionRepository {
  async findById(id: string): Promise<SubscriptionBundleModel | null> {
    return prisma.subscriptionBundle.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<SubscriptionBundleModel[]> {
    return prisma.subscriptionBundle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByUserId(userId: string): Promise<SubscriptionBundleModel[]> {
    const now = new Date();
    return prisma.subscriptionBundle.findMany({
      where: {
        userId,
        status: 'active',
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveWithRemainingQuota(userId: string): Promise<SubscriptionBundleModel[]> {
    const now = new Date();
    return prisma.subscriptionBundle.findMany({
      where: {
        userId,
        status: 'active',
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'asc' }, // Oldest first
    });
  }

  async create(data: Omit<SubscriptionBundleModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionBundleModel> {
    return prisma.subscriptionBundle.create({
      data,
    });
  }

  async update(id: string, data: Partial<SubscriptionBundleModel>): Promise<SubscriptionBundleModel> {
    return prisma.subscriptionBundle.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.subscriptionBundle.delete({
      where: { id },
    });
  }

  async deductUsage(bundleId: string): Promise<SubscriptionBundleModel> {
    return prisma.subscriptionBundle.update({
      where: { id: bundleId },
      data: {
        messagesUsed: { increment: 1 },
      },
    });
  }
}