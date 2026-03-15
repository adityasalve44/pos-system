# Restaurant POS Billing System

A production-grade browser-based POS system for small restaurants.

**Stack:** Next.js 15 · MySQL (PlanetScale) · Drizzle ORM · NextAuth.js v5 · React Query v5 · Zustand v5 · Tailwind CSS v3

## Quick Start

```bash
# 1. Install dependencies
pnpm install   # or npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — fill in DATABASE_URL and NEXTAUTH_SECRET

# 3. Push schema to database
pnpm db:push

# 4. Seed demo data
npx tsx lib/db/seed.ts

# 5. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:** `admin@demo.com` / `admin123`

## Environment Variables

```bash
# .env.local
DATABASE_URL=mysql://user:password@host/pos_db?ssl={"rejectUnauthorized":true}
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=<same as NEXTAUTH_SECRET>
```

> Note: NextAuth v5 also reads `AUTH_SECRET`. Set both to the same value.

## Project Structure

```
pos-system/
├── app/
│   ├── api/                    ← 14 Route Handlers (REST API, server-only)
│   │   ├── auth/[...nextauth]/ ← NextAuth handler
│   │   ├── products/           ← CRUD
│   │   ├── tables/             ← CRUD
│   │   ├── orders/             ← Create, list active
│   │   │   └── [id]/           ← Detail, items, bill, pay, cancel, print
│   │   └── reports/            ← daily summary, order history
│   ├── (auth)/login/           ← Login page (unauthenticated layout)
│   └── (dashboard)/            ← Protected pages (auth-guarded by middleware)
│       ├── tables/             ← Table grid — main operational view
│       ├── orders/[id]/        ← Active order + product selection
│       ├── takeout/            ← Takeout queue
│       ├── products/           ← Product management (admin only)
│       └── reports/            ← Revenue reports
├── components/
│   ├── layout/                 ← Navbar, Providers
│   ├── orders/                 ← OrderSheet
│   ├── products/               ← ProductGrid
│   └── billing/                ← PaymentModal, ReceiptView
├── lib/
│   ├── db/                     ← SERVER ONLY: Drizzle schema, mysql2 client, migrations, seed
│   ├── services/               ← SERVER ONLY: billing.ts, receipt.ts
│   ├── hooks/                  ← CLIENT: React Query hooks
│   ├── stores/                 ← CLIENT: Zustand UI state
│   └── utils/                  ← Shared: formatCurrency, formatDate
├── types/index.ts              ← Shared TypeScript types
├── auth.ts                     ← NextAuth v5 configuration
├── middleware.ts               ← Route protection (redirects unauthenticated users)
└── bridge/                     ← Phase 2: Local ESC/POS printer bridge
```

## Key Architecture Decisions

- **Server-authoritative state** — all order mutations go to DB before UI confirms them
- **10-second polling** on table grid for cross-device sync (no WebSockets)
- **Price snapshots** in `order_items` — historical bills never change when prices update
- **`restaurant_id` on every table** — ready for multi-tenant SaaS without schema changes
- **`server-only`** on `lib/db/` and `lib/services/` — build-time error if imported in client components

## Deployment

```bash
vercel --prod
```

Set in Vercel dashboard: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`

## Receipt Printing

**Phase 1 (MVP — works today):** Browser `window.print()` with 80mm thermal CSS.

**Phase 2:** Run `bridge/server.js` on a local Raspberry Pi for raw ESC/POS (paper cut, smaller font, faster).

## Database Scripts

```bash
pnpm db:push      # Push schema directly (development)
pnpm db:generate  # Generate migration SQL files
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle visual browser
```
