const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  questionId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  questionText:    { type: String },
  selectedAnswer:  { type: String },
  correctAnswer:   { type: String },
  isCorrect:       { type: Boolean, default: false },
  topic:           { type: String, default: 'General' },
  difficultyLabel: { type: String, default: 'unrated' },
  timeTaken:       { type: Number, default: 0 },
});

const testAttemptSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  status:      { type: String, enum: ['in-progress', 'submitted', 'auto-submitted'], default: 'in-progress' },
  responses:   [responseSchema],
  totalScore:  { type: Number, default: 0 },
  maxScore:    { type: Number, default: 0 },
  percentage:  { type: Number, default: 0 },
  grade:       { type: String, default: 'F' },
  flagged:     { type: Boolean, default: false },
  tabSwitches: { type: Number, default: 0 },
  mlFeedback:  { type: mongoose.Schema.Types.Mixed },
  startedAt:   { type: Date, default: Date.now },
  submittedAt: { type: Date },
}, { timestamps: true });

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);

module.exports = { TestAttempt };