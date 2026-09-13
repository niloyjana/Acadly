import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const deleted = await prisma.event.deleteMany({});
  console.log(`Deleted ${deleted.count} event(s).`);
}
main().finally(() => prisma.$disconnect());
