const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { runCode } = require('../utils/codeExecutor');
const { hasMailerConfig, sendMail, buildDecisionEmail } = require('../utils/mailer');
const proctoringCtrl = require('./proctoring.controller');

// Helper to check if error is due to database missing tables/columns
const isDbTableMissingError = (err) => {
  return err.code === 'P2021' || err.code === 'P2022' || err.message?.includes('relation') || err.message?.includes('does not exist');
};

// Helper: Check Aptitude Prerequisite
const checkAptitudePrerequisite = async (studentId, jobId) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { testId: true }
  });

  if (!job || !job.testId) {
    return { passed: true };
  }

  const testAttempt = await prisma.testAttempt.findFirst({
    where: {
      studentId,
      testId: job.testId,
      passed: true,
      status: { in: ['COMPLETED', 'AUTO_SUBMITTED'] }
    }
  });

  if (testAttempt) {
    return { passed: true, score: testAttempt.score, percentage: testAttempt.percentage };
  }

  const anyAttempt = await prisma.testAttempt.findFirst({
    where: {
      studentId,
      testId: job.testId,
      status: { in: ['COMPLETED', 'AUTO_SUBMITTED'] }
    },
    orderBy: { score: 'desc' }
  });

  return {
    passed: false,
    reason: anyAttempt ? 'FAILED_APTITUDE' : 'NO_APTITUDE_ATTEMPT',
    details: anyAttempt ? `Failed with ${anyAttempt.percentage}%` : 'Aptitude test not attempted yet'
  };
};

// ─── RECRUITER ASSESSMENTS CRUD ──────────────────────────────────────────────

const createCodingAssessment = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });

    const { name, description, instructions, duration, status } = req.body;
    if (!name || !duration) {
      return res.status(400).json({ message: 'Missing required assessment fields (name, duration)' });
    }

    const assessment = await prisma.codingAssessment.create({
      data: {
        recruiterId: recruiter.id,
        name,
        description: description || null,
        instructions: instructions || null,
        duration: parseInt(duration),
        status: status || 'DRAFT'
      }
    });

    res.status(201).json(assessment);
  } catch (error) { next(error); }
};

const getCodingAssessments = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });

    const assessments = await prisma.codingAssessment.findMany({
      where: { recruiterId: recruiter.id },
      include: {
        jobs: { select: { id: true, title: true } },
        _count: { select: { problems: true, attempts: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(assessments);
  } catch (error) { next(error); }
};

const getCodingAssessmentById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });

    const { id } = req.params;
    const assessment = await prisma.codingAssessment.findFirst({
      where: { id, recruiterId: recruiter.id },
      include: {
        jobs: { select: { id: true, title: true } },
        problems: {
          orderBy: { order: 'asc' },
          include: { testCases: true }
        }
      }
    });

    if (!assessment) return res.status(404).json({ message: 'Coding assessment not found' });
    res.json(assessment);
  } catch (error) { next(error); }
};

const updateCodingAssessment = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });

    const { id } = req.params;
    const { name, description, instructions, duration, status } = req.body;

    const existing = await prisma.codingAssessment.findFirst({
      where: { id, recruiterId: recruiter.id }
    });
    if (!existing) return res.status(404).json({ message: 'Coding assessment not found' });

    const updated = await prisma.codingAssessment.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description : existing.description,
        instructions: instructions !== undefined ? instructions : existing.instructions,
        duration: duration !== undefined ? parseInt(duration) : existing.duration,
        status: status !== undefined ? status : existing.status
      }
    });

    res.json(updated);
  } catch (error) { next(error); }
};

const deleteCodingAssessment = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });

    const { id } = req.params;
    const existing = await prisma.codingAssessment.findFirst({
      where: { id, recruiterId: recruiter.id }
    });
    if (!existing) return res.status(404).json({ message: 'Coding assessment not found' });

    await prisma.codingAssessment.delete({ where: { id } });
    res.json({ message: 'Coding assessment deleted successfully' });
  } catch (error) { next(error); }
};

const duplicateCodingAssessment = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });

    const { id } = req.params;
    const existing = await prisma.codingAssessment.findFirst({
      where: { id, recruiterId: recruiter.id },
      include: {
        problems: {
          include: { testCases: true }
        }
      }
    });
    if (!existing) return res.status(404).json({ message: 'Coding assessment not found' });

    const duplicated = await prisma.codingAssessment.create({
      data: {
        recruiterId: recruiter.id,
        name: `${existing.name} (Copy)`,
        description: existing.description,
        instructions: existing.instructions,
        duration: existing.duration,
        status: 'DRAFT'
      }
    });

    for (const prob of existing.problems) {
      const newProblem = await prisma.codingProblem.create({
        data: {
          codingAssessmentId: duplicated.id,
          title: prob.title,
          statement: prob.statement,
          description: prob.description,
          difficulty: prob.difficulty,
          inputFormat: prob.inputFormat,
          outputFormat: prob.outputFormat,
          constraints: prob.constraints,
          examples: prob.examples || [],
          sampleInput: prob.sampleInput,
          sampleOutput: prob.sampleOutput,
          marks: prob.marks,
          supportedLanguages: prob.supportedLanguages,
          pythonStarterCode: prob.pythonStarterCode,
          javaStarterCode: prob.javaStarterCode,
          order: prob.order,
          status: prob.status
        }
      });

      const tcData = prob.testCases.map(tc => ({
        codingProblemId: newProblem.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isPublic: tc.isPublic,
        marks: tc.marks
      }));

      if (tcData.length > 0) {
        await prisma.codingTestCase.createMany({ data: tcData });
      }
    }

    res.status(201).json(duplicated);
  } catch (error) { next(error); }
};

const publishCodingAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.codingAssessment.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

const archiveCodingAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.codingAssessment.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

const assignCodingAssessmentToJobs = async (req, res, next) => {
  try {
    const { id } = req.params; // codingAssessmentId
    const { jobIds } = req.body;

    if (!Array.isArray(jobIds)) {
      return res.status(400).json({ message: 'jobIds must be an array' });
    }

    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });

    // Remove assignment from jobs that are no longer selected
    await prisma.job.updateMany({
      where: { recruiterId: recruiter.id, codingAssessment: { isNot: null }, id: { notIn: jobIds } },
      data: { codingAssessmentId: null }
    });

    // Assign to selected jobs
    await prisma.job.updateMany({
      where: { recruiterId: recruiter.id, id: { in: jobIds } },
      data: { codingAssessmentId: id }
    });

    res.json({ message: 'Coding assessment successfully assigned to selected jobs' });
  } catch (error) { next(error); }
};

// ─── RECRUITER CODING PROBLEMS CRUD ──────────────────────────────────────────

const createCodingProblem = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const {
      title, statement, description, difficulty, inputFormat, outputFormat,
      constraints, examples, sampleInput, sampleOutput, marks,
      supportedLanguages, pythonStarterCode, javaStarterCode, order, status, testCases
    } = req.body;

    if (!title || !statement || !description || !difficulty || !marks) {
      return res.status(400).json({ message: 'Missing required problem fields' });
    }

    const problem = await prisma.codingProblem.create({
      data: {
        codingAssessmentId: assessmentId,
        title,
        statement,
        description,
        difficulty,
        inputFormat: inputFormat || '',
        outputFormat: outputFormat || '',
        constraints: constraints || '',
        examples: examples || [],
        sampleInput: sampleInput || '',
        sampleOutput: sampleOutput || '',
        marks: parseFloat(marks) || 10.0,
        supportedLanguages: supportedLanguages || ['PYTHON', 'JAVA'],
        pythonStarterCode: pythonStarterCode || null,
        javaStarterCode: javaStarterCode || null,
        order: parseInt(order) || 0,
        status: status || 'ACTIVE'
      }
    });

    if (testCases && Array.isArray(testCases)) {
      const tcData = testCases.map(tc => ({
        codingProblemId: problem.id,
        input: tc.input || '',
        expectedOutput: tc.expectedOutput || '',
        isPublic: tc.isPublic === true || tc.isPublic === 'true',
        marks: parseFloat(tc.marks) || 1.0
      }));
      if (tcData.length > 0) {
        await prisma.codingTestCase.createMany({ data: tcData });
      }
    }

    res.status(201).json(problem);
  } catch (error) { next(error); }
};

const updateCodingProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title, statement, description, difficulty, inputFormat, outputFormat,
      constraints, examples, sampleInput, sampleOutput, marks,
      supportedLanguages, pythonStarterCode, javaStarterCode, order, status, testCases
    } = req.body;

    const existing = await prisma.codingProblem.findUnique({
      where: { id }
    });
    if (!existing) return res.status(404).json({ message: 'Coding problem not found' });

    const updated = await prisma.codingProblem.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        statement: statement !== undefined ? statement : existing.statement,
        description: description !== undefined ? description : existing.description,
        difficulty: difficulty !== undefined ? difficulty : existing.difficulty,
        inputFormat: inputFormat !== undefined ? inputFormat : existing.inputFormat,
        outputFormat: outputFormat !== undefined ? outputFormat : existing.outputFormat,
        constraints: constraints !== undefined ? constraints : existing.constraints,
        examples: examples !== undefined ? examples : (existing.examples || []),
        sampleInput: sampleInput !== undefined ? sampleInput : existing.sampleInput,
        sampleOutput: sampleOutput !== undefined ? sampleOutput : existing.sampleOutput,
        marks: marks !== undefined ? parseFloat(marks) : existing.marks,
        supportedLanguages: supportedLanguages !== undefined ? supportedLanguages : existing.supportedLanguages,
        pythonStarterCode: pythonStarterCode !== undefined ? pythonStarterCode : existing.pythonStarterCode,
        javaStarterCode: javaStarterCode !== undefined ? javaStarterCode : existing.javaStarterCode,
        order: order !== undefined ? parseInt(order) : existing.order,
        status: status !== undefined ? status : existing.status
      }
    });

    if (testCases && Array.isArray(testCases)) {
      // Re-create test cases inside a transaction-like flow (delete and insert)
      await prisma.codingTestCase.deleteMany({ where: { codingProblemId: id } });
      const tcData = testCases.map(tc => ({
        codingProblemId: id,
        input: tc.input || '',
        expectedOutput: tc.expectedOutput || '',
        isPublic: tc.isPublic === true || tc.isPublic === 'true',
        marks: parseFloat(tc.marks) || 1.0
      }));
      if (tcData.length > 0) {
        await prisma.codingTestCase.createMany({ data: tcData });
      }
    }

    res.json(updated);
  } catch (error) { next(error); }
};

const deleteCodingProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.codingProblem.delete({ where: { id } });
    res.json({ message: 'Coding problem deleted successfully' });
  } catch (error) { next(error); }
};

// ─── STUDENT ASSESSMENT ENDPOINTS ────────────────────────────────────────────

const getStudentCodingAssessments = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    // Find applied job IDs
    const applications = await prisma.jobApplication.findMany({
      where: { studentId: student.id },
      select: { jobId: true }
    });
    const jobIds = applications.map(a => a.jobId);

    // Find jobs with Coding Assessments
    const jobsWithCoding = await prisma.job.findMany({
      where: { id: { in: jobIds }, codingAssessment: { isNot: null } },
      select: { codingAssessmentId: true }
    });
    const assessmentIds = jobsWithCoding.map(j => j.codingAssessmentId).filter(Boolean);

    const assessments = await prisma.codingAssessment.findMany({
      where: { id: { in: assessmentIds }, status: { in: ['PUBLISHED', 'DRAFT'] } },
      include: {
        jobs: { where: { id: { in: jobIds } }, select: { id: true, title: true } },
        attempts: { where: { studentId: student.id }, orderBy: { startedAt: 'desc' } }
      }
    });

    const enriched = [];
    for (const ass of assessments) {
      const job = ass.jobs[0];
      const prerequisite = await checkAptitudePrerequisite(student.id, job.id);
      enriched.push({
        ...ass,
        prerequisite
      });
    }

    res.json(enriched);
  } catch (error) { next(error); }
};

const getStudentCodingAssessmentById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const { id } = req.params;
    const assessment = await prisma.codingAssessment.findUnique({
      where: { id },
      include: {
        problems: {
          where: { status: 'ACTIVE' },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            statement: true,
            description: true,
            difficulty: true,
            inputFormat: true,
            outputFormat: true,
            constraints: true,
            examples: true,
            sampleInput: true,
            sampleOutput: true,
            marks: true,
            supportedLanguages: true,
            pythonStarterCode: true,
            javaStarterCode: true,
            order: true,
            testCases: {
              where: { isPublic: true },
              select: { id: true, input: true, expectedOutput: true, isPublic: true }
            }
          }
        },
        attempts: { where: { studentId: student.id } }
      }
    });

    if (!assessment) return res.status(404).json({ message: 'Coding assessment not found' });

    // Validate applicant access
    const applied = await prisma.jobApplication.findFirst({
      where: {
        studentId: student.id,
        job: { codingAssessment: { isNot: null }, codingAssessmentId: id }
      },
      include: { job: { select: { title: true } } }
    });

    if (!applied) {
      return res.status(403).json({ message: 'Access denied: You have not applied to a job associated with this assessment' });
    }

    // Verify sequential aptitude pass before accessing details
    const prereq = await checkAptitudePrerequisite(student.id, applied.jobId);
    if (!prereq.passed) {
      return res.status(403).json({
        message: 'Access denied: You must pass the aptitude stage first.',
        reason: prereq.reason,
        details: prereq.details
      });
    }

    assessment.jobs = [{ id: applied.jobId, title: applied.job.title }];
    res.json(assessment);
  } catch (error) { next(error); }
};

const startCodingAttempt = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const { id } = req.params; // codingAssessmentId

    const assessment = await prisma.codingAssessment.findUnique({
      where: { id },
      include: {
        attempts: { where: { studentId: student.id } }
      }
    });

    if (!assessment) return res.status(404).json({ message: 'Coding assessment not found' });

    const applied = await prisma.jobApplication.findFirst({
      where: {
        studentId: student.id,
        job: { codingAssessment: { isNot: null }, codingAssessmentId: id }
      }
    });
    if (!applied) return res.status(403).json({ message: 'Access denied: Job application not found' });

    // Prerequisite double-check
    const prereq = await checkAptitudePrerequisite(student.id, applied.jobId);
    if (!prereq.passed) {
      return res.status(403).json({ message: 'Access denied: Prerequisite aptitude test not passed' });
    }

    const activeAttempt = assessment.attempts.find(a => a.status === 'IN_PROGRESS');
    if (activeAttempt) {
      return res.json(activeAttempt);
    }

    const completedAttempts = assessment.attempts.filter(a => a.status === 'COMPLETED' || a.status === 'AUTO_SUBMITTED');
    if (completedAttempts.length >= 1) {
      return res.status(400).json({ message: 'You have already submitted this assessment' });
    }

    const attempt = await prisma.codingAttempt.create({
      data: {
        codingAssessmentId: id,
        studentId: student.id,
        status: 'IN_PROGRESS',
        score: 0.0
      }
    });

    res.status(201).json(attempt);
  } catch (error) { next(error); }
};

const saveCodingDraft = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const { problemId } = req.params;
    const { code, language } = req.body;

    const draft = await prisma.codingAutosave.upsert({
      where: {
        studentId_codingProblemId: {
          studentId: student.id,
          codingProblemId: problemId
        }
      },
      update: { code, language, updatedAt: new Date() },
      create: {
        studentId: student.id,
        codingProblemId: problemId,
        language,
        code
      }
    });

    res.json(draft);
  } catch (error) { next(error); }
};

const getCodingDraft = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const { problemId } = req.params;
    const draft = await prisma.codingAutosave.findUnique({
      where: {
        studentId_codingProblemId: {
          studentId: student.id,
          codingProblemId: problemId
        }
      }
    });

    res.json(draft || null);
  } catch (error) { next(error); }
};

const runCodingCode = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'Missing code or language parameter' });
    }

    const problem = await prisma.codingProblem.findUnique({
      where: { id: problemId },
      include: { testCases: { where: { isPublic: true } } }
    });

    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const results = [];
    let allPassed = true;

    for (const tc of problem.testCases) {
      const execResult = await runCode(language, code, tc.input);
      const outputTrimmed = (execResult.output || '').trim();
      const expectedTrimmed = (tc.expectedOutput || '').trim();
      const passed = execResult.success && outputTrimmed === expectedTrimmed;

      if (!passed) allPassed = false;

      results.push({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        output: execResult.output || '',
        success: execResult.success,
        passed,
        status: execResult.status,
        error: execResult.error,
        executionTime: execResult.executionTime
      });
    }

    res.json({
      allPassed,
      results
    });
  } catch (error) { next(error); }
};

const submitCodingCode = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const { id: assessmentId, problemId } = req.params;
    const { code, language, attemptId } = req.body;

    if (!code || !language || !attemptId) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const problem = await prisma.codingProblem.findUnique({
      where: { id: problemId },
      include: { testCases: true }
    });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const attempt = await prisma.codingAttempt.findUnique({
      where: { id: attemptId }
    });
    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ message: 'Assessment attempt is not in progress' });
    }

    let totalWeight = 0;
    let passedWeight = 0;
    let testsPassed = 0;
    const totalTests = problem.testCases.length;
    let avgExecTime = 0;
    let finalStatus = 'SUCCESS';
    let errorMessage = null;

    const studentResults = [];

    for (const tc of problem.testCases) {
      totalWeight += tc.marks;
      const execResult = await runCode(language, code, tc.input);

      const outputTrimmed = (execResult.output || '').trim();
      const expectedTrimmed = (tc.expectedOutput || '').trim();
      const passed = execResult.success && outputTrimmed === expectedTrimmed;

      avgExecTime += execResult.executionTime || 0;

      if (passed) {
        testsPassed++;
        passedWeight += tc.marks;
      }

      if (!execResult.success) {
        finalStatus = execResult.status;
        errorMessage = execResult.error;
      }

      // Hide input/output data for hidden/private test cases
      studentResults.push({
        id: tc.id,
        isPublic: tc.isPublic,
        passed,
        status: execResult.status,
        input: tc.isPublic ? tc.input : null,
        expectedOutput: tc.isPublic ? tc.expectedOutput : null,
        output: tc.isPublic ? (execResult.output || '') : null,
        error: tc.isPublic ? execResult.error : null
      });
    }

    if (totalTests > 0) {
      avgExecTime /= totalTests;
    }

    // Proportional scoring: (passedWeight / totalWeight) * problem.marks
    const marksObtained = totalWeight > 0 ? (passedWeight / totalWeight) * problem.marks : 0;

    // Create coding submission entry
    const submission = await prisma.codingSubmission.create({
      data: {
        codingAttemptId: attemptId,
        codingProblemId: problemId,
        language,
        code,
        marksObtained: parseFloat(marksObtained.toFixed(2)),
        testsPassed,
        totalTests,
        status: finalStatus,
        executionTime: avgExecTime,
        errorMessage
      }
    });

    // Recalculate Attempt total score: sum of maximum submission marks obtained for each problem
    const submissions = await prisma.codingSubmission.findMany({
      where: { codingAttemptId: attemptId }
    });

    // Group by problem and pick highest marksObtained
    const highestMarks = {};
    submissions.forEach(sub => {
      if (!highestMarks[sub.codingProblemId] || sub.marksObtained > highestMarks[sub.codingProblemId]) {
        highestMarks[sub.codingProblemId] = sub.marksObtained;
      }
    });

    const totalScore = Object.values(highestMarks).reduce((a, b) => a + b, 0);

    await prisma.codingAttempt.update({
      where: { id: attemptId },
      data: { score: parseFloat(totalScore.toFixed(2)) }
    });

    res.json({
      submission,
      testsPassed,
      totalTests,
      marksObtained,
      status: finalStatus,
      errorMessage,
      results: studentResults
    });
  } catch (error) { next(error); }
};

const submitCodingAssessment = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const { attemptId } = req.params;
    const { autoSubmitted } = req.body || {};

    const attempt = await prisma.codingAttempt.findUnique({
      where: { id: attemptId, studentId: student.id },
      include: {
        codingAssessment: {
          include: { problems: true }
        }
      }
    });

    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (attempt.status !== 'IN_PROGRESS') {
      return res.json(attempt);
    }

    const completedAt = new Date();
    const timeTaken = Math.round((completedAt - new Date(attempt.startedAt)) / 1000);

    const updated = await prisma.codingAttempt.update({
      where: { id: attemptId },
      data: {
        status: autoSubmitted ? 'AUTO_SUBMITTED' : 'COMPLETED',
        completedAt,
        timeTaken,
        passed: true // in coding, any submission successfully records attempt
      }
    });

    res.json(updated);
  } catch (error) { next(error); }
};

// ─── RECRUITER CODING RESULTS VIEW ────────────────────────────────────────────

const getCodingResults = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });

    const { id: assessmentId } = req.params;

    try {
      const attempts = await prisma.codingAttempt.findMany({
        where: { codingAssessmentId: assessmentId },
        include: {
          student: {
            include: {
              user: { select: { fullName: true, email: true, profilePicture: true } }
            }
          },
          submissions: {
            orderBy: { createdAt: 'desc' },
            include: {
              codingProblem: { select: { id: true, title: true, marks: true } }
            }
          },
          proctoringSession: {
            include: {
              events: true
            }
          }
        },
        orderBy: { completedAt: 'desc' }
      });

      res.json(attempts);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        // Fallback: if table is missing, return attempts mapped with mock proctoring sessions
        const mockAttempts = []; // Or fetch from coding.controller mockAttempts if defined.
        // Let's fallback gracefully
        const filled = mockAttempts.map(att => {
          const procSess = proctoringCtrl.mockProctoringSessions.find(s => s.codingAttemptId === att.id);
          const events = procSess ? proctoringCtrl.mockProctoringEvents.filter(e => e.sessionId === procSess.id) : [];
          return {
            ...att,
            proctoringSession: procSess ? { ...procSess, events } : null
          };
        });
        return res.json(filled);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const sendCodingResultEmails = async (req, res, next) => {
  try {
    if (!hasMailerConfig()) {
      return res.status(400).json({
        message: 'Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM before sending emails.'
      });
    }

    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });

    const { id } = req.params;
    const { threshold } = req.body || {};
    const parsedThreshold = Number(threshold);

    if (!Number.isFinite(parsedThreshold)) {
      return res.status(400).json({ message: 'threshold must be a valid number' });
    }

    const assessment = await prisma.codingAssessment.findFirst({
      where: { id, recruiterId: recruiter.id },
      select: { id: true, name: true, recruiter: { select: { companyName: true } } }
    });

    if (!assessment) return res.status(404).json({ message: 'Coding assessment not found' });

    const attempts = await prisma.codingAttempt.findMany({
      where: { codingAssessmentId: id, status: { in: ['COMPLETED', 'AUTO_SUBMITTED'] } },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true, profilePicture: true } }
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    const latestByStudent = new Map();
    attempts.forEach(attempt => {
      if (!latestByStudent.has(attempt.studentId)) {
        latestByStudent.set(attempt.studentId, attempt);
      }
    });

    const recipients = [...latestByStudent.values()].map(attempt => ({
      studentName: attempt.student?.user?.fullName || 'Candidate',
      studentEmail: attempt.student?.user?.email,
      selected: attempt.score >= parsedThreshold,
      thresholdLabel: `${parsedThreshold} marks`,
      scoreLabel: `${attempt.score} marks`,
    })).filter(item => item.studentEmail);

    const sendResults = await Promise.allSettled(recipients.map(recipient => {
      const mail = buildDecisionEmail({
        candidateName: recipient.studentName,
        recruiterName: assessment.recruiter?.companyName || recruiter.companyName || 'Hiring Team',
        assessmentName: assessment.name,
        thresholdLabel: recipient.thresholdLabel,
        scoreLabel: recipient.scoreLabel,
        selected: recipient.selected,
      });

      return sendMail({
        to: recipient.studentEmail,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    }));

    return res.json({
      message: 'Decision emails processed',
      total: recipients.length,
      sent: sendResults.filter(r => r.status === 'fulfilled').length,
      failed: sendResults.filter(r => r.status === 'rejected').length,
      selected: recipients.filter(r => r.selected).length,
      rejected: recipients.filter(r => !r.selected).length,
      threshold: parsedThreshold,
    });
  } catch (error) { next(error); }
};

module.exports = {
  createCodingAssessment,
  getCodingAssessments,
  getCodingAssessmentById,
  updateCodingAssessment,
  deleteCodingAssessment,
  duplicateCodingAssessment,
  publishCodingAssessment,
  archiveCodingAssessment,
  assignCodingAssessmentToJobs,

  createCodingProblem,
  updateCodingProblem,
  deleteCodingProblem,

  getStudentCodingAssessments,
  getStudentCodingAssessmentById,
  startCodingAttempt,
  saveCodingDraft,
  getCodingDraft,
  runCodingCode,
  submitCodingCode,
  submitCodingAssessment,

  getCodingResults,
  sendCodingResultEmails
};
