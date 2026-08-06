const express = require('express');
const { getRecruiterProfile, updateRecruiterProfile, getDashboardStats } = require('../controllers/recruiter.controller');
const {
  createJob, getMyJobs, getJobById, updateJob, deleteJob,
  getApplicationsForJob, getAllCandidates, updateApplicationStatus,
} = require('../controllers/job.controller');
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

module.exports = router;
