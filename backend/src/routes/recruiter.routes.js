const express = require('express');
const { getRecruiterProfile, updateRecruiterProfile, getDashboardStats } = require('../controllers/recruiter.controller');
const {
  createJob, getMyJobs, getJobById, updateJob, deleteJob,
  getApplicationsForJob, getAllCandidates, updateApplicationStatus,
  analyzeJobDescriptionController,
  getCandidateMatchScores,
  getSingleCandidateMatchScore,
  updateApplicationShortlistStatus,
  bulkUpdateShortlistStatus,
} = require('../controllers/job.controller');
const {
  createQuestion, getQuestions, getQuestionById, updateQuestion, deleteQuestion,
  bulkCreateQuestions,
  createTest, getTests, getTestById, updateTest, deleteTest,
  duplicateTest, publishTest, archiveTest, assignTestToJobs,
  getTestResults, getTestAnalytics, sendTestResultEmails
} = require('../controllers/test.controller');
const {
  createCodingAssessment, getCodingAssessments, getCodingAssessmentById,
  updateCodingAssessment, deleteCodingAssessment, duplicateCodingAssessment,
  publishCodingAssessment, archiveCodingAssessment, assignCodingAssessmentToJobs,
  createCodingProblem, updateCodingProblem, deleteCodingProblem,
  getCodingResults, sendCodingResultEmails
} = require('../controllers/coding.controller');
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

// Job Analysis & Resume Shortlisting
router.post('/jobs/analyze', analyzeJobDescriptionController);
router.get('/jobs/:jobId/match-scores', getCandidateMatchScores);
router.get('/jobs/:jobId/students/:studentId/match-score', getSingleCandidateMatchScore);
router.put('/applications/:appId/shortlist-status', updateApplicationShortlistStatus);
router.put('/bulk-shortlist', bulkUpdateShortlistStatus);

// Questions (Question Bank)
router.post('/questions', createQuestion);
router.post('/questions/bulk', bulkCreateQuestions);
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
router.post('/tests/:id/send-result-emails', sendTestResultEmails);

// Coding Assessments
router.post('/coding-assessments', createCodingAssessment);
router.get('/coding-assessments', getCodingAssessments);
router.get('/coding-assessments/:id', getCodingAssessmentById);
router.put('/coding-assessments/:id', updateCodingAssessment);
router.delete('/coding-assessments/:id', deleteCodingAssessment);
router.post('/coding-assessments/:id/duplicate', duplicateCodingAssessment);
router.post('/coding-assessments/:id/publish', publishCodingAssessment);
router.post('/coding-assessments/:id/archive', archiveCodingAssessment);
router.post('/coding-assessments/:id/assign', assignCodingAssessmentToJobs);
router.get('/coding-assessments/:id/results', getCodingResults);
router.post('/coding-assessments/:id/send-result-emails', sendCodingResultEmails);

// Coding Problems
router.post('/coding-assessments/:assessmentId/problems', createCodingProblem);
router.put('/coding-problems/:id', updateCodingProblem);
router.delete('/coding-problems/:id', deleteCodingProblem);

// Module 13.5: Assign Candidate, Overview & Advance to Next Round (GD / Interview)
const {
  assignSessionForCandidate,
  getResultsByApplicationId,
  advanceCandidateToNextRound,
  getRecruiterAptitudeOverview
} = require('../controllers/resumeAptitude.controller');

router.get('/resume-aptitude/overview', getRecruiterAptitudeOverview);
router.post('/assign-resume-aptitude', assignSessionForCandidate);
router.get('/resume-aptitude/application/:applicationId/results', getResultsByApplicationId);
router.post('/resume-aptitude/application/:applicationId/advance', advanceCandidateToNextRound);

module.exports = router;

