const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { runCode } = require('./codeExecutor');

async function runEndToEndVerification() {
  console.log('=== STARTING END-TO-END CODING MODULE VERIFICATION ===');
  
  // Find a test recruiter and student in the DB to associate records with
  const recruiter = await prisma.recruiter.findFirst({
    include: { user: true }
  });
  const student = await prisma.student.findFirst({
    include: { user: true }
  });

  if (!recruiter || !student) {
    console.error('❌ Skipping integration test: Please register at least one student and one recruiter in the database first.');
    return;
  }

  console.log(`Using Recruiter: ${recruiter.user.fullName} (${recruiter.id})`);
  console.log(`Using Student: ${student.user.fullName} (${student.id})`);

  let assessment = null;
  let problem = null;
  let attempt = null;

  try {
    // 1. Recruiter creates a coding assessment
    console.log('\nStep 1: Recruiter creates a coding assessment...');
    assessment = await prisma.codingAssessment.create({
      data: {
        recruiterId: recruiter.id,
        name: 'Algorithms & Data Structures Verification',
        description: 'Verification test for sandbox compilation and grading logic.',
        instructions: 'Solve the problem within 30 minutes.',
        duration: 30,
        status: 'DRAFT'
      }
    });
    console.log(`✅ Created Coding Assessment: "${assessment.name}" (ID: ${assessment.id})`);

    // 2. Recruiter adds a coding problem with 1 public and 1 private test case
    console.log('\nStep 2: Recruiter adds a coding problem with test cases...');
    problem = await prisma.codingProblem.create({
      data: {
        codingAssessmentId: assessment.id,
        title: 'Sum of Array Elements',
        statement: 'Write a program that reads an integer N, then space-separated integers, and prints their sum.',
        description: 'Use basic loop iteration.',
        difficulty: 'EASY',
        inputFormat: 'N followed by space separated integers',
        outputFormat: 'Single sum integer',
        constraints: 'N <= 100',
        examples: [{ input: '3\n1 2 3', output: '6', explanation: '1+2+3 = 6' }],
        sampleInput: '3\n1 2 3',
        sampleOutput: '6',
        marks: 20.0,
        supportedLanguages: ['PYTHON', 'JAVA'],
        pythonStarterCode: 'import sys\n# Write Python code here',
        javaStarterCode: 'import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    // Write Java code here\n  }\n}'
      }
    });

    // Create 1 public test case and 1 hidden/private test case
    const tc1 = await prisma.codingTestCase.create({
      data: {
        codingProblemId: problem.id,
        input: '4\n10 20 30 40',
        expectedOutput: '100',
        isPublic: true,
        marks: 1.0
      }
    });

    const tc2 = await prisma.codingTestCase.create({
      data: {
        codingProblemId: problem.id,
        input: '5\n1 1 1 1 1',
        expectedOutput: '5',
        isPublic: false,
        marks: 3.0 // Hidden test case carries 3x weight
      }
    });

    console.log(`✅ Created Coding Problem: "${problem.title}" (ID: ${problem.id})`);
    console.log(`✅ Created Public Test Case (ID: ${tc1.id}) and Hidden Test Case (ID: ${tc2.id})`);

    // 3. Student starts attempt
    console.log('\nStep 3: Student starts coding attempt...');
    attempt = await prisma.codingAttempt.create({
      data: {
        codingAssessmentId: assessment.id,
        studentId: student.id,
        status: 'IN_PROGRESS',
        score: 0.0
      }
    });
    console.log(`✅ Started Coding Attempt (ID: ${attempt.id})`);

    // 4. Student saves draft code
    console.log('\nStep 4: Student saves code draft...');
    const draftCode = `
import sys
lines = sys.stdin.read().split()
if lines:
    n = int(lines[0])
    arr = [int(x) for x in lines[1:]]
    print(sum(arr))
`;
    const draft = await prisma.codingAutosave.upsert({
      where: {
        studentId_codingProblemId: {
          studentId: student.id,
          codingProblemId: problem.id
        }
      },
      update: { code: draftCode, language: 'PYTHON' },
      create: {
        studentId: student.id,
        codingProblemId: problem.id,
        language: 'PYTHON',
        code: draftCode
      }
    });
    console.log(`✅ Autosaved code draft successfully (Lang: ${draft.language})`);

    // 5. Student runs code against public test cases
    console.log('\nStep 5: Student runs code against public test cases...');
    const publicTestCases = await prisma.codingTestCase.findMany({
      where: { codingProblemId: problem.id, isPublic: true }
    });

    let publicPassedCount = 0;
    for (const tc of publicTestCases) {
      console.log(`Running on Input:\n${tc.input}`);
      const runResult = await runCode('PYTHON', draftCode, tc.input);
      const passed = runResult.success && runResult.output.trim() === tc.expectedOutput.trim();
      console.log(`Result Status: ${runResult.status}`);
      console.log(`Result Output: ${runResult.output.trim()} (Expected: ${tc.expectedOutput.trim()})`);
      console.log(`Passed: ${passed}`);
      if (passed) publicPassedCount++;
    }
    console.log(`✅ Public tests summary: passed ${publicPassedCount} / ${publicTestCases.length}`);

    // 6. Student submits code solution (executes public + hidden test cases, calculates score)
    console.log('\nStep 6: Student submits code solution...');
    const allTestCases = await prisma.codingTestCase.findMany({
      where: { codingProblemId: problem.id }
    });

    let totalWeight = 0;
    let passedWeight = 0;
    let testsPassed = 0;

    for (const tc of allTestCases) {
      totalWeight += tc.marks;
      const runResult = await runCode('PYTHON', draftCode, tc.input);
      const passed = runResult.success && runResult.output.trim() === tc.expectedOutput.trim();
      if (passed) {
        testsPassed++;
        passedWeight += tc.marks;
      }
    }

    const marksObtained = totalWeight > 0 ? (passedWeight / totalWeight) * problem.marks : 0;
    console.log(`Tests Passed: ${testsPassed} / ${allTestCases.length}`);
    console.log(`Passed Weight: ${passedWeight} / ${totalWeight}`);
    console.log(`Calculated Score: ${marksObtained} / ${problem.marks}`);

    const submission = await prisma.codingSubmission.create({
      data: {
        codingAttemptId: attempt.id,
        codingProblemId: problem.id,
        language: 'PYTHON',
        code: draftCode,
        marksObtained: parseFloat(marksObtained.toFixed(2)),
        testsPassed,
        totalTests: allTestCases.length,
        status: 'SUCCESS',
        executionTime: 0.1
      }
    });

    await prisma.codingAttempt.update({
      where: { id: attempt.id },
      data: { score: parseFloat(marksObtained.toFixed(2)) }
    });
    console.log(`✅ Solution submission saved (ID: ${submission.id})`);

    // 7. Student completes coding assessment attempt
    console.log('\nStep 7: Student completes coding assessment...');
    const completedAttempt = await prisma.codingAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        timeTaken: 120,
        passed: true
      }
    });
    console.log(`✅ Final Coding Attempt Status: ${completedAttempt.status}`);
    console.log(`✅ Overall Score Recorded: ${completedAttempt.score} marks`);

    // 8. Recruiter views results
    console.log('\nStep 8: Recruiter views results...');
    const results = await prisma.codingAttempt.findMany({
      where: { codingAssessmentId: assessment.id },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        submissions: true
      }
    });
    console.log(`✅ Recruiter results list size: ${results.length} attempts found.`);
    results.forEach(r => {
      console.log(`- Candidate: ${r.student.user.fullName} | Score: ${r.score} marks | Status: ${r.status}`);
    });

  } catch (err) {
    console.error('❌ Error during E2E verification:', err);
  } finally {
    // CLEANUP - Remove test entities from DB
    console.log('\nCleaning up verification records from database...');
    try {
      if (attempt) {
        await prisma.codingSubmission.deleteMany({ where: { codingAttemptId: attempt.id } });
        await prisma.codingAttempt.delete({ where: { id: attempt.id } });
      }
      if (problem) {
        await prisma.codingTestCase.deleteMany({ where: { codingProblemId: problem.id } });
        await prisma.codingProblem.delete({ where: { id: problem.id } });
      }
      if (assessment) {
        await prisma.codingAssessment.delete({ where: { id: assessment.id } });
      }
      await prisma.codingAutosave.deleteMany({
        where: { studentId: student.id }
      });
      console.log('✅ DB cleaned up successfully.');
    } catch (cleanErr) {
      console.error('Error during cleanup:', cleanErr.message);
    }
  }

  console.log('\n=== E2E CODING MODULE VERIFICATION COMPLETED ===');
}

runEndToEndVerification();
