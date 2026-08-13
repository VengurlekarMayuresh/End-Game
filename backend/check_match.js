const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const apps = await prisma.jobApplication.findMany({
    include: {
      job: { select: { title: true, skills: true } },
      student: { select: { user: { select: { email: true } }, resumeData: true } }
    },
    orderBy: { appliedAt: 'desc' },
    take: 5
  });

  console.dir(apps, { depth: null });
}

check().catch(console.error).finally(() => prisma.$disconnect());
