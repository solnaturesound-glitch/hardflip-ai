# Hardflip AI 🔥

**The AI accountability coach that won't let you quit your goals.**

Hardflip AI is a full-stack Next.js application that provides AI-powered accountability coaching. Set goals, get broken into milestones by AI, and have a ruthless coach follow up with you until you finish.

---

## Features

- 🎯 **Goal Setting** — Create goals with deadlines, categories, and frequencies
- 🤖 **AI Coach** — Real conversations with Claude (Anthropic) that remembers your commitments
- 📊 **Milestone Tracking** — AI auto-generates 5 concrete milestones per goal
- ⚠️ **Overdue Alerts** — Dashboard highlights goals with missed check-ins in red
- 💳 **Stripe Payments** — Three subscription tiers with feature gating
- 🔐 **Auth** — Email/password auth with NextAuth v5 and Prisma
- 📧 **Email-ready** — Nodemailer configured for Pro/Elite email notifications

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS (custom dark theme) |
| Auth | NextAuth.js v5 (credentials provider) |
| Database | Prisma ORM + SQLite (swap to Postgres for production) |
| AI | Anthropic `claude-sonnet-4-6` via `@anthropic-ai/sdk` |
| Payments | Stripe Checkout + Webhooks |
| Email | Nodemailer |

## Quick Start

### 1. Clone and install dependencies

```bash
cd hardflip-ai
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Database (SQLite for local dev)
DATABASE_URL="file:./dev.db"

# NextAuth — generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Anthropic AI (required for AI coach)
ANTHROPIC_API_KEY="sk-ant-..."

# Stripe (required for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_BASIC_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ELITE_PRICE_ID="price_..."

# Email (for Pro/Elite notifications)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your@email.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="Hardflip AI <noreply@hardflip.ai>"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
npx prisma migrate dev --name init
# or for first time:
npx prisma db push
npx prisma generate
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Stripe Setup

### Create products and prices in Stripe Dashboard

1. Go to [dashboard.stripe.com/products](https://dashboard.stripe.com/products)
2. Create three products:
   - **Hardflip Basic** — $4.99/month recurring
   - **Hardflip Pro** — $9.99/month recurring
   - **Hardflip Elite** — $19.99/month recurring
3. Copy each price ID and add to your `.env`

### Set up webhook for local development

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward events to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret from the CLI output to `STRIPE_WEBHOOK_SECRET`.

### Webhook events handled

- `checkout.session.completed` — Upgrade user plan
- `customer.subscription.updated` — Sync plan changes
- `customer.subscription.deleted` — Revert to free plan
- `invoice.payment_failed` — Mark subscription as past_due

---

## Project Structure

```
hardflip-ai/
├── prisma/
│   └── schema.prisma          # Database models
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/         # Login page
│   │   │   └── signup/        # Signup page
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth handlers + signup
│   │   │   ├── goals/         # Goal CRUD API
│   │   │   ├── ai/chat/       # AI coach chat API
│   │   │   └── stripe/        # Checkout + webhook
│   │   ├── dashboard/         # User dashboard
│   │   ├── goals/
│   │   │   ├── new/           # Create goal form
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # Goal detail view
│   │   │       └── coach/     # AI chat interface
│   │   ├── pricing/           # Pricing page
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/               # Button, Card, Input, Badge
│   │   ├── Navbar.tsx
│   │   ├── GoalCard.tsx
│   │   ├── ChatInterface.tsx
│   │   └── PricingCard.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # NextAuth v5 config
│   │   ├── anthropic.ts       # AI coach helpers
│   │   └── stripe.ts          # Stripe config + plan definitions
│   └── middleware.ts          # Route protection
└── .env.example
```

---

## Database Schema

```prisma
User → has many Goals
Goal → has many Milestones, Messages
```

- **User** — email, password (bcrypt), plan, Stripe IDs
- **Goal** — title, description, category, deadline, frequency, status, next check-in
- **Milestone** — step-by-step breakdown per goal (AI-generated)
- **Message** — conversation history per goal (persisted for AI context)

### Migrate to PostgreSQL

Change `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Update `DATABASE_URL` to your Postgres connection string.

---

## Plan Limits

| Plan | Goals | Check-ins | Email |
|------|-------|-----------|-------|
| Free | 1 | Weekly | ❌ |
| Basic ($4.99/mo) | 3 | Daily | ❌ |
| Pro ($9.99/mo) | 10 | Hourly | ✅ |
| Elite ($19.99/mo) | Unlimited | Real-time | ✅ |

---

## AI Coach System Prompt

The AI coach is powered by Anthropic `claude-sonnet-4-6` with this system prompt:

> *"You are an uncompromising accountability coach for Hardflip AI. Your job is to push the user to complete their goals. You are encouraging but ruthless — you won't accept excuses, and you'll call out when someone is about to quit. You ask tough questions, provide specific action steps, and follow up on previous commitments. Never let the user off the hook."*

Each conversation includes full goal context: title, description, milestones, status, deadline, and last check-in time. The AI also auto-generates:
- **Milestones** when a goal is created (5 concrete steps)
- **Next check-in schedule** after each coaching session

---

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Set all environment variables in Vercel dashboard. For production:
- Switch `DATABASE_URL` to Postgres (Supabase, Neon, or PlanetScale)
- Set `NEXTAUTH_URL` to your production domain
- Configure Stripe production keys and webhook endpoint

### Environment checklist for production

- [ ] `AUTH_SECRET` — secure random string
- [ ] `ANTHROPIC_API_KEY` — production key
- [ ] `STRIPE_SECRET_KEY` — `sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET` — from live webhook endpoint
- [ ] `DATABASE_URL` — PostgreSQL connection string
- [ ] `NEXT_PUBLIC_APP_URL` — your domain

---

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio (DB browser)
npx prisma migrate dev  # Run DB migrations
npx prisma generate  # Regenerate Prisma client
```

---

## License

MIT — build something great with it.

---

*Hardflip AI — No excuses. No quitting. Just results.*
