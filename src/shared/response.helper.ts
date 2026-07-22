import type { Response } from 'express';
import { AppError } from './error';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    latencyMs?: number;
    timestamp: string;
  };
}

export function successResponse<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: { latencyMs?: number }
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };
  res.status(statusCode).json(response);
}

export function errorResponse(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.status(error.statusCode).json(response);
    return;
  }

  // Unexpected error
  console.error('Unexpected error:', error);
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  res.status(500).json(response);
}