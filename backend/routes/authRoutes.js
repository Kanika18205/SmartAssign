const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', ctrl.register);
router.post('/verify-otp', ctrl.verifyOTP);
router.post('/resend-otp', ctrl.resendOTP);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password/:token', ctrl.resetPassword);
router.get('/me', protect, ctrl.getMe);

module.exports = router;
