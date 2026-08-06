const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get full student profile including all relations
const getProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        education: true,
        skills: true,
        projects: true,
        certifications: true,
        experiences: true,
        languages: true,
        documents: true,
        socialLinks: true,
        preferences: true,
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
};

// Update base personal info
const updateProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { phone, gender, dob, address, city, state, country, pincode } = req.body;

    const student = await prisma.student.update({
      where: { userId },
      data: {
        phone,
        gender,
        dob: dob ? new Date(dob) : null,
        address,
        city,
        state,
        country,
        pincode,
      },
    });

    res.json({ message: 'Profile updated successfully', student });
  } catch (error) {
    next(error);
  }
};

// Generic array updater for Education, Projects, etc.
const addEducation = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    
    const newEdu = await prisma.studentEducation.create({
      data: {
        ...req.body,
        studentId: student.id,
      }
    });
    res.status(201).json(newEdu);
  } catch (error) { next(error); }
};

const addProject = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    
    const newProject = await prisma.studentProject.create({
      data: {
        ...req.body,
        studentId: student.id,
      }
    });
    res.status(201).json(newProject);
  } catch (error) { next(error); }
};

// Handle document upload (Resume/Profile Pic)
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    const { type } = req.body; // RESUME, PICTURE, CERTIFICATE

    const document = await prisma.studentDocument.create({
      data: {
        studentId: student.id,
        type: type || 'OTHER',
        url: req.file.path,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      }
    });

    // If it's a picture, also update the main User table
    if (type === 'PICTURE') {
      await prisma.user.update({
        where: { id: userId },
        data: { profilePicture: req.file.path }
      });
    }

    res.status(201).json({ message: 'Document uploaded successfully', document });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  addEducation,
  addProject,
  uploadDocument,
};
