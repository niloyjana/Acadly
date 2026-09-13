const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "niloyjana2005@gmail.com" }
    });
    if (user) {
      console.log("User found:", user.email);
    } else {
      console.log("User not found!");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
