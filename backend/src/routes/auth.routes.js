const express = require('express');
const { googleLogin, refresh, logout, getMe, completeProfile } = require('../controllers/auth.controller');
const { authenticateUser } = require('../middlewares/auth');

const router = express.Router();

router.post('/google', googleLogin);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticateUser, getMe);
router.post('/complete-profile', authenticateUser, completeProfile);

module.exports = router;
