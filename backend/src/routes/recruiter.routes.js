const express = require('express');
const { getRecruiterProfile, updateRecruiterProfile, getDashboardStats } = require('../controllers/recruiter.controller');
const {
  createJob, getMyJobs, getJobById, updateJob, deleteJob,
  getApplicationsForJob, getAllCandidates, updateApplicationStatus,
} = require('../controllers/job.controller');
const {
  createQuestion, getQuestions, getQuestionById, updateQuestion, deleteQuestion,
  createTest, getTests, getTestById, updateTest, deleteTest,
  duplicateTest, publishTest, archiveTest, assignTestToJobs,
  getTestResults, getTestAnalytics
} = require('../controllers/test.controller');
const { authenticateUser, authorizeRole } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticateUser);
router.use(authorizeRole('RECRUITER'));

// Dashboard & Profile
router.get('/dashboard', getDashboardStats);
router.get('/profile', getRecruiterProfile);
router.put('/profile', updateRecruiterProfile);

// Jobs
router.post('/jobs', createJob);
router.get('/jobs', getMyJobs);
router.get('/jobs/:id', getJobById);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

// Applications / Candidates
router.get('/jobs/:jobId/applications', getApplicationsForJob);
router.get('/candidates', getAllCandidates);
router.put('/applications/:appId/status', updateApplicationStatus);

// Questions (Question Bank)
router.post('/questions', createQuestion);
router.get('/questions', getQuestions);
router.get('/questions/:id', getQuestionById);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// Tests
router.post('/tests', createTest);
router.get('/tests', getTests);
router.get('/tests/:id', getTestById);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);
router.post('/tests/:id/duplicate', duplicateTest);
router.post('/tests/:id/publish', publishTest);
router.post('/tests/:id/archive', archiveTest);
router.post('/tests/:id/assign', assignTestToJobs);

// Results & Analytics
router.get('/tests/:id/results', getTestResults);
router.get('/tests/:id/analytics', getTestAnalytics);

module.exports = router;
