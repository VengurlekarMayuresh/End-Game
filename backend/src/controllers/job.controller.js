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
    const job = await prisma.job.findFirst({ where: { id: jobId, recruiterId: recruiter.id } });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
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
    res.json(applications);
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
