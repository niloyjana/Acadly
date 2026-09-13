import { prisma } from "@/lib/prisma";
import type { Task } from "@prisma/client";

/**
 * PRD §19: task state must be derived from deadline vs. submission time,
 * and points (§18) are always calculated server-side — never trust a
 * client-sent "on time" flag.
 */
export function wasSubmittedOnTime(task: Pick<Task, "deadline">, submittedAt: Date): boolean {
  return submittedAt.getTime() <= task.deadline.getTime();
}

/**
 * Called when a reviewer approves a submission. Awards points, updates the
 * task status, and rolls the result into the member's denormalized
 * accountability stats (§18) in a single transaction so the dashboard
 * numbers can never drift from the submission history.
 */
export async function applyApprovalPoints(params: {
  taskId: string;
  submissionId: string;
  exceptional: boolean; // reviewer can flag a stand-out submission for the +15 tier
}) {
  const { taskId, submissionId, exceptional } = params;

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({ where: { id: taskId }, include: { assignees: true } });
    const submission = await tx.submission.findUniqueOrThrow({ where: { id: submissionId } });

    let pointsAwarded: number;
    if (!submission.wasOnTime) {
      pointsAwarded = task.latePoints; // §18: submitted late -> 0 by default
    } else {
      pointsAwarded = exceptional ? Math.max(task.points, 15) : task.points;
    }

    await tx.task.update({ where: { id: taskId }, data: { status: "COMPLETED" } });
    await tx.submission.update({
      where: { id: submissionId },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });

    await tx.spaceMember.updateMany({
      where: { spaceId: task.spaceId, userId: submission.userId },
      data: {
        points: { increment: pointsAwarded },
        completedCount: { increment: 1 },
        lateCount: { increment: submission.wasOnTime ? 0 : 1 },
      },
    });

    return pointsAwarded;
  });
}

/**
 * Intended to run on a schedule (PRD §25/45 "Scheduled Notification
 * Architecture"). Sweeps tasks past their deadline with no approved
 * submission, marks them MISSED, and applies the missed-task penalty once.
 * Safe to re-run: only touches tasks still in ASSIGNED/IN_PROGRESS/OVERDUE.
 */
export async function sweepMissedTasks(gracePeriodHours = 0) {
  const cutoff = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000);

  const overdue = await prisma.task.findMany({
    where: {
      deadline: { lt: cutoff },
      status: { in: ["ASSIGNED", "IN_PROGRESS", "OVERDUE"] },
    },
    include: { assignees: true }
  });

  for (const task of overdue) {
    await prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { id: task.id }, data: { status: "MISSED" } });
      if (task.assignees.length > 0) {
        await tx.spaceMember.updateMany({
          where: { spaceId: task.spaceId, userId: { in: task.assignees.map(a => a.id) } },
          data: { points: { increment: task.missedPoints }, missedCount: { increment: 1 } },
        });
      }
    });
  }

  return overdue.length;
}
