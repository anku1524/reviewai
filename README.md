# ReviewAI — Phase 0/1 Scaffold

This is the Phase 0 (planning → infra) and Phase 1 (auth & user management) skeleton
for ReviewAI, matching `packages/db/schema.prisma` to the DB design and `apps/api`/`apps/web`
to the roadmap's tech stack (Next.js + NestJS + Prisma + PostgreSQL).

## What's implemented

- **packages/db** — Prisma schema covering Users, Businesses, Locations, Customers,
  ReviewRequests, Ratings, AIReviewDrafts, Campaigns, Notifications, Subscriptions,
  AuditLogs, ApiKeys. Includes a seed script for a demo business.
- **apps/api** (NestJS) — `/auth/register`, `/auth/login` (JWT), `/users/me`,
  `/businesses` (create + list for current owner). Role-based guard (`RolesGuard`)
  is wired and ready for Manager/Employee endpoints in Phase 2.
- **apps/web** (Next.js 15 + Tailwind) — Landing page, register, login, and a
  dashboard shell that calls `/users/me` and `/businesses` and shows placeholder
  metric cards (review count, avg rating, pending requests, response rate) — ready
  to wire to real data in Phase 2.

## What's intentionally stubbed for later phases

- Google OAuth login, email verification, password reset (Phase 1 follow-up)
- Multi-location / team member endpoints (Phase 2)
- Customer review page + rating-based routing (Phase 3)
- AI review draft / reply generation (Phase 4)
- Campaigns, automation, channels (Phase 5)
- Third-party + CRM integrations (Phase 6)
- Analytics aggregation endpoints (Phase 7)
- White-label, public API, SSO, audit log UI (Phase 8)

## Running locally

Requires Node 20+, npm, and a PostgreSQL instance (network/installs are not available
in this sandbox, so dependencies haven't been installed here — run these on your machine).

```bash
# from the repo root
npm install

# configure env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# edit apps/api/.env with your real DATABASE_URL and a strong JWT_SECRET

# generate Prisma client + run migrations
npm run db:generate
npm run db:migrate
npm run db:seed   # optional: creates a demo business

# run both apps (in separate terminals)
npm run dev:api
npm run dev:web
```

API will run on `http://localhost:4000/api`, web on `http://localhost:3000`.

## Suggested next steps (Phase 1 wrap-up)

1. Add Google OAuth strategy (`passport-google-oauth20`) alongside the existing JWT strategy.
2. Add email verification + password reset flows (Resend for email delivery, per tech stack).
3. Add Manager/Employee invite endpoints under `businesses`, gated by `RolesGuard`.
4. Wire the dashboard metric cards to real aggregation queries once Ratings/ReviewRequests have data (Phase 2).
