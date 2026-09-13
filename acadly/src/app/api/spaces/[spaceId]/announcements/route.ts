import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, requireRole, can, ForbiddenError } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: { spaceId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const membership = await requireMembership(params.spaceId, userId);

    if (!can.manageSpace(membership.role) && !can.createEvent(membership.role)) {
      throw new ForbiddenError("You do not have permission to post announcements.");
    }

    const { title, body } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        spaceId: params.spaceId,
        authorId: userId,
        title,
        body,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  });
}

export async function GET(req: Request, { params }: { params: { spaceId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    await requireMembership(params.spaceId, userId);

    const announcements = await prisma.announcement.findMany({
      where: { spaceId: params.spaceId },
      include: {
        author: {
          select: { name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(announcements);
  });
}
