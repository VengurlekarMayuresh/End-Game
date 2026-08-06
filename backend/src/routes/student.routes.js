const express = require('express');
const {
  getProfile, updateProfile,
  addEducation, updateEducation, deleteEducation,
  addSkill, updateSkill, deleteSkill,
  addProject, updateProject, deleteProject,
  addCertification, updateCertification, deleteCertification,
  addExperience, updateExperience, deleteExperience,
  addLanguage, updateLanguage, deleteLanguage,
  uploadDocument, deleteDocument,
  updateSocialLinks, updatePreferences,
} = require('../controllers/student.controller');
const { authenticateUser, authorizeRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

// All student routes require STUDENT role
router.use(authenticateUser);
router.use(authorizeRole('STUDENT'));

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Education
router.post('/education', addEducation);
router.put('/education/:id', updateEducation);
router.delete('/education/:id', deleteEducation);

// Skills
router.post('/skills', addSkill);
router.put('/skills/:id', updateSkill);
router.delete('/skills/:id', deleteSkill);

// Projects
router.post('/projects', addProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// Certifications
router.post('/certifications', addCertification);
router.put('/certifications/:id', updateCertification);
router.delete('/certifications/:id', deleteCertification);

// Experience
router.post('/experience', addExperience);
router.put('/experience/:id', updateExperience);
router.delete('/experience/:id', deleteExperience);

// Languages
router.post('/languages', addLanguage);
router.put('/languages/:id', updateLanguage);
router.delete('/languages/:id', deleteLanguage);

// Documents
router.post('/documents/upload', upload.single('file'), uploadDocument);
router.delete('/documents/:id', deleteDocument);

// Social Links
router.put('/social-links', updateSocialLinks);

// Preferences
router.put('/preferences', updatePreferences);

module.exports = router;
