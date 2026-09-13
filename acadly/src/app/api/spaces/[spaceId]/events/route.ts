import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, can, ForbiddenError } from "@/lib/permissions";

const CreateEventSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  category: z.enum(["MEETING", "EVENT", "DEADLINE", "REHEARSAL", "ANNOUNCEMENT"]).default("MEETING"),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().max(120).optional(),
  reminderOffsetsMins: z.array(z.number().int().positive()).optional(),
});

// GET /api/spaces/:spaceId/events?from=&to= — only visible to active members (PRD §15: private group events)
export async function GET(req: Request, { params }: { params: { spaceId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    await requireMembership(params.spaceId, userId);

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const events = await prisma.event.findMany({
      where: {
        spaceId: params.spaceId,
        ...(from || to
          ? {
              startTime: {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
              },
            }
          : {}),
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ events });
  });
}

// POST /api/spaces/:spaceId/events — Core Organizer and above
export async function POST(req: Request, { params }: { params: { spaceId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const membership = await requireMembership(params.spaceId, userId);
    if (!can.createEvent(membership.role)) {
      throw new ForbiddenError("Only Core Organizers and the Owner can create events.");
    }

    const body = CreateEventSchema.parse(await req.json());
    if (new Date(body.endTime) <= new Date(body.startTime)) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 422 });
    }

    const event = await prisma.event.create({
      data: {
        spaceId: params.spaceId,
        title: body.title,
        description: body.description,
        category: body.category,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        location: body.location,
        createdById: userId,
        reminderOffsetsMins: body.reminderOffsetsMins ?? [10080, 1440],
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  });
}
