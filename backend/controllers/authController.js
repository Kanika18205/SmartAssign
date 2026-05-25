const User = require('../models/User');
const Class = require('../models/Class');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '7d' });

exports.register = async (req, res) => {
  try {
    const { name, password, role, enrollmentNo, email } = req.body;
    if (!name || !password || !role) return res.status(400).json({ message: 'Name, password and role are required' });

    if (role === 'student') {
      if (!enrollmentNo) return res.status(400).json({ message: 'Enrollment number is required' });
      const cleanEnroll = enrollmentNo.trim().toUpperCase();
      const cls = await Class.findOne({ 'students.enrollmentNo': { $regex: new RegExp('^' + cleanEnroll + '$', 'i') } });
      if (!cls) return res.status(400).json({ message: 'Enrollment number not found. Ask your teacher to upload the student list first.' });
      const existing = await User.findOne({ enrollmentNo: { $regex: new RegExp('^' + cleanEnroll + '$', 'i') } });
      if (existing) return res.status(400).json({ message: 'This enrollment number is already registered. Please login.' });
      const user = await User.create({ name: name.trim(), enrollmentNo: cleanEnroll, studentId: cleanEnroll, email: email?.trim().toLowerCase() || '', password, role: 'student', classId: cls._id, isVerified: true });
      const entry = cls.students.find(s => s.enrollmentNo.toUpperCase() === cleanEnroll);
      if (entry) { entry.userId = user._id; entry.joinStatus = 'joined'; entry.joinedAt = new Date(); if (!entry.name || entry.name === cleanEnroll) entry.name = name.trim(); await cls.save(); }
      const token = generateToken(user._id);
      return res.status(201).json({ message: 'Registered successfully', token, user: { id: user._id, name: user.name, enrollmentNo: user.enrollmentNo, role: user.role, classId: cls._id } });
    } else {
      if (!email) return res.status(400).json({ message: 'Email is required for teachers' });
      const existing = await User.findOne({ email: email.trim().toLowerCase() });
      if (existing) {
        if (!existing.isVerified) {
          const otp = generateOTP(); existing.otp = otp; existing.otpExpiry = new Date(Date.now() + 10*60*1000); await existing.save();
          try { await emailService.sendOTP(email, name, otp); } catch(e) { console.log('Teacher OTP (email failed):', otp); }
          return res.status(200).json({ message: 'OTP resent to your email.' });
        }
        return res.status(400).json({ message: 'Email already registered. Please login.' });
      }
      const otp = generateOTP(); console.log('Teacher OTP:', otp);
      await User.create({ name: name.trim(), email: email.trim().toLowerCase(), password, role: 'teacher', otp, otpExpiry: new Date(Date.now() + 10*60*1000), isVerified: false });
      try { await emailService.sendOTP(email, name, otp); } catch(e) { console.log('OTP email failed, OTP:', otp); }
      return res.status(201).json({ message: 'OTP sent to your email. Please verify to complete registration.' });
    }
  } catch (err) { console.error('REGISTER ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified. Please login.' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    user.isVerified = true; user.otp = undefined; user.otpExpiry = undefined; await user.save();
    res.json({ message: 'Email verified! You can now login.' });
  } catch (err) { console.error('VERIFY OTP ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });
    const otp = generateOTP(); user.otp = otp; user.otpExpiry = new Date(Date.now() + 10*60*1000); await user.save();
    console.log('Resend OTP:', otp);
    try { await emailService.sendOTP(email, user.name, otp); } catch(e) { console.log('OTP email failed, OTP:', otp); }
    res.json({ message: 'New OTP sent' });
  } catch (err) { console.error('RESEND OTP ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

exports.login = async (req, res) => {
  try {
    const { enrollmentNo, email, password, role } = req.body;
    console.log('Login attempt:', { enrollmentNo, email, role });
    let user;
    if (enrollmentNo) {
      const cleanEnroll = enrollmentNo.trim().toUpperCase();
      user = await User.findOne({ enrollmentNo: { $regex: new RegExp('^' + cleanEnroll + '$', 'i') } });
      if (!user) return res.status(400).json({ message: 'Enrollment number not registered. Please register first.' });
      if (user.role !== 'student') return res.status(400).json({ message: 'This is not a student account.' });
    } else {
      if (!email) return res.status(400).json({ message: 'Email is required' });
      user = await User.findOne({ email: email.trim().toLowerCase() });
      if (!user) return res.status(400).json({ message: 'No account found with this email' });
      if (user.role !== 'teacher') return res.status(400).json({ message: 'This email belongs to a student. Use enrollment number to login as student.' });
      if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email with OTP first' });
    }
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Incorrect password' });
    const token = generateToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, enrollmentNo: user.enrollmentNo, role: user.role, classId: user.classId } });
  } catch (err) { console.error('LOGIN ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() });
    if (!user || !user.isVerified) return res.json({ message: 'If that email exists, a reset link was sent.' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenExpiry = new Date(Date.now() + 30*60*1000); await user.save();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    try { await emailService.sendPasswordReset(email, user.name, resetUrl); } catch(e) { console.error('Reset email err:', e.message); }
    res.json({ message: 'Reset link sent to your email' });
  } catch (err) { console.error('FORGOT PASSWORD ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetToken: hashedToken, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired' });
    user.password = req.body.password; user.resetToken = undefined; user.resetTokenExpiry = undefined; await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) { console.error('RESET PASSWORD ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

exports.getMe = async (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, enrollmentNo: req.user.enrollmentNo, role: req.user.role, classId: req.user.classId } });
};