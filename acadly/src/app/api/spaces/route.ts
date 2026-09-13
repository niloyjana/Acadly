import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

const CreateSpaceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  category: z.string().max(60).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  approvalRequired: z.boolean().default(true),
});

// GET /api/spaces — every Space the caller belongs to, grouped by membership status
export async function GET() {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const memberships = await prisma.spaceMember.findMany({
      where: { userId },
      include: { space: true },
      orderBy: { requestedAt: "desc" },
    });
    return NextResponse.json({ memberships });
  });
}

// POST /api/spaces — create a Space; creator becomes OWNER immediately (PRD §8)
export async function POST(req: Request) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const body = CreateSpaceSchema.parse(await req.json());

    const space = await prisma.$transaction(async (tx) => {
      const created = await tx.space.create({
        data: {
          name: body.name.trim(),
          description: body.description,
          category: body.category,
          ownerId: userId,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
          approvalRequired: body.approvalRequired,
        },
      });
      await tx.spaceMember.create({
        data: {
          spaceId: created.id,
          userId,
          role: "OWNER",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      });
      return created;
    });

    await logAudit({ spaceId: space.id, actorId: userId, action: "CREATED_SPACE", targetType: "Space", targetId: space.id });

    return NextResponse.json({ space }, { status: 201 });
  });
}
