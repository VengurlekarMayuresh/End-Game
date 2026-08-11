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

// Jobs Helper (Student Job Portal Integration)
const {
  getStudentJobs, getStudentJobById, applyToJob, getStudentApplications,
  getStudentTests, getStudentTestById, startTestAttempt, saveTestAttempt, submitTestAttempt
} = require('../controllers/test.controller');
const {
  getStudentCodingAssessments, getStudentCodingAssessmentById, startCodingAttempt,
  saveCodingDraft, getCodingDraft, runCodingCode, submitCodingCode, submitCodingAssessment
} = require('../controllers/coding.controller');

router.get('/jobs', getStudentJobs);
router.get('/jobs/:id', getStudentJobById);
router.post('/jobs/:jobId/apply', applyToJob);
router.get('/applications', getStudentApplications);

// Aptitude Tests
router.get('/tests', getStudentTests);
router.get('/tests/:id', getStudentTestById);
router.post('/tests/:id/start', startTestAttempt);
router.post('/tests/:id/attempts/:attemptId/save', saveTestAttempt);
router.post('/tests/:id/attempts/:attemptId/submit', submitTestAttempt);

// Coding Assessments
router.get('/coding-assessments', getStudentCodingAssessments);
router.get('/coding-assessments/:id', getStudentCodingAssessmentById);
router.post('/coding-assessments/:id/start', startCodingAttempt);
router.post('/coding-assessments/:id/attempts/:attemptId/submit', submitCodingAssessment);
router.post('/coding-assessments/:id/problems/:problemId/autosave', saveCodingDraft);
router.get('/coding-assessments/:id/problems/:problemId/autosave', getCodingDraft);
router.post('/coding-assessments/:id/problems/:problemId/run', runCodingCode);
router.post('/coding-assessments/:id/problems/:problemId/submit', submitCodingCode);

module.exports = router;
