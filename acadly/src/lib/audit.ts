import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** PRD §32: administrative actions must be recorded for security/dispute resolution. */
export async function logAudit(params: {
  spaceId?: string;
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({ data: params });
}
