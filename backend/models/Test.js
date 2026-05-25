const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  testId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  text:            { type: String, required: true },
  options:         { A: String, B: String, C: String, D: String },
  correctAnswer:   { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  marks:           { type: Number, default: 1 },
  topic:           { type: String, default: 'General' },
  // ML-assigned fields (updated after first attempt batch)
  difficultyLabel: { type: String, enum: ['easy', 'medium', 'hard', 'unrated'], default: 'unrated' },
  difficultyScore: { type: Number, default: 0 },
  // Stats for ML training
  attemptCount:    { type: Number, default: 0 },
  correctCount:    { type: Number, default: 0 },
  totalTimeTaken:  { type: Number, default: 0 }, // seconds, for avg time calc
});

const testSchema = new mongoose.Schema({
  teacherId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  duration:     { type: Number, required: true, min: 1 }, // minutes
  startTime:    { type: Date },
  endTime:      { type: Date },
  status:       { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
  questions:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  totalMarks:   { type: Number, default: 0 },
  attemptCount: { type: Number, default: 0 },
}, { timestamps: true, strictPopulate: false });

const Question = mongoose.model('Question', questionSchema);
const Test = mongoose.model('Test', testSchema);

module.exports = { Test, Question };