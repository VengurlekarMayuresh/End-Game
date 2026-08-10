const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function find() {
  const attemptId = 'ad013282-b273-4cce-ac34-1b8d2ad87838';
  console.log(`=== FINDING ATTEMPT: ${attemptId} ===`);
  
  const attempt = await prisma.codingAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: { include: { user: true } }
    }
  });

  if (!attempt) {
    console.log('❌ Attempt not found in DB!');
  } else {
    console.log('✅ Attempt found!');
    console.log(`Student ID: ${attempt.studentId}`);
    console.log(`Student Name: ${attempt.student?.user?.fullName}`);
    console.log(`Student Email: ${attempt.student?.user?.email}`);
    console.log(`Status: ${attempt.status}`);
  }

  console.log('\n=== LISTING ALL ACTIVE STUDENTS ===');
  const students = await prisma.student.findMany({
    include: { user: true }
  });
  students.forEach(s => {
    console.log(`Student Name: ${s.user.fullName} | Student ID: ${s.id} | User ID: ${s.userId}`);
  });
}

find().finally(() => prisma.$disconnect());
