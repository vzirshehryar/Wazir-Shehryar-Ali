export class AppError extends Error {
    constructor(
      public readonly code: string,
      message: string,
      public readonly statusCode: number = 400,
      public readonly details?: Record<string, unknown>
    ) {
      super(message);
      this.name = 'AppError';
      Object.setPrototypeOf(this, AppError.prototype);
    }
  }
  
  export class QuotaExceededError extends AppError {
    constructor(details?: { freeUsed: number; bundlesActive: number }) {
      super(
        'QUOTA_EXCEEDED',
        'You have exceeded your monthly message quota. Please upgrade your subscription.',
        402,
        details
      );
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(resource: string) {
      super('NOT_FOUND', `${resource} not found`, 404);
    }
  }
  
  export class ValidationError extends AppError {
    constructor(message: string) {
      super('VALIDATION_ERROR', message, 400);
    }
  }
  
  export class PaymentFailedError extends AppError {
    constructor() {
      super('PAYMENT_FAILED', 'Payment processing failed. Subscription marked inactive.', 402);
    }
  }