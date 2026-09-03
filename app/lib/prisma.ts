import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Between invocations, Vercel freezes the serverless function instance rather
// than tearing it down. While frozen, the pg Pool's sockets don't get to
// process the DB closing them for inactivity, so the pool looks healthy but
// is actually holding a dead connection — the next "warm" invocation reuses
// it and every query fails with "Server has closed the connection"
// (Prisma error P1017). attachDatabasePool() hooks into Vercel's suspend
// lifecycle to drain/close the pool before freeze, so the next invocation
// opens a fresh connection instead of reusing a stale one. This is Prisma's
// documented pattern for @prisma/adapter-pg on Vercel.
function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  attachDatabasePool(pool);
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
