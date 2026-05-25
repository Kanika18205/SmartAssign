const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('../controllers/teacherController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
router.use(protect, requireRole('teacher'));

// Classes
router.post('/classes', ctrl.createClass);
router.get('/classes', ctrl.getClasses);
router.put('/class/:id', ctrl.updateClass);           // FIX #3: edit class
router.delete('/class/:id', ctrl.deleteClass);

// Students in class
router.post('/class/:id/upload-students', upload.single('file'), ctrl.uploadStudents);
router.get('/class/:id/students', ctrl.getClassStudents);
router.put('/class/:classId/student/:enrollmentNo', ctrl.updateStudent);   // FIX #4: edit student
router.delete('/class/:classId/student/:enrollmentNo', ctrl.deleteStudent); // FIX #4: delete student
router.delete('/class/:classId/students', ctrl.clearStudents);

// Tests
router.post('/create-test', ctrl.createTest);
router.get('/tests', ctrl.getTests);
router.delete('/test/:id', ctrl.deleteTest);
router.post('/test/:id/publish', ctrl.publishTest);
router.get('/test/:id/results', ctrl.getTestResults);
router.get('/test/:id/ml-insights', ctrl.getMLInsights);
router.get('/test/:id/export', ctrl.exportResults);

module.exports = router;