import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires a driver adapter passed to the client constructor.
// PrismaPg uses the `pg` driver and reads the connection string from env.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Reuse a single client across hot reloads in development.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
