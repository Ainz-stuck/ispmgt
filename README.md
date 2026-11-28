# UniSpace — CHMSU Facility & Equipment Reservation Portal

Campus venue scheduling, equipment allocation, and role-based approval workflow for Carlos Hilado Memorial State University (CHMSU), built with Next.js 16 and Supabase.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<optional-for-seeding-and-security-audit>
   ```

3. Apply [`supabase_schema.sql`](./supabase_schema.sql) in the Supabase Dashboard SQL Editor to create/update tables, RLS policies, triggers, and atomic transaction RPCs (`create_reservation_tx`, `approve_reservation_tx`, `update_reservation_tx`, `delete_reservation_tx`).

4. Optional: seed baseline facilities, resources, and demo accounts:
   ```bash
   node scripts/seed.mjs
   ```

## Scripts

- `npm run dev` — Start local development server
- `npm run build` — Production build
- `npm test` — Run unit & regression tests (`tests/*.test.mjs`)
- `npm run lint` — Run ESLint
- `npx tsc --noEmit` — Type-check TypeScript sources
- `npm run audit:security` — Verify live Supabase RLS, triggers, and schema readiness
