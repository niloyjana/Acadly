import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, can } from "@/lib/permissions";

// GET /api/spaces/:spaceId/members — active members visible to everyone in the space;
// pending requests only visible to approvers (PRD §11)
export async function GET(_req: Request, { params }: { params: { spaceId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const membership = await requireMembership(params.spaceId, userId);

    const active = await prisma.spaceMember.findMany({
      where: { spaceId: params.spaceId, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { joinedAt: "asc" },
    });

    let pending: typeof active = [];
    if (can.approveMembers(membership.role)) {
      pending = await prisma.spaceMember.findMany({
        where: { spaceId: params.spaceId, status: "PENDING" },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { requestedAt: "asc" },
      });
    }

    return NextResponse.json({ active, pending });
  });
}
