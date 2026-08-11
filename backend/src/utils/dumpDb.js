const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dump() {
  console.log('=== DUMPING CODING ASSESSMENTS & PROBLEMS ===');
  const assessments = await prisma.codingAssessment.findMany({
    include: {
      problems: {
        include: { testCases: true }
      },
      attempts: {
        include: {
          student: { include: { user: true } }
        }
      }
    }
  });

  console.log(`Total Assessments: ${assessments.length}`);
  assessments.forEach(a => {
    console.log(`\nAssessment: "${a.name}" (${a.id})`);
    console.log(`Status: ${a.status} | Duration: ${a.duration}`);
    console.log(`Problems: ${a.problems.length}`);
    a.problems.forEach(p => {
      console.log(`  - Problem: "${p.title}" (${p.id}) | Marks: ${p.marks}`);
      console.log(`    Test Cases: ${p.testCases.length}`);
    });
    console.log(`Attempts: ${a.attempts.length}`);
    a.attempts.forEach(att => {
      console.log(`  - Student: ${att.student?.user?.fullName} | Status: ${att.status} | Score: ${att.score}`);
    });
  });
  console.log('\n=== DUMP COMPLETED ===');
}

dump().finally(() => prisma.$disconnect());
