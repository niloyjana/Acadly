import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, can, ForbiddenError } from "@/lib/permissions";

// DELETE /api/spaces/:spaceId/events/:eventId
export async function DELETE(
  _req: Request,
  { params }: { params: { spaceId: string; eventId: string } }
) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const membership = await requireMembership(params.spaceId, userId);
    if (!can.createEvent(membership.role)) {
      throw new ForbiddenError("Only Core Organizers and the Owner can delete events.");
    }
    await prisma.event.delete({ where: { id: params.eventId } });
    return NextResponse.json({ ok: true });
  });
}
