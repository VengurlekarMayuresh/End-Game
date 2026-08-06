const express = require('express');
const { getProfile, updateProfile, addEducation, addProject, uploadDocument } = require('../controllers/student.controller');
const { authenticateUser, authorizeRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

// All student routes require STUDENT role
router.use(authenticateUser);
router.use(authorizeRole('STUDENT'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.post('/education', addEducation);
router.post('/projects', addProject);

// Document upload route
router.post('/documents/upload', upload.single('file'), uploadDocument);

module.exports = router;
