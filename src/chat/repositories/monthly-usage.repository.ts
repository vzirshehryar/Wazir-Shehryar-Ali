import { prisma } from '../../db/prisma.js';
import type { MonthlyUsageModel } from '../../../prisma/generated/models';

export interface IMonthlyUsageRepository {
  findByUserAndMonth(userId: string, year: number, month: number): Promise<MonthlyUsageModel | null>;
  createOrUpdate(data: Omit<MonthlyUsageModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<MonthlyUsageModel>;
  incrementUsage(userId: string, year: number, month: number): Promise<MonthlyUsageModel>;
}

export class MonthlyUsageRepository implements IMonthlyUsageRepository {
  async findByUserAndMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyUsageModel | null> {
    return prisma.monthlyUsage.findUnique({
      where: {
        userId_year_month: {
          userId,
          year,
          month,
        },
      },
    });
  }

  async createOrUpdate(
    data: Omit<MonthlyUsageModel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MonthlyUsageModel> {
    return prisma.monthlyUsage.upsert({
      where: {
        userId_year_month: {
          userId: data.userId,
          year: data.year,
          month: data.month,
        },
      },
      update: {
        freeMessagesUsed: data.freeMessagesUsed,
      },
      create: data,
    });
  }

  async incrementUsage(userId: string, year: number, month: number): Promise<MonthlyUsageModel> {
    const existing = await this.findByUserAndMonth(userId, year, month);

    if (existing) {
      return prisma.monthlyUsage.update({
        where: { id: existing.id },
        data: {
          freeMessagesUsed: { increment: 1 },
        },
      });
    }

    return prisma.monthlyUsage.create({
      data: {
        userId,
        year,
        month,
        freeMessagesUsed: 1,
      },
    });
  }
}