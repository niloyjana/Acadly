import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateInviteCode, hashCode } from "../src/lib/invite-code";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const owner = await prisma.user.upsert({
    where: { email: "niloy@acadly.dev" },
    update: {},
    create: { name: "Niloy Jana", email: "niloy@acadly.dev", passwordHash },
  });

  const member = await prisma.user.upsert({
    where: { email: "anuvab@acadly.dev" },
    update: {},
    create: { name: "Anuvab Roy", email: "anuvab@acadly.dev", passwordHash },
  });

  const space = await prisma.space.upsert({
    where: { id: "seed-farewell-2026" },
    update: {},
    create: {
      id: "seed-farewell-2026",
      name: "Farewell 2026",
      description: "Fourth-year farewell organizing committee",
      category: "College Event",
      ownerId: owner.id,
    },
  });

  await prisma.spaceMember.upsert({
    where: { spaceId_userId: { spaceId: space.id, userId: owner.id } },
    update: {},
    create: { spaceId: space.id, userId: owner.id, role: "OWNER", status: "ACTIVE", joinedAt: new Date() },
  });
  await prisma.spaceMember.upsert({
    where: { spaceId_userId: { spaceId: space.id, userId: member.id } },
    update: {},
    create: { spaceId: space.id, userId: member.id, role: "MEMBER", status: "ACTIVE", joinedAt: new Date() },
  });

  const plainCode = generateInviteCode();
  await prisma.inviteCode.create({
    data: {
      spaceId: space.id,
      code: plainCode,
      codeHash: hashCode(plainCode),
      createdById: owner.id,
      maxUses: 50,
    },
  });

  await prisma.task.create({
    data: {
      spaceId: space.id,
      title: "Design Freshers Poster",
      assignees: { connect: { id: member.id } },
      createdById: owner.id,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      points: 10,
    },
  });

  await prisma.event.create({
    data: {
      spaceId: space.id,
      title: "Core Committee Meeting",
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      location: "Auditorium",
      createdById: owner.id,
    },
  });

  console.log("Seeded. Log in with niloy@acadly.dev / password123");
  console.log("Invite code:", plainCode);
}

main().finally(() => prisma.$disconnect());
