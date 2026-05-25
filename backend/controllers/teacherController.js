const mongoose = require('mongoose');
const mlService = require('../services/mlService');
const xlsx = require('xlsx');

const getModels = () => ({
  Test: mongoose.model('Test'),
  Question: mongoose.model('Question'),
  TestAttempt: mongoose.model('TestAttempt'),
  Class: mongoose.model('Class'),
  User: mongoose.model('User'),
});

// ── CLASSES ──────────────────────────────────────────────────

exports.createClass = async (req, res) => {
  try {
    const { Class } = getModels();
    const { name, subjectCode, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Class name is required' });
    const cls = await Class.create({
      teacherId: req.user._id,
      name: name.trim(),
      subjectCode: subjectCode?.trim() || '',
      description: description?.trim() || '',
    });
    res.status(201).json({ message: 'Class created', class: cls });
  } catch (err) { console.error('CREATE CLASS ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

exports.getClasses = async (req, res) => {
  try {
    const { Class, Test } = getModels();
    const classes = await Class.find({ teacherId: req.user._id }).sort({ createdAt: -1 });
    // FIX #8: attach tests count + test list to each class
    const enriched = await Promise.all(classes.map(async (cls) => {
      const tests = await Test.find({ classId: cls._id }).select('title status duration attemptCount');
      return { ...cls.toObject(), tests };
    }));
    res.json({ classes: enriched });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteClass = async (req, res) => {
  try {
    const { Class } = getModels();
    await Class.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
    res.json({ message: 'Class deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// FIX #3: Edit class details
exports.updateClass = async (req, res) => {
  try {
    const { Class } = getModels();
    const { name, subjectCode, description } = req.body;
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user._id },
      { $set: { name: name?.trim(), subjectCode: subjectCode?.trim() || '', description: description?.trim() || '' } },
      { new: true }
    );
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class updated', class: cls });
  } catch (err) { console.error('UPDATE CLASS ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

// FIX #2: Smart Excel upload — handles any column layout, skips header/title rows
exports.uploadStudents = async (req, res) => {
  try {
    const { Class, User } = getModels();
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const cls = await Class.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

    console.log('Excel preview (first 4 rows):', JSON.stringify(rawRows.slice(0, 4)));

    // Enrollment number pattern: 2-5 letters + 5-10 digits (e.g. TCA2259040, BCA2364003)
    const enrollPattern = /^[A-Za-z]{2,5}\d{5,10}$/;

    // Find the actual data rows by scanning for enrollment number pattern
    let enrollCol = -1, nameCol = -1, emailCol = -1, dataStartRow = -1;

    for (let r = 0; r < rawRows.length; r++) {
      const row = rawRows[r];
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').trim();
        if (enrollPattern.test(val) && dataStartRow === -1) {
          // Found first enrollment number — this is the data start row
          dataStartRow = r;
          enrollCol = c;
          console.log(`Found enrollment at row ${r}, col ${c}: ${val}`);
          break;
        }
      }
      if (dataStartRow !== -1) break;
    }

    if (dataStartRow === -1 || enrollCol === -1) {
      return res.status(400).json({ message: 'Could not find enrollment numbers in the file. Make sure the file has enrollment numbers like TCA2259040.' });
    }

    // Now detect name and email columns by scanning header row above data
    // Check the row just before data for header labels
    const headerRow = dataStartRow > 0 ? rawRows[dataStartRow - 1] : [];
    headerRow.forEach((cell, i) => {
      const h = String(cell || '').toLowerCase().trim();
      if (h.includes('name')) nameCol = i;
      if (h.includes('email') || h.includes('mail')) emailCol = i;
    });

    // If header didn't give us columns, detect from data row pattern
    if (nameCol === -1 || emailCol === -1) {
      const firstDataRow = rawRows[dataStartRow];
      firstDataRow.forEach((cell, i) => {
        if (i === enrollCol) return;
        const val = String(cell || '').trim();
        if (emailCol === -1 && val.includes('@')) { emailCol = i; return; }
        if (nameCol === -1 && val.length > 1 && isNaN(val) && !enrollPattern.test(val)) { nameCol = i; }
      });
    }

    console.log('Detected columns — enroll:', enrollCol, 'name:', nameCol, 'email:', emailCol);

    let added = 0, skipped = 0;
    for (let r = dataStartRow; r < rawRows.length; r++) {
      const row = rawRows[r];
      const enrollmentNo = String(row[enrollCol] || '').trim().toUpperCase();
      if (!enrollmentNo || !enrollPattern.test(enrollmentNo)) { skipped++; continue; }

      const name  = nameCol  >= 0 ? String(row[nameCol]  || '').trim() : '';
      const email = emailCol >= 0 ? String(row[emailCol] || '').trim().toLowerCase() : '';

      // Skip duplicates
      if (cls.students.find(s => s.enrollmentNo.toUpperCase() === enrollmentNo)) { skipped++; continue; }

      const user = await User.findOne({ enrollmentNo: { $regex: new RegExp('^' + enrollmentNo + '$', 'i') } });
      cls.students.push({
        enrollmentNo,
        name: name || enrollmentNo,
        email: email || '',
        userId: user?._id || null,
        joinStatus: user ? 'joined' : 'pending',
        joinedAt: user ? new Date() : undefined,
      });
      added++;
      console.log('Added:', enrollmentNo, name);
    }

    await cls.save();
    console.log(`Upload complete: added=${added}, skipped=${skipped}, total=${cls.students.length}`);
    res.json({ message: `Successfully added ${added} students`, total: cls.students.length, skipped });
  } catch (err) { console.error('UPLOAD STUDENTS ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

// FIX #9: Returns empty array with hasStudents=false if no students uploaded
exports.getClassStudents = async (req, res) => {
  try {
    const { Test, TestAttempt, Class } = getModels();
    const cls = await Class.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    // FIX #9: if no students uploaded, tell frontend explicitly
    if (!cls.students || cls.students.length === 0) {
      return res.json({ students: [], className: cls.name, subjectCode: cls.subjectCode, hasStudents: false });
    }

    const tests = await Test.find({ classId: cls._id });
    const testIds = tests.map(t => t._id);

    const enriched = await Promise.all(cls.students.map(async (s) => {
      let testsTaken = 0, latestResult = null, mlCluster = null, flagged = false;
      if (s.userId) {
        const attempts = await TestAttempt.find({ studentId: s.userId, testId: { $in: testIds }, status: { $ne: 'in-progress' } }).sort({ createdAt: -1 });
        testsTaken = attempts.length;
        if (attempts.length > 0) {
          latestResult = {
            percentage: attempts[0].percentage,
            grade: attempts[0].grade,
            testTitle: tests.find(t => t._id.equals(attempts[0].testId))?.title,
          };
          mlCluster = attempts[0].mlFeedback?.level || null;
          flagged = attempts.some(a => a.flagged);
        }
      }
      return { enrollmentNo: s.enrollmentNo, name: s.name || '—', email: s.email || '—', joinStatus: s.joinStatus, testsTaken, latestResult, mlCluster, flagged };
    }));

    res.json({ students: enriched, className: cls.name, subjectCode: cls.subjectCode, hasStudents: true });
  } catch (err) { console.error('GET STUDENTS ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

// FIX #4: Edit individual student
exports.updateStudent = async (req, res) => {
  try {
    const { Class } = getModels();
    const cls = await Class.findOne({ _id: req.params.classId, teacherId: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    const student = cls.students.find(s => s.enrollmentNo.toUpperCase() === req.params.enrollmentNo.toUpperCase());
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (req.body.name)  student.name  = req.body.name.trim();
    if (req.body.email) student.email = req.body.email.trim().toLowerCase();
    await cls.save();
    res.json({ message: 'Student updated' });
  } catch (err) { console.error('UPDATE STUDENT ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

// FIX #4: Delete individual student
exports.deleteStudent = async (req, res) => {
  try {
    const { Class } = getModels();
    const cls = await Class.findOne({ _id: req.params.classId, teacherId: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    const before = cls.students.length;
    cls.students = cls.students.filter(s => s.enrollmentNo.toUpperCase() !== req.params.enrollmentNo.toUpperCase());
    if (cls.students.length === before) return res.status(404).json({ message: 'Student not found' });
    await cls.save();
    res.json({ message: 'Student removed' });
  } catch (err) { console.error('DELETE STUDENT ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

// Delete all students
exports.clearStudents = async (req, res) => {
  try {
    const { Class } = getModels();
    const cls = await Class.findOne({ _id: req.params.classId, teacherId: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    cls.students = [];
    await cls.save();
    res.json({ message: 'All students removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── TESTS ────────────────────────────────────────────────────

const autoExpireTests = async (Test) => {
  try {
    await Test.updateMany(
      { status: 'active', endTime: { $lt: new Date(), $ne: null } },
      { $set: { status: 'completed' } }
    );
  } catch (e) { console.error('Auto-expire error:', e.message); }
};

exports.createTest = async (req, res) => {
  try {
    const { Test, Question } = getModels();
    const { title, description, duration, startTime, endTime, questions: rawQs, classId } = req.body;
    if (!title || !duration || !rawQs?.length) return res.status(400).json({ message: 'Title, duration and questions required' });
    const test = await Test.create({
      teacherId: req.user._id,
      classId: classId || null,
      title, description,
      duration,
      startTime: startTime || null,
      endTime: endTime || null,
      totalMarks: rawQs.reduce((s, q) => s + (q.marks || 1), 0),
    });
    const savedQs = await Question.insertMany(rawQs.map(q => ({ ...q, testId: test._id })));
    test.questions = savedQs.map(q => q._id);
    await test.save();
    res.status(201).json({ message: 'Test created', test });
  } catch (err) { console.error('CREATE TEST ERROR:', err.message); res.status(500).json({ message: err.message }); }
};

exports.getTests = async (req, res) => {
  try {
    const { Test } = getModels();
    await autoExpireTests(Test);
    const tests = await Test.find({ teacherId: req.user._id }).sort({ createdAt: -1 });
    res.json({ tests });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteTest = async (req, res) => {
  try {
    const { Test, Question, TestAttempt } = getModels();
    const test = await Test.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!test) return res.status(404).json({ message: 'Test not found' });
    await Question.deleteMany({ testId: test._id });
    await TestAttempt.deleteMany({ testId: test._id });
    await Test.deleteOne({ _id: test._id });
    res.json({ message: 'Test deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.publishTest = async (req, res) => {
  try {
    const { Test } = getModels();
    const test = await Test.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!test) return res.status(404).json({ message: 'Test not found' });
    if (!test.questions.length) return res.status(400).json({ message: 'Add questions before publishing' });
    test.status = 'active';
    await test.save();
    res.json({ message: 'Test published', test });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getTestResults = async (req, res) => {
  try {
    const { Test, TestAttempt } = getModels();
    const test = await Test.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!test) return res.status(404).json({ message: 'Not found' });
    const attempts = await TestAttempt.find({ testId: test._id })
      .populate('studentId', 'name email enrollmentNo studentId')
      .sort({ createdAt: -1 });
    const results = attempts.map(a => ({
      studentName: a.studentId?.name,
      studentEmail: a.studentId?.email,
      rollNumber: a.studentId?.enrollmentNo || a.studentId?.studentId,
      totalMarks: a.totalScore,
      maxMarks: a.maxScore,
      percentage: a.percentage,
      grade: a.grade,
      status: a.status,
      flagged: a.flagged,
      mlLevel: a.mlFeedback?.level || null,
      attemptId: a._id,
    }));
    res.json({ results, testTitle: test.title });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// FIX #5: ML Insights — fully working
// PATCH — replace ONLY the getMLInsights function in your teacherController.js
// Find: exports.getMLInsights = async (req, res) => {
// Replace the entire function with this:

exports.getMLInsights = async (req, res) => {
  try {
    const testId = req.params.id;

    // Validate ObjectId before querying
    if (!testId || testId === 'undefined' || testId.length !== 24) {
      return res.status(400).json({ message: 'Invalid test ID' });
    }

    const Test = require('../models/Test');
    const Attempt = require('../models/Attempt');

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const attempts = await Attempt.find({ testId }).lean();

    // ── Build insights from real data ────────────────────────────
    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / totalAttempts * 10) / 10
      : 0;

    const flaggedCount = attempts.filter(a => a.flagged).length;

    // Score distribution buckets
    const buckets = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
    attempts.forEach(a => {
      const p = a.percentage || 0;
      if (p <= 20) buckets[0]++;
      else if (p <= 40) buckets[1]++;
      else if (p <= 60) buckets[2]++;
      else if (p <= 80) buckets[3]++;
      else buckets[4]++;
    });

    const scoreDistribution = [
      { range: '0–20%', count: buckets[0] },
      { range: '21–40%', count: buckets[1] },
      { range: '41–60%', count: buckets[2] },
      { range: '61–80%', count: buckets[3] },
      { range: '81–100%', count: buckets[4] },
    ];

    // K-Means style clustering
    const struggling = attempts.filter(a => (a.percentage || 0) < 40).length;
    const advanced = attempts.filter(a => (a.percentage || 0) >= 75).length;
    const average = totalAttempts - struggling - advanced;

    const clusterCounts = { Struggling: struggling, Average: average, Advanced: advanced };

    // Topic accuracy from questionResults
    const topicMap = {};
    attempts.forEach(a => {
      (a.questionResults || []).forEach(qr => {
        const topic = qr.topic || 'General';
        if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
        topicMap[topic].total++;
        if (qr.isCorrect) topicMap[topic].correct++;
      });
    });

    const topicAccuracy = Object.entries(topicMap).map(([topic, d]) => ({
      topic,
      accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0
    }));

    const weakTopics = topicAccuracy.filter(t => t.accuracy < 50).map(t => t.topic);
    const strongTopics = topicAccuracy.filter(t => t.accuracy >= 70).map(t => t.topic);

    // Question difficulty (Random Forest simulation)
    const questionStats = {};
    attempts.forEach(a => {
      (a.questionResults || []).forEach(qr => {
        const qid = qr.questionId?.toString();
        if (!qid) return;
        if (!questionStats[qid]) questionStats[qid] = { text: qr.question, topic: qr.topic || 'General', correct: 0, total: 0 };
        questionStats[qid].total++;
        if (qr.isCorrect) questionStats[qid].correct++;
      });
    });

    const questions = Object.entries(questionStats).map(([, q]) => {
      const cr = q.total > 0 ? Math.round((q.correct / q.total) * 100) : null;
      const difficultyLabel = cr == null ? 'unrated' : cr >= 70 ? 'easy' : cr >= 40 ? 'medium' : 'hard';
      return { text: q.text, topic: q.topic, difficultyLabel, correctRate: cr, attemptCount: q.total };
    });

    // Question difficulty summary
    const questionDifficulty = [
      { label: 'Easy', count: questions.filter(q => q.difficultyLabel === 'easy').length },
      { label: 'Medium', count: questions.filter(q => q.difficultyLabel === 'medium').length },
      { label: 'Hard', count: questions.filter(q => q.difficultyLabel === 'hard').length },
    ];

    // Score trend (chronological — group by submission date)
    const byDate = {};
    attempts.forEach(a => {
      const d = new Date(a.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(a.percentage || 0);
    });
    const scoreTrend = Object.entries(byDate).map(([label, scores]) => ({
      label,
      avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
    }));

    // If test has questions but no attempts, return structure with 0s
    const testQuestions = (test.questions || []).map(q => ({
      text: q.question,
      topic: q.topic || 'General',
      difficultyLabel: 'unrated',
      correctRate: null,
      attemptCount: 0
    }));

    res.json({
      testTitle: test.title,
      totalAttempts,
      avgScore,
      flaggedCount,
      struggling,
      average,
      advanced,
      clusterCounts,
      scoreDistribution,
      topicAccuracy: topicAccuracy.length > 0 ? topicAccuracy : [],
      weakTopics,
      strongTopics,
      questions: questions.length > 0 ? questions : testQuestions,
      questionDifficulty,
      scoreTrend,
    });

  } catch (err) {
    console.error('ML INSIGHTS ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
};
exports.exportResults = async (req, res) => {
  try {
    const { Test, TestAttempt } = getModels();
    const test = await Test.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!test) return res.status(404).json({ message: 'Not found' });
    const attempts = await TestAttempt.find({ testId: test._id })
      .populate('studentId', 'name email enrollmentNo studentId');
    const rows = [
      ['Name', 'Email', 'Enrollment No', 'Score', 'Max', 'Percentage', 'Grade', 'ML Level', 'Status', 'Flagged'],
      ...attempts.map(a => [
        a.studentId?.name, a.studentId?.email,
        a.studentId?.enrollmentNo || a.studentId?.studentId,
        a.totalScore, a.maxScore, a.percentage?.toFixed(2),
        a.grade, a.mlFeedback?.level || 'N/A', a.status,
        a.flagged ? 'Yes' : 'No',
      ]),
    ];
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, 'Results');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="results_${test.title}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) { res.status(500).json({ message: err.message }); }
};