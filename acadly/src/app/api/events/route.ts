import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";

export async function GET() {
  return withApiErrors(async () => {
    const userId = await requireUserId();

    const memberships = await prisma.spaceMember.findMany({
      where: { userId, status: "ACTIVE" },
      select: { spaceId: true },
    });
    const spaceIds = memberships.map((m) => m.spaceId);

    const events = await prisma.event.findMany({
      where: { spaceId: { in: spaceIds } },
      orderBy: { startTime: "asc" },
      include: { space: { select: { name: true } } },
    });

    return NextResponse.json({ events });
  });
}
