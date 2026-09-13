import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, can, ForbiddenError } from "@/lib/permissions";

export async function GET(req: Request, { params }: { params: { spaceId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const membership = await requireMembership(params.spaceId, userId);

    if (!can.reviewSubmission(membership.role)) {
      throw new ForbiddenError("Only organizers can view pending submissions.");
    }

    const pendingSubmissions = await prisma.submission.findMany({
      where: {
        status: "PENDING_REVIEW",
        task: { spaceId: params.spaceId },
      },
      include: {
        task: true,
        user: { select: { name: true, id: true } },
        file: true,
      },
      orderBy: { submittedAt: "asc" },
    });

    return NextResponse.json({ pendingSubmissions });
  });
}
