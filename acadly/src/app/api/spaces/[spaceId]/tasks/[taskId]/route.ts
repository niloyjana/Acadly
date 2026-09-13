import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, can, ForbiddenError } from "@/lib/permissions";

// DELETE /api/spaces/:spaceId/tasks/:taskId
export async function DELETE(
  req: Request,
  { params }: { params: { spaceId: string; taskId: string } }
) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const membership = await requireMembership(params.spaceId, userId);

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Allow if space owner/core organizer OR if they created the task
    const isHighRank = can.manageSpace(membership.role); // OWNER, CORE_ORGANIZER
    const isCreator = task.createdById === userId;

    if (!isHighRank && !isCreator) {
      throw new ForbiddenError(
        "Only the task creator or high-ranking members can delete this task."
      );
    }

    await prisma.task.delete({
      where: { id: params.taskId },
    });

    return NextResponse.json({ success: true });
  });
}
