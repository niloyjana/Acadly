import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireRole, ForbiddenError } from "@/lib/permissions";
import { generateInviteCode, hashCode } from "@/lib/invite-code";
import { logAudit } from "@/lib/audit";

const IssueCodeSchema = z.object({
  expiresInDays: z.number().min(1).max(365).optional(),
  maxUses: z.number().min(1).max(10000).optional(),
});

// GET /api/spaces/:spaceId/invite-code — current active code (owner only; codes aren't public)
export async function GET(_req: Request, { params }: { params: { spaceId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const membership = await requireRole(params.spaceId, userId, "OWNER");
    if (membership.role !== "OWNER") throw new ForbiddenError("Only the space owner can view invite codes.");

    const active = await prisma.inviteCode.findFirst({
      where: { spaceId: params.spaceId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ inviteCode: active });
  });
}

// POST /api/spaces/:spaceId/invite-code — issue a new code, revoking any previous active one (PRD §9: "Regenerating a code invalidates the previous code")
export async function POST(req: Request, { params }: { params: { spaceId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    await requireRole(params.spaceId, userId, "OWNER");
    const body = IssueCodeSchema.parse(await req.json().catch(() => ({})));

    const code = await prisma.$transaction(async (tx) => {
      await tx.inviteCode.updateMany({
        where: { spaceId: params.spaceId, status: "ACTIVE" },
        data: { status: "REVOKED" },
      });

      const plainCode = generateInviteCode();
      return tx.inviteCode.create({
        data: {
          spaceId: params.spaceId,
          code: plainCode,
          codeHash: hashCode(plainCode),
          expiresAt: body.expiresInDays
            ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
            : undefined,
          maxUses: body.maxUses,
          createdById: userId,
        },
      });
    });

    await logAudit({
      spaceId: params.spaceId,
      actorId: userId,
      action: "REGENERATED_INVITE_CODE",
      targetType: "InviteCode",
      targetId: code.id,
    });

    return NextResponse.json({ inviteCode: code }, { status: 201 });
  });
}
