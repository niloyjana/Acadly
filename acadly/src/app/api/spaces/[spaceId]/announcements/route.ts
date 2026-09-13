import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, requireRole, can, ForbiddenError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const AnnouncementSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title must be 200 characters or fewer."),
  body: z.string().trim().min(1, "Body is required.").max(5000, "Body must be 5000 characters or fewer."),
});

export async function POST(req: Request, { params }: { params: { spaceId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const membership = await requireMembership(params.spaceId, userId);

    if (!can.manageSpace(membership.role) && !can.createEvent(membership.role)) {
      throw new ForbiddenError("You do not have permission to post announcements.");
    }

    const parsed = AnnouncementSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const { title, body } = parsed.data;

    const announcement = await prisma.announcement.create({
      data: {
        spaceId: params.spaceId,
        authorId: userId,
        title,
        body,
      },
    });

    await logAudit({
      spaceId: params.spaceId,
      actorId: userId,
      action: "ANNOUNCEMENT_CREATE",
      targetType: "Announcement",
      targetId: announcement.id,
      metadata: { title },
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
          select: { name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(announcements);
  });
}
