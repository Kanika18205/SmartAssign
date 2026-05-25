const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.use(protect, requireRole('student'));

router.get('/tests',                    ctrl.getAvailableTests);
router.post('/test/:id/start',          ctrl.startTest);
router.post('/test/:id/submit',         ctrl.submitTest);
router.get('/results',                  ctrl.getMyResults);
router.get('/result/:attemptId',        ctrl.getAttemptDetail);
router.get('/performance',              ctrl.getPerformance);

module.exports = router;