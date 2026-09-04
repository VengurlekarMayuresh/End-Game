const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { extractSkillGapAndTopics } = require('../utils/resumeAptitudeExtractor');
const { selectJdFilteredQuestions } = require('../utils/resumeAptitudeBank');
const { executeSqlInSandbox } = require('../utils/sqlSandboxExecutor');
const { validateShortAnswer } = require('../utils/shortAnswerValidator');
const { generateProjectLadder, updateLadderState } = require('../utils/ladderGenerator');
const { calculateResumeAptitudeScore } = require('../utils/resumeAptitudeScorer');

// In-memory store fallback for attempts
const mockResumeAptitudeAttempts = [];

const isDbTableMissingError = (err) => {
  return err.code === 'P2021' || err.code === 'P2022' || err.message?.includes('relation') || err.message?.includes('does not exist');
};

/**
 * Start or resume a 45-minute Resume-Driven Aptitude & Project Deep-Dive session
 */
const startSession = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { jobId } = req.body;

    // Fetch Student profile
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        skills: true,
        projects: true,
        experiences: true,
        education: true,
        user: { select: { fullName: true, email: true } }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    // Fetch Job Details if jobId provided
    let jobDetails = null;
    if (jobId) {
      jobDetails = await prisma.job.findUnique({ where: { id: jobId } });
    }

    // Check if an IN_PROGRESS session already exists
    try {
      const existing = await prisma.resumeAptitudeAttempt.findFirst({
        where: {
          studentId: student.id,
          jobId: jobId || null,
          status: 'IN_PROGRESS'
        }
      });

      if (existing) {
        const now = new Date();
        const expiresAt = new Date(existing.expiresAt);
        const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

        if (remainingSeconds <= 0) {
          // Timer expired -> auto submit
          await prisma.resumeAptitudeAttempt.update({
            where: { id: existing.id },
            data: { status: 'AUTO_SUBMITTED', completedAt: now }
          });
        } else {
          return res.json({
            attempt: existing,
            remainingSeconds,
            message: 'Resuming active session'
          });
        }
      }
    } catch (dbErr) {
      if (!isDbTableMissingError(dbErr)) throw dbErr;
    }

    // 1. Skill Gap Analysis
    const skillExtraction = extractSkillGapAndTopics(student, jobDetails);

    // 2. Select Bank Questions (2 DSA, 2 SQL, 4 Core CS)
    const bankSelection = selectJdFilteredQuestions(jobDetails, skillExtraction.coreTopics);

    // 3. Generate Project/JD Theoretical Ladder (~7 questions)
    const projectLadderQuestions = generateProjectLadder(skillExtraction.coreTopics);

    // Combine all 15 questions
    const allQuestions = [
      ...bankSelection.dsaQuestions,
      ...bankSelection.sqlQuestions,
      ...bankSelection.coreCsQuestions,
      ...projectLadderQuestions
    ];

    // Initial Ladder State
    const ladderState = {};
    skillExtraction.coreTopics.forEach(topic => {
      ladderState[topic] = { currentLevel: 1, maxReached: 1, stopped: false };
    });

    const durationMinutes = 45;
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

    const attemptData = {
      studentId: student.id,
      jobId: jobId || null,
      score: 0.0,
      maxScore: 15.0,
      percentage: 0.0,
      passed: false,
      startedAt,
      expiresAt,
      status: 'IN_PROGRESS',
      skillExtraction,
      questions: allQuestions,
      answers: [],
      ladderState,
      tabViolations: 0,
      fullscreenViolations: 0,
      disqualified: false
    };

    try {
      const attempt = await prisma.resumeAptitudeAttempt.create({ data: attemptData });
      return res.status(201).json({
        attempt,
        remainingSeconds: durationMinutes * 60,
        message: 'Started new 45-minute Resume-Driven Aptitude session'
      });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const mockAttempt = {
          ...attemptData,
          id: 'mock-raa-' + Date.now(),
          createdAt: startedAt,
          updatedAt: startedAt
        };
        mockResumeAptitudeAttempts.push(mockAttempt);
        return res.status(201).json({
          attempt: mockAttempt,
          remainingSeconds: durationMinutes * 60,
          message: 'Started new 45-minute Resume-Driven Aptitude session (Mock Store)'
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get active session details & remaining timer
 */
const getSession = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    let attempt = null;
    try {
      attempt = await prisma.resumeAptitudeAttempt.findUnique({ where: { id: attemptId } });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        attempt = mockResumeAptitudeAttempts.find(a => a.id === attemptId);
      } else {
        throw dbErr;
      }
    }

    if (!attempt) {
      return res.status(404).json({ message: 'Session attempt not found.' });
    }

    const now = new Date();
    const expiresAt = new Date(attempt.expiresAt);
    const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

    // Auto-submit if timer expired and status is still IN_PROGRESS
    if (remainingSeconds <= 0 && attempt.status === 'IN_PROGRESS') {
      attempt.status = 'AUTO_SUBMITTED';
      attempt.completedAt = now;
      try {
        await prisma.resumeAptitudeAttempt.update({
          where: { id: attempt.id },
          data: { status: 'AUTO_SUBMITTED', completedAt: now }
        });
      } catch (e) {}
    }

    // Filter questions based on ladder unlocks
    const questions = attempt.questions || [];
    const ladderState = attempt.ladderState || {};

    const visibleQuestions = questions.map(q => {
      if (q.category === 'PROJECT_LADDER') {
        const topicState = ladderState[q.topic] || { currentLevel: 1, stopped: false };
        const isUnlocked = q.level <= topicState.currentLevel && !topicState.stopped;
        return {
          ...q,
          isUnlocked,
          isStopped: topicState.stopped && q.level > topicState.currentLevel
        };
      }
      return { ...q, isUnlocked: true, isStopped: false };
    });

    return res.json({
      attempt,
      remainingSeconds,
      visibleQuestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Execute SQL query draft against hidden reference schema in Sandbox
 */
const executeSqlSandbox = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, sqlQuery } = req.body;

    let attempt = null;
    try {
      attempt = await prisma.resumeAptitudeAttempt.findUnique({ where: { id: attemptId } });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        attempt = mockResumeAptitudeAttempts.find(a => a.id === attemptId);
      } else throw dbErr;
    }

    if (!attempt) return res.status(404).json({ message: 'Session not found' });

    const question = (attempt.questions || []).find(q => q.id === questionId);
    if (!question || question.category !== 'SQL') {
      return res.status(400).json({ message: 'Target question is not an SQL question.' });
    }

    const sandboxResult = await executeSqlInSandbox(
      sqlQuery,
      question.referenceSchemaSql,
      question.referenceQuery || question.canonicalAnswer
    );

    return res.json(sandboxResult);
  } catch (error) {
    next(error);
  }
};

/**
 * Submit short answer for a question & trigger ladder escalation update
 */
const submitAnswer = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, studentAnswer } = req.body;

    let attempt = null;
    try {
      attempt = await prisma.resumeAptitudeAttempt.findUnique({ where: { id: attemptId } });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        attempt = mockResumeAptitudeAttempts.find(a => a.id === attemptId);
      } else throw dbErr;
    }

    if (!attempt) return res.status(404).json({ message: 'Session not found' });

    // Check timer
    const now = new Date();
    if (now >= new Date(attempt.expiresAt) || attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ message: 'Session time has expired or session is completed.', isExpired: true });
    }

    const question = (attempt.questions || []).find(q => q.id === questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    let isCorrect = false;
    let sqlResult = null;

    if (question.category === 'SQL') {
      sqlResult = await executeSqlInSandbox(
        studentAnswer,
        question.referenceSchemaSql,
        question.referenceQuery || question.canonicalAnswer
      );
      isCorrect = sqlResult.isCorrect;
    } else {
      const validation = validateShortAnswer(studentAnswer, question.canonicalAnswer, question.acceptedSynonyms);
      isCorrect = validation.isCorrect;
    }

    // Update answers array
    let answers = attempt.answers || [];
    const existingIdx = answers.findIndex(a => a.questionId === questionId);
    const ansPayload = {
      questionId,
      studentAnswer,
      isCorrect,
      sqlResult,
      submittedAt: now
    };

    if (existingIdx >= 0) {
      answers[existingIdx] = ansPayload;
    } else {
      answers.push(ansPayload);
    }

    // Ladder escalation update if Project Ladder
    let ladderState = attempt.ladderState || {};
    if (question.category === 'PROJECT_LADDER') {
      ladderState = updateLadderState(ladderState, question.topic, question.level, isCorrect);
    }

    // Recalculate score
    const scoreResult = calculateResumeAptitudeScore(attempt.questions, answers, ladderState);

    attempt.answers = answers;
    attempt.ladderState = ladderState;
    attempt.score = scoreResult.totalScore;
    attempt.percentage = scoreResult.percentage;
    attempt.passed = scoreResult.passed;

    try {
      await prisma.resumeAptitudeAttempt.update({
        where: { id: attemptId },
        data: {
          answers,
          ladderState,
          score: scoreResult.totalScore,
          percentage: scoreResult.percentage,
          passed: scoreResult.passed,
          categoryBreakdown: scoreResult.categoryBreakdown
        }
      });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const idx = mockResumeAptitudeAttempts.findIndex(a => a.id === attemptId);
        if (idx >= 0) mockResumeAptitudeAttempts[idx] = attempt;
      } else throw dbErr;
    }

    return res.json({
      message: 'Answer recorded',
      isCorrect,
      scoreResult,
      ladderState
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit entire session (or auto-submit on 45-min timer expiry)
 */
const submitSession = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    let attempt = null;
    try {
      attempt = await prisma.resumeAptitudeAttempt.findUnique({ where: { id: attemptId } });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        attempt = mockResumeAptitudeAttempts.find(a => a.id === attemptId);
      } else throw dbErr;
    }

    if (!attempt) return res.status(404).json({ message: 'Session not found' });

    const now = new Date();
    const timeTaken = Math.max(1, Math.floor((now - new Date(attempt.startedAt)) / 1000));
    const isExpired = now >= new Date(attempt.expiresAt);

    const status = isExpired ? 'AUTO_SUBMITTED' : 'COMPLETED';

    const scoreResult = calculateResumeAptitudeScore(attempt.questions, attempt.answers, attempt.ladderState);

    attempt.status = status;
    attempt.completedAt = now;
    attempt.timeTaken = timeTaken;
    attempt.score = scoreResult.totalScore;
    attempt.percentage = scoreResult.percentage;
    attempt.passed = scoreResult.passed;
    attempt.categoryBreakdown = scoreResult.categoryBreakdown;

    try {
      await prisma.resumeAptitudeAttempt.update({
        where: { id: attemptId },
        data: {
          status,
          completedAt: now,
          timeTaken,
          score: scoreResult.totalScore,
          percentage: scoreResult.percentage,
          passed: scoreResult.passed,
          categoryBreakdown: scoreResult.categoryBreakdown
        }
      });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const idx = mockResumeAptitudeAttempts.findIndex(a => a.id === attemptId);
        if (idx >= 0) mockResumeAptitudeAttempts[idx] = attempt;
      } else throw dbErr;
    }

    return res.json({
      message: 'Session finalized successfully',
      status,
      scoreResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recruiter: Get attempt results for a candidate
 */
const getResults = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    let attempt = null;
    try {
      attempt = await prisma.resumeAptitudeAttempt.findUnique({
        where: { id: attemptId },
        include: {
          student: {
            include: {
              user: { select: { fullName: true, email: true, profilePicture: true } }
            }
          }
        }
      });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        attempt = mockResumeAptitudeAttempts.find(a => a.id === attemptId);
      } else throw dbErr;
    }

    if (!attempt) return res.status(404).json({ message: 'Attempt results not found' });

    const scoreResult = calculateResumeAptitudeScore(attempt.questions, attempt.answers, attempt.ladderState);

    return res.json({
      attempt,
      scoreResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Candidate: Get list of active/assigned Module 13.5 tests assigned explicitly by recruiter
 */
const getAssignedSessionsForCandidate = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ message: 'Candidate profile not found.' });

    let attempts = [];
    try {
      attempts = await prisma.resumeAptitudeAttempt.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' }
      });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        attempts = mockResumeAptitudeAttempts.filter(a => a.studentId === student.id);
      } else throw dbErr;
    }

    return res.json({
      assigned: attempts.filter(a => a.status === 'IN_PROGRESS' || a.status === 'ASSIGNED'),
      completed: attempts.filter(a => a.status === 'COMPLETED' || a.status === 'AUTO_SUBMITTED'),
      all: attempts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recruiter: Assign candidate to Module 13.5 (Resume-Driven Aptitude & Project Deep-Dive Round)
 */
const assignSessionForCandidate = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          include: {
            skills: true,
            projects: true,
            experiences: true,
            education: true,
            user: { select: { fullName: true, email: true } }
          }
        },
        job: true
      }
    });

    if (!application) {
      return res.status(404).json({ message: 'Job application not found' });
    }

    const student = application.student;
    const jobDetails = application.job;

    // Check if session already exists
    let existing = null;
    try {
      existing = await prisma.resumeAptitudeAttempt.findFirst({
        where: { studentId: student.id, jobId: jobDetails.id }
      });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        existing = mockResumeAptitudeAttempts.find(a => a.studentId === student.id && a.jobId === jobDetails.id);
      } else throw dbErr;
    }

    if (existing) {
      return res.json({ message: 'Candidate already assigned to this round', attempt: existing });
    }

    // Generate session payload
    const skillExtraction = extractSkillGapAndTopics(student, jobDetails);
    const bankSelection = selectJdFilteredQuestions(jobDetails, skillExtraction.coreTopics);
    const projectLadderQuestions = generateProjectLadder(skillExtraction.coreTopics);

    const allQuestions = [
      ...bankSelection.dsaQuestions,
      ...bankSelection.sqlQuestions,
      ...bankSelection.coreCsQuestions,
      ...projectLadderQuestions
    ];

    const ladderState = {};
    skillExtraction.coreTopics.forEach(topic => {
      ladderState[topic] = { currentLevel: 1, maxReached: 1, stopped: false };
    });

    const durationMinutes = 45;
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

    const attemptData = {
      studentId: student.id,
      jobId: jobDetails.id,
      score: 0.0,
      maxScore: 15.0,
      percentage: 0.0,
      passed: false,
      startedAt,
      expiresAt,
      status: 'IN_PROGRESS',
      skillExtraction,
      questions: allQuestions,
      answers: [],
      ladderState,
      tabViolations: 0,
      fullscreenViolations: 0,
      disqualified: false
    };

    let attempt = null;
    try {
      attempt = await prisma.resumeAptitudeAttempt.create({ data: attemptData });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        attempt = {
          ...attemptData,
          id: 'mock-raa-' + Date.now(),
          createdAt: startedAt,
          updatedAt: startedAt
        };
        mockResumeAptitudeAttempts.push(attempt);
      } else throw dbErr;
    }

    return res.status(201).json({
      message: 'Candidate assigned to Module 13.5 Resume-Driven Aptitude & Deep-Dive Round successfully',
      attempt
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startSession,
  getSession,
  executeSqlSandbox,
  submitAnswer,
  submitSession,
  getResults,
  getAssignedSessionsForCandidate,
  assignSessionForCandidate
};
