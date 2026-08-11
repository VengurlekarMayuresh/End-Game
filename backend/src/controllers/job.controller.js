const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const toArray = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (!val || !String(val).trim()) return [];
  return String(val).split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
};

// ─── JOBS CRUD ────────────────────────────────────────────────────────────────

const createJob = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const {
      title, description, requirements, responsibilities,
      location, isRemote, employmentType,
      salaryMin, salaryMax, salaryCurrency,
      skills, experienceMin, experienceMax,
      openings, status, deadline,
    } = req.body;

    const job = await prisma.job.create({
      data: {
        recruiterId: recruiter.id,
        title, description,
        requirements: requirements || null,
        responsibilities: responsibilities || null,
        location,
        isRemote: isRemote === true || isRemote === 'true',
        employmentType,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        salaryCurrency: salaryCurrency || 'INR',
        skills: toArray(skills),
        experienceMin: parseInt(experienceMin) || 0,
        experienceMax: experienceMax ? parseInt(experienceMax) : null,
        openings: parseInt(openings) || 1,
        status: status || 'ACTIVE',
        deadline: deadline ? new Date(deadline) : null,
      },
    });
    res.status(201).json(job);
  } catch (error) { next(error); }
};

const getMyJobs = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const jobs = await prisma.job.findMany({
      where: { recruiterId: recruiter.id },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(jobs);
  } catch (error) { next(error); }
};

const getJobById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;
    const job = await prisma.job.findFirst({
      where: { id, recruiterId: recruiter.id },
      include: { _count: { select: { applications: true } } },
    });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) { next(error); }
};

const updateJob = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;
    const existing = await prisma.job.findFirst({ where: { id, recruiterId: recruiter.id } });
    if (!existing) return res.status(404).json({ message: 'Job not found' });

    const {
      title, description, requirements, responsibilities,
      location, isRemote, employmentType,
      salaryMin, salaryMax, salaryCurrency,
      skills, experienceMin, experienceMax,
      openings, status, deadline,
    } = req.body;

    const job = await prisma.job.update({
      where: { id },
      data: {
        title, description,
        requirements: requirements || null,
        responsibilities: responsibilities || null,
        location,
        isRemote: isRemote === true || isRemote === 'true',
        employmentType,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        salaryCurrency: salaryCurrency || 'INR',
        skills: toArray(skills),
        experienceMin: parseInt(experienceMin) || 0,
        experienceMax: experienceMax ? parseInt(experienceMax) : null,
        openings: parseInt(openings) || 1,
        status,
        deadline: deadline ? new Date(deadline) : null,
      },
    });
    res.json(job);
  } catch (error) { next(error); }
};

const deleteJob = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;
    const existing = await prisma.job.findFirst({ where: { id, recruiterId: recruiter.id } });
    if (!existing) return res.status(404).json({ message: 'Job not found' });
    await prisma.job.delete({ where: { id } });
    res.json({ message: 'Job deleted' });
  } catch (error) { next(error); }
};

// ─── APPLICATIONS / CANDIDATES ────────────────────────────────────────────────

const getApplicationsForJob = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { jobId } = req.params;
    const job = await prisma.job.findFirst({
      where: { id: jobId, recruiterId: recruiter.id },
      include: {
        test: { select: { id: true, name: true, duration: true, passingPercentage: true } },
        codingAssessment: { select: { id: true, name: true, duration: true } },
      },
    });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            testId: true,
            codingAssessmentId: true,
            test: { select: { id: true, name: true, duration: true, passingPercentage: true } },
            codingAssessment: { select: { id: true, name: true, duration: true } },
          },
        },
        student: {
          include: {
            user: { select: { fullName: true, email: true, profilePicture: true } },
            education: true,
            skills: true,
            experiences: true,
            documents: { where: { type: 'RESUME' } },
            socialLinks: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    const completedStatuses = ['COMPLETED', 'AUTO_SUBMITTED'];
    const latestByStudent = (attempts) => {
      const sorted = [...attempts].sort((a, b) => {
        const left = new Date(b.completedAt || b.updatedAt || b.createdAt).getTime();
        const right = new Date(a.completedAt || a.updatedAt || a.createdAt).getTime();
        return left - right;
      });

      const map = new Map();
      sorted.forEach(attempt => {
        if (!map.has(attempt.studentId)) map.set(attempt.studentId, attempt);
      });
      return map;
    };

    let aptitudeAttempts = new Map();
    let codingAttempts = new Map();

    try {
      if (job.testId) {
        const attempts = await prisma.testAttempt.findMany({
          where: { testId: job.testId, status: { in: completedStatuses } },
          select: {
            studentId: true,
            score: true,
            percentage: true,
            passed: true,
            completedAt: true,
            timeTaken: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        aptitudeAttempts = latestByStudent(attempts);
      }

      if (job.codingAssessmentId) {
        const attempts = await prisma.codingAttempt.findMany({
          where: { codingAssessmentId: job.codingAssessmentId, status: { in: completedStatuses } },
          select: {
            studentId: true,
            score: true,
            passed: true,
            completedAt: true,
            timeTaken: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        codingAttempts = latestByStudent(attempts);
      }
    } catch (assessmentError) {
      console.warn('Assessment lookup failed for job applications:', assessmentError.message);
    }

    const enriched = applications.map(app => {
      const aptitude = aptitudeAttempts.get(app.studentId) || null;
      const coding = codingAttempts.get(app.studentId) || null;

      const bestScore = Math.max(
        aptitude?.percentage ?? -1,
        coding?.score ?? -1,
      );

      return {
        ...app,
        examSummary: {
          aptitude: aptitude ? {
            completed: true,
            score: aptitude.score,
            percentage: aptitude.percentage,
            passed: aptitude.passed,
            completedAt: aptitude.completedAt,
            timeTaken: aptitude.timeTaken,
            status: aptitude.status,
          } : null,
          coding: coding ? {
            completed: true,
            score: coding.score,
            passed: coding.passed,
            completedAt: coding.completedAt,
            timeTaken: coding.timeTaken,
            status: coding.status,
          } : null,
          completed: Boolean(aptitude || coding),
          completedCount: [aptitude, coding].filter(Boolean).length,
          bestScore: bestScore >= 0 ? bestScore : null,
        },
      };
    });

    res.json(enriched);
  } catch (error) { next(error); }
};

const getAllCandidates = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    // Get all applications across all recruiter's jobs
    const applications = await prisma.jobApplication.findMany({
      where: { job: { recruiterId: recruiter.id } },
      include: {
        job: { select: { id: true, title: true } },
        student: {
          include: {
            user: { select: { fullName: true, email: true, profilePicture: true } },
            education: { take: 1, orderBy: { startYear: 'desc' } },
            skills: { take: 5 },
            documents: { where: { type: 'RESUME' }, take: 1 },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
    res.json(applications);
  } catch (error) { next(error); }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { appId } = req.params;
    const { status, notes } = req.body;

    const app = await prisma.jobApplication.findFirst({
      where: { id: appId, job: { recruiterId: recruiter.id } },
    });
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const updated = await prisma.jobApplication.update({
      where: { id: appId },
      data: { status, notes: notes ?? app.notes },
    });
    res.json(updated);
  } catch (error) { next(error); }
};

module.exports = {
  createJob, getMyJobs, getJobById, updateJob, deleteJob,
  getApplicationsForJob, getAllCandidates, updateApplicationStatus,
};
