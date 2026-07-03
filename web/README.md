# FlowChat — Web (Next.js 16)

The frontend and API route handlers for FlowChat. See the [root README](../../README.md) for the full project overview, architecture, and environment variables.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Clerk keys + DATABASE_URL
npx prisma migrate dev       # apply schema
npx prisma generate          # generate client → generated/prisma
npm run dev                  # http://localhost:3000
```

The backend must be running first (see [`../api`](../api)) — `NEXT_PUBLIC_API_URL` points the route handlers at it.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev`   | Dev server on `:3000` |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint`  | ESLint |

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Clerk auth, Prisma 7 (PostgreSQL), Framer Motion.
