import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, ForbiddenError, NotFoundError } from "@/lib/permissions";
import { wasSubmittedOnTime } from "@/lib/scoring";

const SubmitSchema = z.object({
  note: z.string().max(1000).optional(),
  fileId: z.string().optional(), // uploaded beforehand via /api/files
});

export async function POST(req: Request, { params }: { params: { taskId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const task = await prisma.task.findUnique({ where: { id: params.taskId } });
    if (!task) throw new NotFoundError("Task not found.");

    await requireMembership(task.spaceId, userId);
    if (task.assignedToId !== userId) {
      throw new ForbiddenError("You can only submit work for tasks assigned to you.");
    }
    if (task.status === "COMPLETED") {
      return NextResponse.json({ error: "This task has already been completed and approved." }, { status: 409 });
    }

    const body = SubmitSchema.parse(await req.json());
    const now = new Date();
    const onTime = wasSubmittedOnTime(task, now); // server-side truth, never trust the client (PRD §19)

    const previousVersions = await prisma.submission.count({ where: { taskId: task.id, userId } });

    const submission = await prisma.$transaction(async (tx) => {
      const created = await tx.submission.create({
        data: {
          taskId: task.id,
          userId,
          fileId: body.fileId,
          note: body.note,
          version: previousVersions + 1,
          wasOnTime: onTime,
          submittedAt: now,
        },
      });
      await tx.task.update({ where: { id: task.id }, data: { status: "SUBMITTED" } });
      return created;
    });

    // Notify reviewers (Team Lead+) that a submission is waiting
    const reviewers = await prisma.spaceMember.findMany({
      where: { spaceId: task.spaceId, status: "ACTIVE", role: { in: ["OWNER", "CORE_ORGANIZER", "TEAM_LEAD"] } },
    });
    await prisma.notification.createMany({
      data: reviewers.map((r) => ({
        userId: r.userId,
        type: "SUBMISSION_REVIEWED" as const, // reused type: "a submission needs attention"
        title: "New submission to review",
        message: `A submission was made for "${task.title}".`,
        relatedSpaceId: task.spaceId,
        relatedId: submission.id,
      })),
    });

    return NextResponse.json({ submission }, { status: 201 });
  });
}
