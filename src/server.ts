import express from 'express';
import 'express-async-errors';
import dotenv from 'dotenv';
import chatRoutes from './chat/routes.js';
import subscriptionRoutes from './subscription/routes.js';
import { errorHandler } from './middleware/error-hanler.js';
import { requestLogger } from './middleware/request-logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middleware
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   POST /api/chat              - Send a message`);
  console.log(`   GET  /api/chat/history/:id  - Get chat history`);
  console.log(`   POST /api/subscriptions     - Create subscription`);
  console.log(`   GET  /api/subscriptions/user/:id - Get user subscriptions`);
  console.log(`   POST /api/subscriptions/:id/cancel - Cancel subscription`);
});