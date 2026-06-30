import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

let prisma: PrismaClient;

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/champsarena?schema=public";

if (process.env.NODE_ENV === "production") {
  // Production: Use connection pooling with optimized settings
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
      connectionString,
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      maxUses: 7500,
    });
  }
  prisma = new PrismaClient();
} else {
  // Development: Reuse connection to avoid too many connections
  if (!globalForPrisma.prisma) {
    if (!globalForPrisma.pool) {
      globalForPrisma.pool = new Pool({
        connectionString,
        max: 10,
        min: 1,
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 2000,
        maxUses: 7500,
      });
    }
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };