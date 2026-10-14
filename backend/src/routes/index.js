const express = require('express');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const studentRoutes = require('./student.routes');
const recruiterRoutes = require('./recruiter.routes');
const { internalSubmitReport } = require('../controllers/aiInterview.controller');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'API is running' }));
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/student', studentRoutes);
router.use('/recruiter', recruiterRoutes);

// Internal webhook — called by interview platform (port 3000) server-to-server
router.post('/internal/interview-report', internalSubmitReport);

module.exports = router;
