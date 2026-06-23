import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer auto-loads .env files for the CLI, and connection URLs
// are no longer allowed in schema.prisma. Load Next.js's .env.local so
// commands like `prisma migrate dev` / `prisma db push` can see DATABASE_URL.
// (Run prisma commands from this directory: apps/web.)
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local is optional; fall back to the ambient environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
