const mongoose = require('mongoose');
const mlService = require('../services/mlService');
const emailService = require('../services/emailService');

const getModels = () => ({
  Test:        mongoose.model('Test'),
  Question:    mongoose.model('Question'),
  TestAttempt: mongoose.model('TestAttempt'),
  User:        mongoose.model('User'),
});

// GET /api/student/tests
exports.getAvailableTests = async (req, res) => {
  try {
    const { Test, TestAttempt } = getModels();
    const now = new Date();

    await Test.updateMany(
      { status: 'active', endTime: { $lt: now, $ne: null } },
      { $set: { status: 'completed' } }
    );

    // Show tests for student's class AND tests with no class assigned
    let tests;
    if (req.user.classId) {
      tests = await Test.find({
        status: 'active',
        $or: [
          { classId: req.user.classId },
          { classId: null },
          { classId: { $exists: false } },
        ],
        $and: [{ $or: [{ endTime: null }, { endTime: { $gte: now } }] }],
      }).select('title description duration startTime endTime totalMarks classId');
    } else {
      tests = await Test.find({
        status: 'active',
        $or: [{ classId: null }, { classId: { $exists: false } }],
        $and: [{ $or: [{ endTime: null }, { endTime: { $gte: now } }] }],
      }).select('title description duration startTime endTime totalMarks classId');
    }

    const myAttempts = await TestAttempt.find({
      studentId: req.user._id,
      status: { $ne: 'in-progress' },
    }).select('testId');

    const attempted = new Set(myAttempts.map(a => a.testId.toString()));
    const available = tests.filter(t => !attempted.has(t._id.toString()));

    console.log(`Student ${req.user.enrollmentNo} — classId: ${req.user.classId} — found ${available.length} tests`);
    res.json({ tests: available });
  } catch (err) {
    console.error('GET AVAILABLE TESTS ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/student/test/:id/start
exports.startTest = async (req, res) => {
  try {
    const { Test, Question, TestAttempt } = getModels();
    const test = await Test.findOne({ _id: req.params.id, status: 'active' });
    if (!test) return res.status(404).json({ message: 'Test not found or not active' });

    const existing = await TestAttempt.findOne({ studentId: req.user._id, testId: test._id });
    if (existing && existing.status !== 'in-progress') return res.status(400).json({ message: 'You have already attempted this test' });
    if (existing) {
      const questions = await Question.find({ testId: test._id });
      return res.json({ attempt: existing, test, questions });
    }

    const questions = await Question.find({ testId: test._id });
    const shuffled  = [...questions].sort(() => Math.random() - 0.5);

    const attempt = await TestAttempt.create({
      studentId:  req.user._id,
      testId:     test._id,
      status:     'in-progress',
      startedAt:  new Date(),
      maxScore:   test.totalMarks || questions.length,
      responses:  [],
    });

    res.json({
      attempt,
      test: { _id: test._id, title: test.title, duration: test.duration, totalMarks: test.totalMarks },
      questions: shuffled.map(q => ({ _id: q._id, text: q.text, options: q.options, marks: q.marks, topic: q.topic, difficultyLabel: q.difficultyLabel })),
    });
  } catch (err) {
    console.error('START TEST ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/student/test/:id/submit
exports.submitTest = async (req, res) => {
  try {
    const { Test, Question, TestAttempt } = getModels();
    const { answers, tabSwitches = 0 } = req.body;

    const attempt = await TestAttempt.findOne({ studentId: req.user._id, testId: req.params.id });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found. Start the test first.' });
    if (attempt.status !== 'in-progress') return res.status(400).json({ message: 'Test already submitted' });

    const test      = await Test.findById(req.params.id);
    const questions = await Question.find({ testId: req.params.id });

    let totalScore = 0;
    const responses    = [];
    const topicScores  = {};

    for (const q of questions) {
      const selected  = answers?.[q._id.toString()];
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) totalScore += q.marks || 1;

      if (!topicScores[q.topic]) topicScores[q.topic] = { correct: 0, total: 0 };
      topicScores[q.topic].total++;
      if (isCorrect) topicScores[q.topic].correct++;

      responses.push({ questionId: q._id, questionText: q.text, selectedAnswer: selected || null, correctAnswer: q.correctAnswer, isCorrect, topic: q.topic, difficultyLabel: q.difficultyLabel });

      Question.findByIdAndUpdate(q._id, { $inc: { attemptCount: 1, correctCount: isCorrect ? 1 : 0 } }).catch(() => {});
    }

    const maxScore   = test.totalMarks || questions.length;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;
    const grade      = percentage >= 90 ? 'A' : percentage >= 75 ? 'B' : percentage >= 60 ? 'C' : percentage >= 40 ? 'D' : 'F';
    const flagged    = tabSwitches >= 3;

    const topicAccuracy = {};
    Object.entries(topicScores).forEach(([t, s]) => { topicAccuracy[t] = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0; });

    const weakTopics   = Object.entries(topicAccuracy).filter(([, v]) => v < 50).map(([k]) => k);
    const strongTopics = Object.entries(topicAccuracy).filter(([, v]) => v >= 70).map(([k]) => k);

    let mlFeedback = {
      level:        percentage >= 75 ? 'Advanced' : percentage >= 40 ? 'Intermediate' : 'Beginner',
      summary:      `You scored ${percentage}% (${totalScore}/${maxScore} marks). Grade: ${grade}.`,
      weakTopics,
      strongTopics,
      topicAccuracy,
      tips: weakTopics.map(t => `Review ${t} concepts and practice more questions.`),
    };

    try {
      const ml = await mlService.generateFeedback({ percentage, grade, topicAccuracy, weakTopics, strongTopics });
      if (ml) mlFeedback = ml;
    } catch (e) { /* use fallback above */ }

    attempt.responses   = responses;
    attempt.totalScore  = totalScore;
    attempt.maxScore    = maxScore;
    attempt.percentage  = percentage;
    attempt.grade       = grade;
    attempt.status      = 'submitted';
    attempt.submittedAt = new Date();
    attempt.flagged     = flagged;
    attempt.mlFeedback  = mlFeedback;
    await attempt.save();

    Test.findByIdAndUpdate(req.params.id, { $inc: { attemptCount: 1 } }).catch(() => {});

    if (req.user.email) {
      emailService.sendTestResult?.(req.user.email, req.user.name, { testTitle: test.title, totalScore, maxScore, percentage, grade }).catch(() => {});
    }

    res.json({ message: 'Test submitted successfully', attemptId: attempt._id, totalScore, maxScore, percentage, grade, flagged });
  } catch (err) {
    console.error('SUBMIT TEST ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/student/results
exports.getMyResults = async (req, res) => {
  try {
    const { TestAttempt, Test } = getModels();
    const attempts = await TestAttempt.find({ studentId: req.user._id, status: { $ne: 'in-progress' } }).sort({ createdAt: -1 });
    const results = await Promise.all(attempts.map(async a => {
      const test = await Test.findById(a.testId).select('title');
      return { attemptId: a._id, testTitle: test?.title || 'Unknown', totalScore: a.totalScore, maxScore: a.maxScore, percentage: a.percentage, grade: a.grade, status: a.status, flagged: a.flagged, mlLevel: a.mlFeedback?.level || null, submittedAt: a.submittedAt };
    }));
    res.json({ results });
  } catch (err) {
    console.error('GET RESULTS ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentResults = exports.getMyResults;

// GET /api/student/result/:attemptId
exports.getAttemptDetail = async (req, res) => {
  try {
    const { TestAttempt, Test } = getModels();
    const attempt = await TestAttempt.findOne({ _id: req.params.attemptId, studentId: req.user._id });
    if (!attempt) return res.status(404).json({ message: 'Result not found' });
    const test = await Test.findById(attempt.testId).select('title duration totalMarks');
    res.json({ attempt: { _id: attempt._id, totalScore: attempt.totalScore, maxScore: attempt.maxScore, percentage: attempt.percentage, grade: attempt.grade, flagged: attempt.flagged, submittedAt: attempt.submittedAt }, test, mlFeedback: attempt.mlFeedback, responses: attempt.responses });
  } catch (err) {
    console.error('GET ATTEMPT DETAIL ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/student/performance
exports.getPerformance = async (req, res) => {
  try {
    const { TestAttempt } = getModels();
    const attempts = await TestAttempt.find({ studentId: req.user._id, status: 'submitted' }).sort({ createdAt: 1 });
    const avg  = attempts.length ? attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length : 0;
    const best = attempts.length ? Math.max(...attempts.map(a => a.percentage)) : 0;
    res.json({ totalAttempts: attempts.length, avgScore: Math.round(avg * 10) / 10, bestScore: best, trend: attempts.map(a => ({ date: a.submittedAt, percentage: a.percentage })) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};