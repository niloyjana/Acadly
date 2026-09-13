const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`INSERT INTO storage.buckets (id, name, public) VALUES ('acadly-files', 'acadly-files', true) ON CONFLICT DO NOTHING;`);
  console.log('Bucket created!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
