import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, can, ForbiddenError } from "@/lib/permissions";

const CreateTaskSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  assignedToId: z.string().optional(),
  deadline: z.string().datetime(),
  points: z.number().int().min(0).max(100).default(10),
  latePoints: z.number().int().default(0),
  missedPoints: z.number().int().max(0).default(-5),
});

// GET /api/spaces/:spaceId/tasks — members see their own; Team Lead+ see all (PRD §17-18)
export async function GET(req: Request, { params }: { params: { spaceId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const membership = await requireMembership(params.spaceId, userId);

    const seeAll = can.reviewSubmission(membership.role); // Team Lead and above
    const tasks = await prisma.task.findMany({
      where: {
        spaceId: params.spaceId,
        ...(seeAll ? {} : { assignedToId: userId }),
      },
      include: { 
        assignedTo: { select: { id: true, name: true } }, 
        submissions: { orderBy: { submittedAt: "desc" }, take: 1, include: { file: true } } 
      },
      orderBy: { deadline: "asc" },
    });

    return NextResponse.json({ 
      tasks, 
      currentUserId: userId,
      currentUserRole: membership.role 
    });
  });
}

// POST /api/spaces/:spaceId/tasks — Team Lead and above can assign tasks
export async function POST(req: Request, { params }: { params: { spaceId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const membership = await requireMembership(params.spaceId, userId);
    if (!can.createTask(membership.role)) {
      throw new ForbiddenError("Only Team Leads, Core Organizers, and the Owner can create tasks.");
    }

    const body = CreateTaskSchema.parse(await req.json());

    if (body.assignedToId) {
      const assigneeMembership = await prisma.spaceMember.findFirst({
        where: { spaceId: params.spaceId, userId: body.assignedToId, status: "ACTIVE" },
      });
      if (!assigneeMembership) {
        return NextResponse.json(
          { error: "You can only assign tasks to active members of this space." },
          { status: 422 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        spaceId: params.spaceId,
        title: body.title,
        description: body.description,
        assignedToId: body.assignedToId,
        createdById: userId,
        deadline: new Date(body.deadline),
        points: body.points,
        latePoints: body.latePoints,
        missedPoints: body.missedPoints,
      },
    });

    if (body.assignedToId) {
      await prisma.notification.create({
        data: {
          userId: body.assignedToId,
          type: "TASK_ASSIGNED",
          title: "New task assigned",
          message: `You were assigned "${task.title}", due ${task.deadline.toDateString()}.`,
          relatedSpaceId: params.spaceId,
          relatedId: task.id,
        },
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  });
}
