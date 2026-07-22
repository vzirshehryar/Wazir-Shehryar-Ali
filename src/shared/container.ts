import { ChatRepository } from '../chat/repositories/chat.repositories.js';
import { MonthlyUsageRepository } from '../chat/repositories/monthly-usage.repository.js';
import { SubscriptionRepository } from '../subscription/repositories/subscription.repository.js';
import { QuotaService } from '../chat/services/quota.service.js';
import { ChatService } from '../chat/services/chat.service.js';
import { BillingService } from '../subscription/services/billing.service.js';
import { ChatController } from '../chat/contollers/chat.controller.js';
import { SubscriptionController } from '../subscription/controllers/subscription.controller.js';

// Repositories
const chatRepo = new ChatRepository();
const usageRepo = new MonthlyUsageRepository();
const subscriptionRepo = new SubscriptionRepository();

// Services
const quotaService = new QuotaService(usageRepo, subscriptionRepo);
const chatService = new ChatService(chatRepo, quotaService);
const billingService = new BillingService(subscriptionRepo);

// Controllers
export const chatController = new ChatController(chatService);
export const subscriptionController = new SubscriptionController(billingService);