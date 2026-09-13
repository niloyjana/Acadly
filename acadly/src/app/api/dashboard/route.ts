import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";

export async function GET() {
  return withApiErrors(async () => {
    const userId = await requireUserId();

    const memberships = await prisma.spaceMember.findMany({
      where: { userId, status: "ACTIVE" },
      include: { space: true },
    });
    const spaceIds = memberships.map((m) => m.spaceId);
    const totalPoints = memberships.reduce((sum, m) => sum + m.points, 0);

    const [myTasks, upcomingEvents] = await Promise.all([
      prisma.task.findMany({
        where: { spaceId: { in: spaceIds }, assignedToId: userId },
        orderBy: { deadline: "asc" },
      }),
      prisma.event.findMany({
        where: { spaceId: { in: spaceIds }, startTime: { gte: new Date() } },
        orderBy: { startTime: "asc" },
        take: 10,
        include: { space: { select: { name: true } } },
      }),
    ]);

    const pendingTasks = myTasks.filter((t) =>
      ["ASSIGNED", "IN_PROGRESS", "REVISION_REQUIRED", "OVERDUE"].includes(t.status)
    );

    return NextResponse.json({
      totalTasks: myTasks.length,
      pendingTasks: pendingTasks.length,
      totalPoints,
      spaces: memberships.map((m) => ({ id: m.space.id, name: m.space.name, role: m.role })),
      upcomingEvents,
      tasks: myTasks.slice(0, 8),
    });
  });
}
