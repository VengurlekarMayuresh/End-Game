const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

// Save file to local uploads directory
const saveFileLocally = (file) => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const uniqueName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(uploadsDir, uniqueName);
  fs.writeFileSync(filePath, file.buffer);
  return { secure_url: `/uploads/${uniqueName}`, filePath };
};

// Helper functions for safe parsing and missing record auto-creation
const safeDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const safeInt = (val, defaultVal = null) => {
  if (val === null || val === undefined || val === '') return defaultVal;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultVal : parsed;
};

const safeFloat = (val, defaultVal = null) => {
  if (val === null || val === undefined || val === '') return defaultVal;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? defaultVal : parsed;
};

const getOrCreateStudent = async (userId) => {
  let student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    student = await prisma.student.create({ data: { userId } });
  }
  return student;
};

// ─── PROFILE ─────────────────────────────────────────────────────────────────

const getProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    let student = await prisma.student.findUnique({
      where: { userId },
      include: {
        education: true, skills: true, projects: true, certifications: true,
        experiences: true, languages: true, documents: true, socialLinks: true, preferences: true,
      },
    });
    if (!student) {
      student = await getOrCreateStudent(userId);
      student = await prisma.student.findUnique({
        where: { userId },
        include: {
          education: true, skills: true, projects: true, certifications: true,
          experiences: true, languages: true, documents: true, socialLinks: true, preferences: true,
        },
      });
    }
    res.json(student);
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { phone, gender, dob, address, city, state, country, pincode } = req.body;
    const student = await prisma.student.upsert({
      where: { userId },
      update: { phone, gender, dob: safeDate(dob), address, city, state, country, pincode },
      create: { userId, phone, gender, dob: safeDate(dob), address, city, state, country, pincode },
    });
    res.json({ message: 'Profile updated', student });
  } catch (error) { next(error); }
};

// ─── EDUCATION ────────────────────────────────────────────────────────────────

const addEducation = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { institution, university, degree, branch, cgpa, percentage, startYear, endYear, isCurrent } = req.body;
    const newEdu = await prisma.studentEducation.create({
      data: {
        studentId: student.id, institution, university, degree, branch,
        cgpa: safeFloat(cgpa),
        percentage: safeFloat(percentage),
        startYear: safeInt(startYear, new Date().getFullYear()),
        endYear: safeInt(endYear),
        isCurrent: isCurrent === true || isCurrent === 'true',
      }
    });
    res.status(201).json(newEdu);
  } catch (error) { next(error); }
};

const updateEducation = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const { institution, university, degree, branch, cgpa, percentage, startYear, endYear, isCurrent } = req.body;
    const edu = await prisma.studentEducation.findFirst({ where: { id, studentId: student.id } });
    if (!edu) return res.status(404).json({ message: 'Education record not found' });
    const updated = await prisma.studentEducation.update({
      where: { id },
      data: {
        institution, university, degree, branch,
        cgpa: safeFloat(cgpa),
        percentage: safeFloat(percentage),
        startYear: safeInt(startYear, new Date().getFullYear()),
        endYear: safeInt(endYear),
        isCurrent: isCurrent === true || isCurrent === 'true',
      }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

const deleteEducation = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const edu = await prisma.studentEducation.findFirst({ where: { id, studentId: student.id } });
    if (!edu) return res.status(404).json({ message: 'Education record not found' });
    await prisma.studentEducation.delete({ where: { id } });
    res.json({ message: 'Education deleted' });
  } catch (error) { next(error); }
};

// ─── SKILLS ───────────────────────────────────────────────────────────────────

const addSkill = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { name, category, level } = req.body;
    const skill = await prisma.studentSkill.create({
      data: { studentId: student.id, name, category, level: level || 'INTERMEDIATE' }
    });
    res.status(201).json(skill);
  } catch (error) { next(error); }
};

const updateSkill = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const { name, category, level } = req.body;
    const skill = await prisma.studentSkill.findFirst({ where: { id, studentId: student.id } });
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    const updated = await prisma.studentSkill.update({ where: { id }, data: { name, category, level } });
    res.json(updated);
  } catch (error) { next(error); }
};

const deleteSkill = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const skill = await prisma.studentSkill.findFirst({ where: { id, studentId: student.id } });
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    await prisma.studentSkill.delete({ where: { id } });
    res.json({ message: 'Skill deleted' });
  } catch (error) { next(error); }
};

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

const toArray = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (!val || !val.trim()) return [];
  return val.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
};

const addProject = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { title, description, techStack, role, duration, githubUrl, liveUrl } = req.body;
    const project = await prisma.studentProject.create({
      data: {
        studentId: student.id, title, description, role, duration, githubUrl, liveUrl,
        techStack: toArray(techStack),
      }
    });
    res.status(201).json(project);
  } catch (error) { next(error); }
};

const updateProject = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const { title, description, techStack, role, duration, githubUrl, liveUrl } = req.body;
    const project = await prisma.studentProject.findFirst({ where: { id, studentId: student.id } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const updated = await prisma.studentProject.update({
      where: { id },
      data: {
        title, description, role, duration, githubUrl, liveUrl,
        techStack: toArray(techStack),
      }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

const deleteProject = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const project = await prisma.studentProject.findFirst({ where: { id, studentId: student.id } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await prisma.studentProject.delete({ where: { id } });
    res.json({ message: 'Project deleted' });
  } catch (error) { next(error); }
};

// ─── CERTIFICATIONS ───────────────────────────────────────────────────────────

const addCertification = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { title, organization, issueDate, expiryDate, credentialId, credentialUrl } = req.body;
    const cert = await prisma.studentCertification.create({
      data: {
        studentId: student.id, title, organization, credentialId, credentialUrl,
        issueDate: safeDate(issueDate) || new Date(),
        expiryDate: safeDate(expiryDate),
      }
    });
    res.status(201).json(cert);
  } catch (error) { next(error); }
};

const updateCertification = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const { title, organization, issueDate, expiryDate, credentialId, credentialUrl } = req.body;
    const cert = await prisma.studentCertification.findFirst({ where: { id, studentId: student.id } });
    if (!cert) return res.status(404).json({ message: 'Certification not found' });
    const updated = await prisma.studentCertification.update({
      where: { id },
      data: {
        title, organization, credentialId, credentialUrl,
        issueDate: safeDate(issueDate) || cert.issueDate,
        expiryDate: safeDate(expiryDate),
      }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

const deleteCertification = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const cert = await prisma.studentCertification.findFirst({ where: { id, studentId: student.id } });
    if (!cert) return res.status(404).json({ message: 'Certification not found' });
    await prisma.studentCertification.delete({ where: { id } });
    res.json({ message: 'Certification deleted' });
  } catch (error) { next(error); }
};

// ─── EXPERIENCE ───────────────────────────────────────────────────────────────

const addExperience = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { company, role, employmentType, startDate, endDate, isCurrent, description } = req.body;
    const exp = await prisma.studentExperience.create({
      data: {
        studentId: student.id, company, role, employmentType, description,
        startDate: safeDate(startDate),
        endDate: safeDate(endDate),
        isCurrent: isCurrent === true || isCurrent === 'true',
      }
    });
    res.status(201).json(exp);
  } catch (error) { next(error); }
};

const updateExperience = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const { company, role, employmentType, startDate, endDate, isCurrent, description } = req.body;
    const exp = await prisma.studentExperience.findFirst({ where: { id, studentId: student.id } });
    if (!exp) return res.status(404).json({ message: 'Experience not found' });
    const updated = await prisma.studentExperience.update({
      where: { id },
      data: {
        company, role, employmentType, description,
        startDate: safeDate(startDate) || exp.startDate,
        endDate: safeDate(endDate),
        isCurrent: isCurrent === true || isCurrent === 'true',
      }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

const deleteExperience = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const exp = await prisma.studentExperience.findFirst({ where: { id, studentId: student.id } });
    if (!exp) return res.status(404).json({ message: 'Experience not found' });
    await prisma.studentExperience.delete({ where: { id } });
    res.json({ message: 'Experience deleted' });
  } catch (error) { next(error); }
};

// ─── LANGUAGES ────────────────────────────────────────────────────────────────

const addLanguage = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { language, read, write, speak, proficiency } = req.body;
    const lang = await prisma.studentLanguage.create({
      data: {
        studentId: student.id, language, proficiency: proficiency || 'FLUENT',
        read: read !== false, write: write !== false, speak: speak !== false,
      }
    });
    res.status(201).json(lang);
  } catch (error) { next(error); }
};

const updateLanguage = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const { language, read, write, speak, proficiency } = req.body;
    const lang = await prisma.studentLanguage.findFirst({ where: { id, studentId: student.id } });
    if (!lang) return res.status(404).json({ message: 'Language not found' });
    const updated = await prisma.studentLanguage.update({
      where: { id },
      data: { language, proficiency, read, write, speak }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

const deleteLanguage = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const lang = await prisma.studentLanguage.findFirst({ where: { id, studentId: student.id } });
    if (!lang) return res.status(404).json({ message: 'Language not found' });
    await prisma.studentLanguage.delete({ where: { id } });
    res.json({ message: 'Language deleted' });
  } catch (error) { next(error); }
};

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { type } = req.body;
    const result = saveFileLocally(req.file);
    const document = await prisma.studentDocument.create({
      data: {
        studentId: student.id, type: type || 'OTHER',
        url: result.secure_url, filename: req.file.originalname,
        size: req.file.size, mimetype: req.file.mimetype,
      }
    });
    if (type === 'PICTURE') {
      await prisma.user.update({ where: { id: userId }, data: { profilePicture: result.secure_url } });
    }
    res.status(201).json({ message: 'Document uploaded successfully', document });
  } catch (error) { next(error); }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { id } = req.params;
    const doc = await prisma.studentDocument.findFirst({ where: { id, studentId: student.id } });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    await prisma.studentDocument.delete({ where: { id } });
    res.json({ message: 'Document deleted' });
  } catch (error) { next(error); }
};

// ─── SOCIAL LINKS ─────────────────────────────────────────────────────────────

const updateSocialLinks = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { github, linkedin, portfolio, leetcode, codechef, hackerrank, codeforces } = req.body;
    const social = await prisma.studentSocial.upsert({
      where: { studentId: student.id },
      create: { studentId: student.id, github, linkedin, portfolio, leetcode, codechef, hackerrank, codeforces },
      update: { github, linkedin, portfolio, leetcode, codechef, hackerrank, codeforces },
    });
    res.json(social);
  } catch (error) { next(error); }
};

// ─── PREFERENCES ──────────────────────────────────────────────────────────────

const updatePreferences = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { preferredRoles, preferredLocations, expectedSalary, employmentType, remotePreference } = req.body;
    const pref = await prisma.studentPreference.upsert({
      where: { studentId: student.id },
      create: { studentId: student.id, preferredRoles: preferredRoles || [], preferredLocations: preferredLocations || [], expectedSalary, employmentType, remotePreference },
      update: { preferredRoles: preferredRoles || [], preferredLocations: preferredLocations || [], expectedSalary, employmentType, remotePreference },
    });
    res.json(pref);
  } catch (error) { next(error); }
};

// ─── BATCH PROFILE UPDATE ──────────────────────────────────────────────────────

const batchUpdateProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await getOrCreateStudent(userId);
    const { skills, experiences, education, certifications, languages, preferences } = req.body;

    const updates = [];

    // Update skills (batch create/update - delete existing and re-create)
    if (skills && Array.isArray(skills)) {
      // Delete existing skills
      await prisma.studentSkill.deleteMany({ where: { studentId: student.id } });
      // Create new skills
      const skillCreatePromises = skills.map(skill => prisma.studentSkill.create({
        data: { studentId: student.id, name: skill.name, category: skill.category, level: skill.level || 'INTERMEDIATE' }
      }));
      updates.push(Promise.all(skillCreatePromises));
    }

    // Update experiences
    if (experiences && Array.isArray(experiences)) {
      await prisma.studentExperience.deleteMany({ where: { studentId: student.id } });
      const expCreatePromises = experiences.map(exp => prisma.studentExperience.create({
        data: {
          studentId: student.id, company: exp.company, role: exp.role, employmentType: exp.employmentType,
          startDate: safeDate(exp.startDate), endDate: safeDate(exp.endDate),
          isCurrent: exp.isCurrent === true || exp.isCurrent === 'true', description: exp.description,
        }
      }));
      updates.push(Promise.all(expCreatePromises));
    }

    // Update education
    if (education && Array.isArray(education)) {
      await prisma.studentEducation.deleteMany({ where: { studentId: student.id } });
      const eduCreatePromises = education.map(edu => prisma.studentEducation.create({
        data: {
          studentId: student.id, institution: edu.institution, university: edu.university, degree: edu.degree, branch: edu.branch,
          cgpa: safeFloat(edu.cgpa), percentage: safeFloat(edu.percentage),
          startYear: safeInt(edu.startYear, new Date().getFullYear()), endYear: safeInt(edu.endYear),
          isCurrent: edu.isCurrent === true || edu.isCurrent === 'true'
        }
      }));
      updates.push(Promise.all(eduCreatePromises));
    }

    // Update certifications
    if (certifications && Array.isArray(certifications)) {
      await prisma.studentCertification.deleteMany({ where: { studentId: student.id } });
      const certCreatePromises = certifications.map(cert => prisma.studentCertification.create({
        data: {
          studentId: student.id, title: cert.title, organization: cert.organization,
          issueDate: safeDate(cert.issueDate) || new Date(), expiryDate: safeDate(cert.expiryDate),
          credentialId: cert.credentialId, credentialUrl: cert.credentialUrl
        }
      }));
      updates.push(Promise.all(certCreatePromises));
    }

    // Update languages
    if (languages && Array.isArray(languages)) {
      await prisma.studentLanguage.deleteMany({ where: { studentId: student.id } });
      const langCreatePromises = languages.map(lang => prisma.studentLanguage.create({
        data: { studentId: student.id, language: lang.language, read: lang.read !== false, write: lang.write !== false, speak: lang.speak !== false, proficiency: lang.proficiency || 'FLUENT' }
      }));
      updates.push(Promise.all(langCreatePromises));
    }

    // Update preferences
    if (preferences) {
      const pref = await prisma.studentPreference.upsert({
        where: { studentId: student.id },
        create: {
          studentId: student.id,
          preferredRoles: preferences.preferredRoles || [],
          preferredLocations: preferences.preferredLocations || [],
          expectedSalary: preferences.expectedSalary,
          employmentType: preferences.employmentType,
          remotePreference: preferences.remotePreference
        },
        update: {
          preferredRoles: preferences.preferredRoles || [],
          preferredLocations: preferences.preferredLocations || [],
          expectedSalary: preferences.expectedSalary,
          employmentType: preferences.employmentType,
          remotePreference: preferences.remotePreference
        },
      });
      updates.push(Promise.resolve(pref));
    }

    // Wait for all updates to complete
    await Promise.all(updates.filter(u => u && (u.length > 1 || u instanceof Promise)));

    const updatedStudent = await prisma.student.findUnique({
      where: { userId },
      include: { skills: true, experiences: true, education: true, certifications: true, languages: true, preferences: true },
    });

    res.json({ message: 'Profile updated successfully', student: updatedStudent });
  } catch (error) { next(error); }
};

const saveResumeData = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { resumeData } = req.body;

    const student = await prisma.student.upsert({
      where: { userId },
      update: { resumeData },
      create: { userId, resumeData }
    });
    res.json(student);
  } catch (error) { next(error); }
};

module.exports = {
  getProfile, updateProfile, batchUpdateProfile,
  addEducation, updateEducation, deleteEducation,
  addSkill, updateSkill, deleteSkill,
  addProject, updateProject, deleteProject,
  addCertification, updateCertification, deleteCertification,
  addExperience, updateExperience, deleteExperience,
  addLanguage, updateLanguage, deleteLanguage,
  uploadDocument, deleteDocument,
  updateSocialLinks, updatePreferences, saveResumeData
};
