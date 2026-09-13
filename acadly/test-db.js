const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log("DB connection successful!", user);
  } catch (err) {
    console.error("DB error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
