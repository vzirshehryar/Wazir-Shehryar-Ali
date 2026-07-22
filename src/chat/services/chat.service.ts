import { mockOpenAICall } from './openai.mock.js';
import { QuotaService } from './quota.service.js';
import type { IChatRepository } from '../repositories/chat.repositories.js';
import type { ChatMessageModel } from '../../../prisma/generated/models';
import { NotFoundError } from '../../shared/error.js';

export interface ChatRequest {
  userId: string;
  question: string;
}

export interface ChatResponse {
  id: string;
  question: string;
  answer: string;
  tokensUsed: number;
  usedFreeQuota: boolean;
  bundleId: string | null;
  latencyMs: number;
  createdAt: Date;
}

export class ChatService {
  constructor(
    private readonly chatRepo: IChatRepository,
    private readonly quotaService: QuotaService
  ) {}

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Step 1: Check quota (throws QuotaExceededError if exceeded)
    const quotaCheck = await this.quotaService.checkQuota(request.userId);

    // Step 2: Call mocked OpenAI
    const aiResponse = await mockOpenAICall(request.question);

    // Step 3: Consume quota
    await this.quotaService.consumeQuota(request.userId, quotaCheck.applicableBundle);

    // Step 4: Store in database
    const chatData: Omit<ChatMessageModel, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: request.userId,
      question: request.question,
      answer: aiResponse.answer,
      tokensUsed: aiResponse.tokensUsed,
      bundleId: quotaCheck.applicableBundle?.id ?? null,
      usedFreeQuota: quotaCheck.useFreeQuota,
    };

    const saved = await this.chatRepo.create(chatData);

    return {
      id: saved.id,
      question: saved.question,
      answer: saved.answer,
      tokensUsed: saved.tokensUsed,
      usedFreeQuota: saved.usedFreeQuota,
      bundleId: saved.bundleId,
      latencyMs: aiResponse.latencyMs,
      createdAt: saved.createdAt,
    };
  }

  async getChatHistory(userId: string): Promise<ChatMessageModel[]> {
    return this.chatRepo.findByUserId(userId);
  }

  async getMessageById(id: string): Promise<ChatMessageModel> {
    const message = await this.chatRepo.findById(id);
    if (!message) throw new NotFoundError('Chat message');
    return message;
  }
}