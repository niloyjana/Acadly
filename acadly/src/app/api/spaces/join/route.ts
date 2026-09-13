import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { hashCode, normalizeCode } from "@/lib/invite-code";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const JoinSchema = z.object({ code: z.string().min(6).max(20) });

export async function POST(req: Request) {
  return withApiErrors(async () => {
    const ip = getClientIp(req);
    const { success } = await checkRateLimit(`join:${ip}`);
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Please try again in a minute." }, { status: 429 });
    }

    const userId = await requireUserId();
    const { code } = JoinSchema.parse(await req.json());
    const codeHash = hashCode(normalizeCode(code));

    const invite = await prisma.inviteCode.findFirst({
      where: { codeHash },
      include: { space: true },
    });

    // PRD §10 verification order: exists -> active -> not expired -> under usage limit -> not already a member
    if (!invite) {
      return NextResponse.json({ error: "That invite code doesn't exist." }, { status: 404 });
    }
    if (invite.status !== "ACTIVE") {
      return NextResponse.json({ error: "This invite code is no longer active." }, { status: 410 });
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      await prisma.inviteCode.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
      return NextResponse.json({ error: "This invite code has expired." }, { status: 410 });
    }
    if (invite.maxUses !== null && invite.usageCount >= invite.maxUses) {
      return NextResponse.json({ error: "This invite code has reached its usage limit." }, { status: 410 });
    }

    const existing = await prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId: invite.spaceId, userId } },
    });
    if (existing) {
      if (existing.status === "PENDING") {
        return NextResponse.json({ error: "You already have a pending request for this space." }, { status: 409 });
      }
      if (existing.status === "ACTIVE") {
        return NextResponse.json({ error: "You're already a member of this space." }, { status: 409 });
      }
      // REJECTED/REMOVED -> allow a fresh request by falling through
    }

    const autoApprove = !invite.space.approvalRequired;

    const membership = await prisma.$transaction(async (tx) => {
      const res = await tx.inviteCode.updateMany({
        where: { id: invite.id, ...(invite.maxUses !== null && { usageCount: { lt: invite.maxUses } }) },
        data: { usageCount: { increment: 1 } }
      });
      if (res.count === 0) {
        throw new Error("This invite code has reached its usage limit.");
      }

      const data = {
        role: "MEMBER" as const,
        status: (autoApprove ? "ACTIVE" : "PENDING") as "ACTIVE" | "PENDING",
        joinedAt: autoApprove ? new Date() : null,
        requestedAt: new Date(),
      };

      return existing
        ? tx.spaceMember.update({ where: { id: existing.id }, data })
        : tx.spaceMember.create({ data: { ...data, spaceId: invite.spaceId, userId } });
    });

    // Notify the owner + core organizers that a request is waiting (PRD §24: ACCESS_REQUEST)
    if (!autoApprove) {
      const approvers = await prisma.spaceMember.findMany({
        where: { spaceId: invite.spaceId, status: "ACTIVE", role: { in: ["OWNER", "CORE_ORGANIZER"] } },
      });
      await prisma.notification.createMany({
        data: approvers.map((a) => ({
          userId: a.userId,
          type: "ACCESS_REQUEST" as const,
          title: "New membership request",
          message: `Someone requested to join ${invite.space.name}.`,
          relatedSpaceId: invite.spaceId,
        })),
      });
    }

    return NextResponse.json({
      membership,
      message: autoApprove
        ? "You've joined the space."
        : "Access request submitted. A group administrator must approve your request.",
    });
  });
}
