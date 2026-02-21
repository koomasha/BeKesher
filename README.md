# Tuk-Tuk MVP

A networking platform that connects people through weekly meetups.

## Tech Stack

- **Backend**: Convex (serverless backend)
- **Frontend**: React + Vite (Telegram Mini App & Admin Dashboard)
- **Payments**: PayPlus API
- **Notifications**: Telegram Bot API

## Project Structure

```
tuk-tuk/
├── convex/              # Backend (Convex functions)
│   ├── schema.ts        # Database schema
│   ├── participants.ts  # User management
│   ├── groups.ts        # Group operations
│   ├── matching.ts      # Matching algorithm
│   ├── payments.ts      # Payment processing
│   ├── feedback.ts      # Feedback collection
│   ├── support.ts       # Support tickets
│   ├── notifications.ts # Telegram notifications
│   ├── http.ts          # Webhook endpoints
│   └── crons.ts         # Scheduled jobs
├── apps/
│   ├── user/            # Telegram Mini App (User-facing)
│   └── admin/           # Admin Dashboard
└── legacy/              # Legacy code references
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Convex CLI (`npm install -g convex`)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Convex:
   ```bash
   npx convex dev
   ```

4. Create `.env.local` with your environment variables (see `.env.example`)

5. Run the user app:
   ```bash
   npm run user:dev
   ```

6. Run the admin app:
   ```bash
   npm run admin:dev
   ```

## Environment Variables

### Convex (Production)
- `TELEGRAM_BOT_TOKEN` - Telegram Bot API token
- `TELEGRAM_CHANNEL_ID` - Community channel ID
- `PAYPLUS_API_KEY` - PayPlus API key
- `PAYPLUS_SECRET_KEY` - PayPlus secret key
- `PAYPLUS_PAGE_UID` - PayPlus payment page UID

### Frontend Apps
- `VITE_CONVEX_URL` - Convex deployment URL

## Key Features

### User Mini App
- Profile management
- View group matches
- Submit feedback
- Support tickets

### Admin Dashboard
- Participant management
- Group overview
- Manual matching trigger
- Support ticket response

### Matching Algorithm
The matching algorithm runs weekly (Sunday 18:00 Israel time) in 5 stages:
1. **Stage A**: Strict matching (same region, ±10 years, no repeats)
2. **Stage B**: Expanded age range (±15 years)
3. **Stage C**: Allow repeat meetups if needed
4. **Stage D**: Include neighboring regions
5. **Stage E**: Force majeure (ensure everyone is matched)

## Cron Jobs

- **Weekly Matching**: Sunday 16:00 UTC (18:00 Israel)
- **Week Close**: Saturday 21:00 UTC (23:00 Israel)
- **Payment Reminders**: Daily 08:00 UTC (10:00 Israel)
- **Cleanup**: Monday 01:00 UTC (03:00 Israel)

## Webhook Endpoints

- `POST /payplus-callback` - PayPlus payment notifications
- `POST /telegram-webhook` - Telegram bot updates
- `GET /health` - Health check

## Development

### TypeScript Check
```bash
npx tsc --noEmit
```

### Convex Sync
```bash
npx convex dev
```

## License

Private - All rights reserved
