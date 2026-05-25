const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true },
  enrollmentNo:      { type: String, unique: true, sparse: true, trim: true }, // student login ID
  email:             { type: String, sparse: true, lowercase: true, trim: true },
  password:          { type: String, required: true, minlength: 6 },
  role:              { type: String, enum: ['teacher', 'student'], required: true },
  studentId:         { type: String }, // alias for enrollmentNo
  classId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  isVerified:        { type: Boolean, default: false },
  otp:               { type: String },
  otpExpiry:         { type: Date },
  resetToken:        { type: String },
  resetTokenExpiry:  { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);