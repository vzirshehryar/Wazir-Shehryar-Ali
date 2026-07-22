import { prisma } from '../../db/prisma.js';
import type { ChatMessageModel } from '../../../prisma/generated/models';
import type { IRepository } from '../../shared/repository.interface.js';

export interface IChatRepository extends IRepository<ChatMessageModel> {
  findByUserId(userId: string): Promise<ChatMessageModel[]>;
}

export class ChatRepository implements IChatRepository {
  async findById(id: string): Promise<ChatMessageModel | null> {
    return prisma.chatMessage.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<ChatMessageModel[]> {
    return prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Omit<ChatMessageModel, 'id' | 'createdAt'>): Promise<ChatMessageModel> {
    return prisma.chatMessage.create({
      data,
    });
  }

  async update(id: string, data: Partial<ChatMessageModel>): Promise<ChatMessageModel> {
    return prisma.chatMessage.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.chatMessage.delete({
      where: { id },
    });
  }
}