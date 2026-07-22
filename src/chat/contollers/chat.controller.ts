import type { Request, Response } from 'express';
import { z } from 'zod';
import { ChatService } from '../services/chat.service.js';
import { successResponse, errorResponse } from '../../shared/response.helper.js';
import { ValidationError } from '../../shared/error.js';

const chatRequestSchema = z.object({
  userId: z.string().uuid(),
  question: z.string().min(1).max(4000),
});

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = chatRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0].message);
      }
      console.log("shery 0")
      const startTime = Date.now();
      const result = await this.chatService.sendMessage(parseResult.data);
      const latencyMs = Date.now() - startTime;

      successResponse(res, result, 201, { latencyMs });
    } catch (error) {
      errorResponse(res, error);
    }
  };

  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId;
      if (!userId || !z.string().uuid().safeParse(userId).success) {
        throw new ValidationError('Valid userId is required');
      }

      const history = await this.chatService.getChatHistory(userId);
      successResponse(res, history);
    } catch (error) {
      errorResponse(res, error);
    }
  };
}