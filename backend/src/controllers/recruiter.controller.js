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

// GET dashboard stats (placeholder counts until Job module is built)
const getDashboardStats = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({
      where: { userId },
      include: { user: { select: { fullName: true, email: true, profilePicture: true, createdAt: true } } },
    });
    // Static placeholders - will be replaced with real counts when Job module is built
    res.json({
      recruiter,
      stats: {
        activeJobs: 0,
        totalApplications: 0,
        shortlisted: 0,
        interviews: 0,
      },
      recentActivity: [],
    });
  } catch (error) { next(error); }
};

module.exports = { getRecruiterProfile, updateRecruiterProfile, getDashboardStats };
