# Micro SaaS Starter

Production-ready Next.js starter for multi-tenant SaaS apps with Better Auth, PostgreSQL + Drizzle, and a modern app shell.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Better Auth (email/password, Google OAuth, organizations, 2FA, admin)
- PostgreSQL + Drizzle ORM
- TanStack Query
- Tailwind CSS + shadcn/ui
- Resend + React Email

## Features Included

- Landing page plus authenticated `/app` product area
- Email/password authentication and password reset flow
- Optional Google sign-in (via Better Auth social provider)
- Multi-workspace organization model with member roles
- Invitation flow with email invite + accept invitation page
- Welcome and password reset emails (Resend + React Email)
- Settings pages scaffold (account + notification placeholder)

## Requirements

- Bun (recommended; `bun.lock` is included)
- PostgreSQL database

## Quick Start

1. Install dependencies:

```bash
bun install
```

2. Create `.env` in the project root:

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=replace-with-a-long-random-secret-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional integrations
RESEND_API_KEY=
RESEND_FROM="Micro SaaS Starter <onboarding@resend.dev>"
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BLOB_READ_WRITE_TOKEN=
```

3. Generate and run DB migrations:

```bash
bun run db:generate
bun run db:migrate
```

4. Start the app:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `bun run dev` - Start local development server
- `bun run build` - Create production build
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run typecheck` - Run TypeScript checks
- `bun run format` - Format repository with Prettier
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:migrate` - Run Drizzle migrations
- `bun run auth:generate` - Generate Better Auth schema file
- `bun run email:dev` - Preview React Email templates locally

## Notes

- If `RESEND_API_KEY` is not set, welcome/reset/invitation emails are skipped.
- Google login is automatically enabled only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.
- Auth and workspace routes are organized under:
  - `src/app/(login)/...` for auth pages
  - `src/app/app/...` for authenticated product pages
