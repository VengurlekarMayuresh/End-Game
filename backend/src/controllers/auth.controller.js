const { PrismaClient } = require('@prisma/client');
const { verifyGoogleToken } = require('../utils/googleAuth');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const env = require('../config/env');

const prisma = new PrismaClient();

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'No token provided' });

    const payload = await verifyGoogleToken(token);
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      // Create new PENDING user
      user = await prisma.user.create({
        data: {
          googleId: payload.sub,
          email: payload.email,
          fullName: payload.name,
          profilePicture: payload.picture,
          status: 'PENDING',
        },
      });
    } else {
      // Update lastLogin and picture if changed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          profilePicture: payload.picture,
        },
      });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        role: user.role,
        status: user.status,
        isProfileCompleted: user.isProfileCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
};

const completeProfile = async (req, res, next) => {
  try {
    const { userId } = req.user; // from authenticateUser
    const { role, profileData } = req.body;

    if (!['STUDENT', 'RECRUITER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    // Check existing user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isProfileCompleted) {
      return res.status(400).json({ message: 'User not found or profile already completed' });
    }

    // Wrap in transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      if (role === 'STUDENT') {
        await tx.student.create({
          data: {
            userId,
            phone: profileData.phone,
            address: profileData.address,
            education: {
              create: [{
                institution: profileData.college || 'Unknown',
                university: profileData.university,
                degree: profileData.degree || 'Unknown',
                branch: profileData.branch || 'Unknown',
                startYear: profileData.graduationYear ? parseInt(profileData.graduationYear) - 4 : new Date().getFullYear(),
                endYear: profileData.graduationYear ? parseInt(profileData.graduationYear) : null,
                cgpa: profileData.cgpa ? parseFloat(profileData.cgpa) : null,
                isCurrent: true,
              }]
            },
            skills: {
              create: (profileData.skills || []).map(skill => ({ name: skill }))
            },
            socialLinks: {
              create: {
                github: profileData.github,
                linkedin: profileData.linkedin,
                portfolio: profileData.portfolio,
              }
            }
          },
        });
      } else if (role === 'RECRUITER') {
        await tx.recruiter.create({
          data: {
            userId,
            companyName: profileData.companyName,
            designation: profileData.designation,
            industry: profileData.industry,
            companyWebsite: profileData.companyWebsite,
            companySize: profileData.companySize,
            companyDescription: profileData.companyDescription,
            phone: profileData.phone,
            companyLogo: profileData.companyLogo,
            officeAddress: profileData.officeAddress,
          },
        });
      }

      // Update User table
      return await tx.user.update({
        where: { id: userId },
        data: {
          role,
          status: 'ACTIVE',
          isProfileCompleted: true,
        },
      });
    });

    // Re-issue tokens with new role
    const accessToken = generateAccessToken(updatedUser.id, updatedUser.role);
    const refreshToken = generateRefreshToken(updatedUser.id);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
        status: updatedUser.status,
        isProfileCompleted: updatedUser.isProfileCompleted,
      }
    });

  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

    const decoded = verifyToken(refreshToken);
    if (!decoded) return res.status(401).json({ message: 'Invalid refresh token' });

    // Ensure user still exists
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ message: 'User not found' });

    const accessToken = generateAccessToken(user.id, user.role);
    // Optionally rotate refresh token
    const newRefreshToken = generateRefreshToken(user.id);
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

const getMe = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        recruiterProfile: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  googleLogin,
  completeProfile,
  refresh,
  logout,
  getMe,
};
