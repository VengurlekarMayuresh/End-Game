const express = require('express');
const { login, getProfile } = require('../controllers/admin.controller');
const { authenticateUser, authorizeRole } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', login);

// Protected routes
router.get('/profile', authenticateUser, authorizeRole('ADMIN'), getProfile);

module.exports = router;
