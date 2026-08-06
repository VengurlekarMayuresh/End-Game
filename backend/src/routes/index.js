const express = require('express');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'API is running' }));
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
