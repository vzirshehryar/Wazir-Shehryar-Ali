# AI Chat & Subscription Management API

A production-ready REST API built with **Node.js**, **Express**, **TypeScript**, and **Prisma** following **Clean Architecture** and **Domain-Driven Design (DDD)** principles.

## Features

### Module 1: AI Chat Module
- Accepts user questions and returns mocked OpenAI responses
- Stores questions, answers, and token usage in PostgreSQL
- **Monthly free quota**: 3 free messages per user per month (auto-resets on the 1st)
- **Subscription bundles** for additional messages:
  - **Basic**: 10 responses
  - **Pro**: 100 responses
  - **Enterprise**: Unlimited responses
- Smart quota deduction from the bundle with the latest remaining quota
- Structured error responses when quota is exceeded
- Simulated OpenAI API latency (500ms - 2500ms)

### Module 2: Subscription Bundle Module
- Create subscription bundles (Basic, Pro, Enterprise)
- Choose billing cycle: **monthly** or **yearly**
- Toggle **auto-renewal**
- Simulated billing logic with random payment failures (20% failure rate)
- Graceful cancellation: ends current cycle, prevents renewal, preserves usage history

## Architecture

```
Presentation Layer (Express Controllers)
    ↓
Application Layer (Services - Business Logic)
    ↓
Domain Layer (Entities, Value Objects, Errors)
    ↓
Infrastructure Layer (Prisma Repositories, PostgreSQL)
```

- **Clean Architecture**: Business logic is framework-agnostic
- **Repository Pattern**: Abstracts data access, easily swappable
- **Dependency Injection**: Manual DI container for testability
- **Structured Errors**: Typed error classes with HTTP status codes

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Language | TypeScript 5.4+ |
| ORM | Prisma |
| Database | PostgreSQL 14+ |
| Validation | Zod |
| Date Utils | date-fns |
| Linting | ESLint |
| Formatting | Prettier |

## Project Structure

```
ai-chat-subscription-api/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   └── seed.ts                # Test data seeding script
├── src/
│   ├── db/
│   │   └── prisma.ts          # Prisma client singleton
│   ├── shared/
│   │   ├── container.ts       # Dependency injection container
│   │   ├── errors.ts          # Custom error classes
│   │   ├── repository.interface.ts
│   │   ├── response.helper.ts # API response formatting
│   │   └── types.ts           # Domain constants and types
│   ├── chat/
│   │   ├── repositories/
│   │   │   ├── chat.repository.ts
│   │   │   └── monthly-usage.repository.ts
│   │   ├── services/
│   │   │   ├── openai.mock.ts
│   │   │   ├── quota.service.ts
│   │   │   └── chat.service.ts
│   │   ├── controllers/
│   │   │   └── chat.controller.ts
│   │   └── routes.ts
│   ├── subscriptions/
│   │   ├── repositories/
│   │   │   └── subscription.repository.ts
│   │   ├── services/
│   │   │   └── billing.service.ts
│   │   ├── controllers/
│   │   │   └── subscription.controller.ts
│   │   └── routes.ts
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   └── request-logger.ts
│   └── server.ts
├── .env                       # Environment variables
├── .eslintrc.json
├── .prettierrc
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.x or higher
- [PostgreSQL](https://www.postgresql.org/) 14.x or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-chat-subscription-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ai_chat_db"
   PORT=3000
   NODE_ENV=development
   ```

4. **Create the database**
   ```bash
   # Using psql
   createdb ai_chat_db

   # Or via PostgreSQL CLI
   psql -U postgres -c "CREATE DATABASE ai_chat_db;"
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

7. **(Optional) Seed test data**
   ```bash
   npm run db:seed
   ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3000`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:deploy` | Deploy migrations in production |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:seed` | Seed database with test data |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors automatically |
| `npm run format` | Format code with Prettier |
| `npm test` | Run tests with Vitest |

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Chat Endpoints

#### Send a Message
```http
POST /api/chat
```

**Request Body:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "question": "What is machine learning?"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "question": "What is machine learning?",
    "answer": "Based on your question about "What is machine learning?"...",
    "tokensUsed": 145,
    "usedFreeQuota": true,
    "bundleId": null,
    "latencyMs": 1245,
    "createdAt": "2026-07-22T13:00:00.000Z"
  },
  "meta": {
    "latencyMs": 1245,
    "timestamp": "2026-07-22T13:00:01.245Z"
  }
}
```

**Quota Exceeded Response (402):**
```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "You have exceeded your monthly message quota. Please upgrade your subscription.",
    "details": {
      "freeUsed": 3,
      "bundlesActive": 0
    }
  },
  "meta": {
    "timestamp": "2026-07-22T13:00:00.000Z"
  }
}
```

#### Get Chat History
```http
GET /api/chat/history/:userId
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "question": "What is machine learning?",
      "answer": "...",
      "tokensUsed": 145,
      "bundleId": null,
      "usedFreeQuota": true,
      "createdAt": "2026-07-22T13:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-07-22T13:00:00.000Z"
  }
}
```

### Subscription Endpoints

#### Create Subscription Bundle
```http
POST /api/subscriptions
```

**Request Body:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "tier": "pro",
  "billingCycle": "monthly",
  "autoRenew": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "tier": "pro",
    "billingCycle": "monthly",
    "maxMessages": 100,
    "messagesUsed": 0,
    "price": 2999,
    "startDate": "2026-07-22T13:00:00.000Z",
    "endDate": "2026-08-22T13:00:00.000Z",
    "renewalDate": "2026-08-22T13:00:00.000Z",
    "autoRenew": true,
    "status": "active",
    "createdAt": "2026-07-22T13:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-07-22T13:00:00.000Z"
  }
}
```

#### Get User Subscriptions
```http
GET /api/subscriptions/user/:userId
```

#### Cancel Subscription
```http
POST /api/subscriptions/:bundleId/cancel
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "tier": "pro",
    "billingCycle": "monthly",
    "maxMessages": 100,
    "messagesUsed": 5,
    "price": 2999,
    "startDate": "2026-07-22T13:00:00.000Z",
    "endDate": "2026-08-22T13:00:00.000Z",
    "renewalDate": null,
    "autoRenew": false,
    "status": "cancelled",
    "createdAt": "2026-07-22T13:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-07-22T13:00:00.000Z"
  }
}
```

#### Process Renewals (Admin/Simulation)
```http
POST /api/subscriptions/process-renewals
```

**Response:**
```json
{
  "success": true,
  "data": {
    "renewed": 8,
    "failed": 2
  },
  "meta": {
    "timestamp": "2026-07-22T13:00:00.000Z"
  }
}
```

## Subscription Tiers

| Tier | Messages | Monthly Price | Yearly Price |
|------|----------|---------------|--------------|
| Basic | 10 | $9.99 | $99.90 |
| Pro | 100 | $29.99 | $299.90 |
| Enterprise | Unlimited | $99.99 | $999.90 |

## Error Handling

All errors follow a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": {} // Optional additional context
  },
  "meta": {
    "timestamp": "2026-07-22T13:00:00.000Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `QUOTA_EXCEEDED` | 402 | User has no remaining free or paid messages |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `PAYMENT_FAILED` | 402 | Simulated payment processing failure |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Database Schema

### Users
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email address |
| name | String | Optional display name |

### Monthly Usage
| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | Foreign key to users |
| year | Integer | Billing year |
| month | Integer | Billing month (1-12) |
| freeMessagesUsed | Integer | Count of free messages used |

### Subscription Bundles
| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | Foreign key to users |
| tier | Enum | basic / pro / enterprise |
| billingCycle | Enum | monthly / yearly |
| maxMessages | Integer | Message limit (null for unlimited) |
| messagesUsed | Integer | Current period usage |
| price | Integer | Price in cents |
| startDate | DateTime | Bundle activation date |
| endDate | DateTime | Bundle expiration date |
| renewalDate | DateTime | Next renewal date |
| autoRenew | Boolean | Auto-renewal enabled |
| status | Enum | active / inactive / cancelled |

### Chat Messages
| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | Foreign key to users |
| question | String | User's question |
| answer | String | AI response |
| tokensUsed | Integer | Simulated token count |
| bundleId | UUID | Foreign key to subscription (null if free) |
| usedFreeQuota | Boolean | Whether free quota was used |

## Quota Logic

1. **Free Messages**: Each user gets 3 free messages per calendar month
2. **Auto-Reset**: Free quota automatically resets on the 1st of each month
3. **Bundle Priority**: After free quota is exhausted, the system deducts from the active bundle with the **most remaining messages**
4. **Enterprise**: Unlimited bundles never exhaust
5. **Exhaustion**: If no valid bundle exists, a `QUOTA_EXCEEDED` error is returned

## Development

### Code Style

- **ESLint**: Enforces consistent code style and catches common errors
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict mode enabled with comprehensive type checking

### Running Linting

```bash
# Check for issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format
```

### Database Management

```bash
# Open visual database manager
npx prisma studio

# Create a new migration after schema changes
npx prisma migrate dev --name descriptive_name

# Reset database (development only)
npx prisma migrate reset

# View raw SQL of last migration
npx prisma migrate diff
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Production Deployment

1. **Set environment variables:**
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/ai_chat_db"
   PORT=3000
   NODE_ENV=production
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Deploy migrations:**
   ```bash
   npm run db:deploy
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

## License

MIT

## Author

Built as a demonstration of Clean Architecture with Node.js, TypeScript, and Prisma.
