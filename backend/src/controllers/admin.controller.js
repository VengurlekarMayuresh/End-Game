const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const env = require('../config/env');

const prisma = new PrismaClient();

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(admin.id, admin.role);
    const refreshToken = generateRefreshToken(admin.id);

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    
    res.json(admin);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getProfile,
};
