import { PrismaClient } from "@prisma/client";

// Prevents exhausting Supabase's connection pool during Next.js hot reload
// in development, where each file save would otherwise spin up a new client.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
