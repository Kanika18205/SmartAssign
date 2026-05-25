const mongoose = require('mongoose');

const enrolledStudentSchema = new mongoose.Schema({
  enrollmentNo: { type: String, required: true },
  name:         { type: String, default: '' },
  email:        { type: String, default: '' },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  joinStatus:   { type: String, enum: ['pending', 'joined'], default: 'pending' },
  joinedAt:     { type: Date },
});

const classSchema = new mongoose.Schema({
  teacherId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, required: true, trim: true },
  subjectCode:   { type: String, trim: true, default: '' },
  description:   { type: String, default: '' },
  students:      [enrolledStudentSchema],
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);