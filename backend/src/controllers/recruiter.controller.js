const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET recruiter profile
const getRecruiterProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({
      where: { userId },
      include: { user: { select: { fullName: true, email: true, profilePicture: true } } },
    });
    if (!recruiter) return res.status(404).json({ message: 'Recruiter profile not found' });
    res.json(recruiter);
  } catch (error) { next(error); }
};

// UPDATE recruiter profile
const updateRecruiterProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const {
      companyName, designation, industry, companyWebsite,
      companySize, companyDescription, phone, officeAddress,
    } = req.body;
    const recruiter = await prisma.recruiter.update({
      where: { userId },
      data: { companyName, designation, industry, companyWebsite, companySize, companyDescription, phone, officeAddress },
    });
    res.json({ message: 'Profile updated', recruiter });
  } catch (error) { next(error); }
};

// GET dashboard stats
const getDashboardStats = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({
      where: { userId },
      include: { user: { select: { fullName: true, email: true, profilePicture: true, createdAt: true } } },
    });

    if (!recruiter) return res.status(404).json({ message: 'Recruiter profile not found' });

    let activeJobs = 0;
    let totalApplications = 0;
    let shortlisted = 0;
    let interviews = 0;
    let recentActivity = [];

    try {
      const [activeJobsCount, totalApps, shortlistCount, interviewCount] = await prisma.$transaction([
        prisma.job.count({ where: { recruiterId: recruiter.id, status: 'ACTIVE' } }),
        prisma.jobApplication.count({ where: { job: { recruiterId: recruiter.id } } }),
        prisma.jobApplication.count({ where: { job: { recruiterId: recruiter.id }, status: { in: ['SHORTLISTED', 'INTERVIEW', 'OFFERED'] } } }),
        prisma.jobApplication.count({ where: { job: { recruiterId: recruiter.id }, status: 'INTERVIEW' } })
      ]);

      activeJobs = activeJobsCount;
      totalApplications = totalApps;
      shortlisted = shortlistCount;
      interviews = interviewCount;

      const recentApps = await prisma.jobApplication.findMany({
        where: { job: { recruiterId: recruiter.id } },
        include: {
          job: { select: { title: true } },
          student: { include: { user: { select: { fullName: true } } } }
        },
        orderBy: { appliedAt: 'desc' },
        take: 5
      });

      recentActivity = recentApps.map(app => ({
        id: app.id,
        type: 'APPLICATION',
        title: 'New Application Received',
        desc: `${app.student.user.fullName} applied for "${app.job.title}"`,
        time: app.appliedAt
      }));
    } catch (dbErr) {
      console.warn('Recruiter dashboard stats query failed, falling back to static placeholders:', dbErr.message);
    }

    res.json({
      recruiter,
      stats: {
        activeJobs,
        totalApplications,
        shortlisted,
        interviews,
      },
      recentActivity,
    });
  } catch (error) { next(error); }
};

module.exports = { getRecruiterProfile, updateRecruiterProfile, getDashboardStats };
