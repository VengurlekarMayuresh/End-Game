const express = require('express');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const studentRoutes = require('./student.routes');
const recruiterRoutes = require('./recruiter.routes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'API is running' }));
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/student', studentRoutes);
router.use('/recruiter', recruiterRoutes);

module.exports = router;
