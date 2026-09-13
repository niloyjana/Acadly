import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, can, ForbiddenError, NotFoundError } from "@/lib/permissions";
import { applyApprovalPoints } from "@/lib/scoring";

const ReviewSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION"]),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  exceptional: z.boolean().default(false), // reviewer flags a standout submission for the +15 point tier
});

export async function POST(req: Request, { params }: { params: { submissionId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const submission = await prisma.submission.findUnique({
      where: { id: params.submissionId },
      include: { task: true },
    });
    if (!submission) throw new NotFoundError("Submission not found.");

    const membership = await requireMembership(submission.task.spaceId, userId);
    if (!can.reviewSubmission(membership.role)) {
      throw new ForbiddenError("Only Team Leads, Core Organizers, and the Owner can review submissions.");
    }

    const body = ReviewSchema.parse(await req.json());

    if (body.decision === "APPROVE") {
      const pointsAwarded = await applyApprovalPoints({
        taskId: submission.task.id,
        submissionId: submission.id,
        exceptional: body.exceptional,
      });
      await prisma.submission.update({
        where: { id: submission.id },
        data: { rating: body.rating, reviewerComment: body.comment, reviewerId: userId },
      });
      await prisma.notification.create({
        data: {
          userId: submission.userId,
          type: "SUBMISSION_REVIEWED",
          title: "Submission approved",
          message: `"${submission.task.title}" was approved${pointsAwarded ? ` (+${pointsAwarded} pts)` : ""}.`,
          relatedSpaceId: submission.task.spaceId,
          relatedId: submission.id,
        },
      });
      return NextResponse.json({ status: "APPROVED", pointsAwarded });
    }

    // REJECT / REQUEST_REVISION — no points change, task goes back for another attempt
    const nextStatus = body.decision === "REJECT" ? "REJECTED" : "REVISION_REQUESTED";
    const nextTaskStatus = body.decision === "REJECT" ? "ASSIGNED" : "REVISION_REQUIRED";

    await prisma.$transaction([
      prisma.submission.update({
        where: { id: submission.id },
        data: { status: nextStatus, rating: body.rating, reviewerComment: body.comment, reviewerId: userId, reviewedAt: new Date() },
      }),
      prisma.task.update({ where: { id: submission.task.id }, data: { status: nextTaskStatus } }),
      prisma.notification.create({
        data: {
          userId: submission.userId,
          type: "SUBMISSION_REVIEWED",
          title: body.decision === "REJECT" ? "Submission rejected" : "Revision requested",
          message: body.comment ?? `Feedback was left on "${submission.task.title}".`,
          relatedSpaceId: submission.task.spaceId,
          relatedId: submission.id,
        },
      }),
    ]);

    return NextResponse.json({ status: nextStatus });
  });
}
