const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { analyzeJobDescription } = require('../utils/jobAnalysis');
const { calculateMatchScore } = require('../utils/candidateMatching');

const toArray = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (!val || !String(val).trim()) return [];
  return String(val).split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
};

const buildStudentProfileForMatching = (student) => {
  if (!student) return null;
  return {
    skills: student.skills || [],
    experiences: student.experiences || [],
    education: student.education || [],
    projects: student.projects || [],
    certifications: student.certifications || [],
    socialLinks: student.socialLinks || null,
    preferences: student.preferences || null,
    user: student.user || null,
  };
};

const buildJobRequirementsForMatching = (job) => {
  if (!job) return null;

  const description = job.description || '';
  const requirements = job.requirements || '';
  const fullDescription = `${description} ${requirements || ''}`;

  const analyzed = analyzeJobDescription(fullDescription);

  // Merge analyzed skills with existing job skills array
  const mergedSkills = new Set([
    ...(job.skills || []),
    ...(analyzed.skills.hardSkills || []),
    ...(analyzed.skills.technologies || []),
  ]);

  return {
    skills: {
      hardSkills: Array.from(mergedSkills),
      softSkills: analyzed.skills.softSkills || [],
      technologies: analyzed.skills.technologies || [],
    },
    experience: {
      minYears: job.experienceMin || analyzed.experience.minYears || 0,
      maxYears: job.experienceMax || analyzed.experience.maxYears || null,
      experienceLevel: analyzed.experience.experienceLevel || null,
    },
    education: analyzed.education,
    certifications: analyzed.certifications,
    responsibilities: analyzed.responsibilities || [],
    keywords: analyzed.keywords || [],
    rawDescription: fullDescription,
  };
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
            projects: true,
            certifications: true,
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

    const jobRequirements = buildJobRequirementsForMatching(job);

    const enriched = applications.map(app => {
      const aptitude = aptitudeAttempts.get(app.studentId) || null;
      const coding = codingAttempts.get(app.studentId) || null;

      const bestScore = Math.max(
        aptitude?.percentage ?? -1,
        coding?.score ?? -1,
      );

      // Compute match score
      const studentProfile = buildStudentProfileForMatching(app.student);
      const matchResult = calculateMatchScore(jobRequirements, studentProfile);

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
        matchScore: {
          score: matchResult.score,
          matchPercentage: matchResult.matchPercentage,
          explanation: matchResult.explanation,
          matched: matchResult.matched,
          partiallyMatched: matchResult.partiallyMatched,
          missing: matchResult.missing,
        },
      };
    });

    // Sort by match score (highest first), then by exam score
    enriched.sort((a, b) => {
      const scoreDiff = (b.matchScore?.score || 0) - (a.matchScore?.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (b.examSummary?.bestScore || 0) - (a.examSummary?.bestScore || 0);
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

// ─── JOB DESCRIPTION ANALYSIS & AUTOMATED SHORTLISTING ────────────────────────

const analyzeJobDescriptionController = async (req, res, next) => {
  try {
    const { description, requirements, skills } = req.body;

    if (!description && !requirements) {
      return res.status(400).json({ message: 'Provide description or requirements to analyze' });
    }

    const fullText = `${description || ''} ${requirements || ''}`;
    const analysis = analyzeJobDescription(fullText);

    if (skills && Array.isArray(skills)) {
      const existingSkills = new Set(skills);
      analysis.skills.hardSkills.forEach(s => existingSkills.add(s));
      analysis.skills.technologies.forEach(s => existingSkills.add(s));
      analysis.skills.hardSkills = Array.from(existingSkills);
    }

    res.json({
      analysis: {
        skills: analysis.skills.hardSkills,
        technologies: analysis.skills.technologies,
        softSkills: analysis.skills.softSkills,
        experience: analysis.experience,
        education: analysis.education,
        certifications: analysis.certifications,
        responsibilities: analysis.responsibilities,
        keywords: analysis.keywords,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCandidateMatchScores = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { jobId } = req.params;

    const job = await prisma.job.findFirst({
      where: { id: jobId, recruiterId: recruiter.id },
    });

    if (!job) return res.status(404).json({ message: 'Job not found' });

    const jobRequirements = buildJobRequirementsForMatching(job);

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true, profilePicture: true } },
            education: true,
            skills: true,
            projects: true,
            certifications: true,
            experiences: true,
            socialLinks: true,
            preferences: true,
            documents: { where: { type: 'RESUME' } },
          },
        },
      },
    });

    const scoredApplications = applications.map(app => {
      const studentProfile = buildStudentProfileForMatching(app.student);
      const matchResult = calculateMatchScore(jobRequirements, studentProfile);

      return {
        ...app,
        matchScore: {
          score: matchResult.score,
          matchPercentage: matchResult.matchPercentage,
          coverage: matchResult.coverage,
          breakdown: matchResult.breakdown,
          explanation: matchResult.explanation,
          matched: matchResult.matched,
          partiallyMatched: matchResult.partiallyMatched,
          missing: matchResult.missing,
        },
      };
    });

    scoredApplications.sort((a, b) => (b.matchScore?.score || 0) - (a.matchScore?.score || 0));

    res.json({
      jobTitle: job.title,
      requirements: {
        skills: jobRequirements.skills.hardSkills,
        technologies: jobRequirements.skills.technologies,
        softSkills: jobRequirements.skills.softSkills,
        experience: jobRequirements.experience,
        education: jobRequirements.education,
        certifications: jobRequirements.certifications,
        responsibilities: jobRequirements.responsibilities,
        keywords: jobRequirements.keywords,
      },
      applications: scoredApplications,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleCandidateMatchScore = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { jobId, studentId } = req.params;

    const job = await prisma.job.findFirst({
      where: { id: jobId, recruiterId: recruiter.id },
    });

    if (!job) return res.status(404).json({ message: 'Job not found' });

    const jobRequirements = buildJobRequirementsForMatching(job);

    const application = await prisma.jobApplication.findFirst({
      where: { jobId, studentId: studentId },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true, profilePicture: true } },
            education: true,
            skills: true,
            projects: true,
            certifications: true,
            experiences: true,
            socialLinks: true,
            preferences: true,
            documents: { where: { type: 'RESUME' } },
          },
        },
      },
    });

    if (!application) return res.status(404).json({ message: 'Application not found' });

    const studentProfile = buildStudentProfileForMatching(application.student);
    const matchResult = calculateMatchScore(jobRequirements, studentProfile);

    res.json({
      job: {
        id: job.id,
        title: job.title,
        experienceMin: job.experienceMin,
        experienceMax: job.experienceMax,
        skills: job.skills,
      },
      student: {
        id: application.student.id,
        user: application.student.user,
      },
      matchScore: {
        score: matchResult.score,
        matchPercentage: matchResult.matchPercentage,
        coverage: matchResult.coverage,
        breakdown: matchResult.breakdown,
        explanation: matchResult.explanation,
        detailedExplanations: matchResult.detailedExplanations,
        matched: matchResult.matched,
        partiallyMatched: matchResult.partiallyMatched,
        missing: matchResult.missing,
        totalRequired: matchResult.totalRequired,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateApplicationShortlistStatus = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { appId } = req.params;
    const { shortlistStatus } = req.body;

    const validStatuses = ['SHORTLISTED', 'REJECTED', 'REVIEW', 'APPLIED'];
    if (!validStatuses.includes(shortlistStatus)) {
      return res.status(400).json({ message: 'Invalid shortlist status' });
    }

    const app = await prisma.jobApplication.findFirst({
      where: { id: appId, job: { recruiterId: recruiter.id } },
    });

    if (!app) return res.status(404).json({ message: 'Application not found' });

    const updated = await prisma.jobApplication.update({
      where: { id: appId },
      data: { status: shortlistStatus },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// ─── BULK SHORTLIST ACTION ─────────────────────────────────────────────────────

const bulkUpdateShortlistStatus = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { jobId } = req.params;
    const { applicationIds, status } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: 'applicationIds array is required' });
    }

    const validStatuses = ['SHORTLISTED', 'REJECTED', 'REVIEW', 'APPLIED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Verify job belongs to recruiter
    const job = await prisma.job.findFirst({
      where: { id: jobId, recruiterId: recruiter.id },
    });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Update all specified applications
    const result = await prisma.jobApplication.updateMany({
      where: {
        id: { in: applicationIds },
        jobId,
      },
      data: { status },
    });

    res.json({
      message: `Updated ${result.count} application(s) to status: ${status}`,
      count: result.count,
    });
  } catch (error) {
    next(error);
  }
};

// ─── EXPORTS ───────────────────────────────────────────────────────────────────

module.exports = {
  createJob, getMyJobs, getJobById, updateJob, deleteJob,
  getApplicationsForJob, getAllCandidates, updateApplicationStatus,
  analyzeJobDescriptionController,
  getCandidateMatchScores,
  getSingleCandidateMatchScore,
  updateApplicationShortlistStatus,
  bulkUpdateShortlistStatus,
};
