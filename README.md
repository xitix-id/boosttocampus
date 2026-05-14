# BTC 2026 Admin Dashboard

Next.js admin dashboard and public QR claim flow for the BTC 2026 campaign.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_BOOTSTRAP_TOKEN`.
3. Install dependencies with `npm install`.
4. Apply database migrations with `npm run db:migrate`.
5. Start development server with `npm run dev`.

## Routes

- `/login` admin login
- `/admin` protected admin dashboard
- `/claim?code=XXXXXX` public claim flow
- `/success`, `/invalid`, `/void`, `/rate-limit`, `/maintenance` claim result pages

## Notes

Secrets are intentionally excluded from Git. Keep `.env.local` private.
