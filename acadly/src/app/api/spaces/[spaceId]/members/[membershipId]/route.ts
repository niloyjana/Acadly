import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, requireRole, can, ForbiddenError, NotFoundError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("APPROVE") }),
  z.object({ action: z.literal("REJECT") }),
  z.object({ action: z.literal("REMOVE") }),
  z.object({
    action: z.literal("SET_ROLE"),
    role: z.enum(["OWNER", "CORE_ORGANIZER", "TEAM_LEAD", "MEMBER", "VIEWER"]),
  }),
]);

export async function PATCH(
  req: Request,
  { params }: { params: { spaceId: string; membershipId: string } }
) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const callerMembership = await requireMembership(params.spaceId, userId);
    const body = ActionSchema.parse(await req.json());

    const target = await prisma.spaceMember.findUnique({ where: { id: params.membershipId } });
    if (!target || target.spaceId !== params.spaceId) throw new NotFoundError("Membership not found.");

    if (body.action === "APPROVE" || body.action === "REJECT") {
      if (!can.approveMembers(callerMembership.role)) {
        throw new ForbiddenError("Only Core Organizers and the Owner can approve membership requests.");
      }
      const updated = await prisma.spaceMember.update({
        where: { id: target.id },
        data:
          body.action === "APPROVE"
            ? { status: "ACTIVE", joinedAt: new Date() }
            : { status: "REJECTED" },
      });
      await prisma.notification.create({
        data: {
          userId: target.userId,
          type: body.action === "APPROVE" ? "ACCESS_APPROVED" : "ACCESS_REJECTED",
          title: body.action === "APPROVE" ? "Request approved" : "Request rejected",
          message:
            body.action === "APPROVE"
              ? "Your membership request was approved. The space is now in your dashboard."
              : "Your membership request was not approved.",
          relatedSpaceId: params.spaceId,
        },
      });
      await logAudit({
        spaceId: params.spaceId,
        actorId: userId,
        action: body.action === "APPROVE" ? "APPROVED_MEMBER" : "REJECTED_MEMBER",
        targetType: "SpaceMember",
        targetId: target.id,
      });
      return NextResponse.json({ membership: updated });
    }

    // REMOVE and SET_ROLE are owner-only management actions (PRD §6.2)
    await requireRole(params.spaceId, userId, "OWNER");

    if (body.action === "REMOVE") {
      if (target.role === "OWNER") throw new ForbiddenError("The space owner cannot be removed.");
      const updated = await prisma.spaceMember.update({
        where: { id: target.id },
        data: { status: "REMOVED" },
      });
      await logAudit({ spaceId: params.spaceId, actorId: userId, action: "REMOVED_MEMBER", targetType: "SpaceMember", targetId: target.id });
      return NextResponse.json({ membership: updated });
    }

    // SET_ROLE
    const updated = await prisma.spaceMember.update({
      where: { id: target.id },
      data: { role: body.role },
    });
    await logAudit({
      spaceId: params.spaceId,
      actorId: userId,
      action: "CHANGED_ROLE",
      targetType: "SpaceMember",
      targetId: target.id,
      metadata: { newRole: body.role },
    });
    return NextResponse.json({ membership: updated });
  });
}
