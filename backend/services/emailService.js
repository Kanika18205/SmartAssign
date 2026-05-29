const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error('SMTP ERROR:', err);
  } else {
    console.log('SMTP READY');
  }
});

const logo = `<div style="font-family:'Segoe UI',sans-serif;background:#080b10;color:#e6edf3;padding:32px;border-radius:12px;border:1px solid #21262d;">
  <div style="margin-bottom:24px;">
    <span style="font-size:20px;font-weight:800;background:linear-gradient(135deg,#00d9ff,#b04cff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">SmartAssign</span>
    <span style="font-size:12px;color:#8b949e;margin-left:8px;">ML-Driven Assessment Portal</span>
  </div>`;

exports.sendOTP = async (email, name, otp) => {
  await transporter.sendMail({
    from: `"SmartAssign" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your SmartAssign account',
    html: `${logo}
      <h2 style="font-size:22px;margin-bottom:8px;">Verify your email</h2>
      <p style="color:#8b949e;margin-bottom:24px;">Hi ${name}, enter this OTP to verify your account.</p>
      <div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
        <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:800;letter-spacing:12px;color:#00d9ff;">${otp}</span>
      </div>
      <p style="color:#8b949e;font-size:13px;">This code expires in <strong style="color:#f7c948;">10 minutes</strong>. Do not share it.</p>
    </div>`,
  });
};

exports.sendPasswordReset = async (email, name, resetUrl) => {
  await transporter.sendMail({
    from: `"SmartAssign" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your SmartAssign password',
    html: `${logo}
      <h2 style="font-size:22px;margin-bottom:8px;">Reset your password</h2>
      <p style="color:#8b949e;margin-bottom:24px;">Hi ${name}, click the button below to reset your password.</p>
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#00d9ff,#b04cff);color:#080b10;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-bottom:20px;">Reset Password</a>
      <p style="color:#8b949e;font-size:13px;">This link expires in <strong style="color:#f7c948;">30 minutes</strong>. If you didn't request this, ignore this email.</p>
      <p style="color:#484f58;font-size:12px;margin-top:12px;">Or copy: <span style="color:#00d9ff;">${resetUrl}</span></p>
    </div>`,
  });
};

exports.sendTestResult = async (email, name, testTitle, percentage, grade) => {
  await transporter.sendMail({
    from: `"SmartAssign" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your result: ${testTitle}`,
    html: `${logo}
      <h2 style="font-size:22px;margin-bottom:8px;">Test completed!</h2>
      <p style="color:#8b949e;margin-bottom:20px;">Hi ${name}, here's your result for <strong style="color:#00d9ff;">${testTitle}</strong>.</p>
      <div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:20px;text-align:center;margin-bottom:20px;">
        <div style="font-size:48px;font-weight:800;color:${grade === 'A' ? '#39d353' : grade === 'B' ? '#00d9ff' : grade === 'C' ? '#f7c948' : '#ff4757'}">${grade}</div>
        <div style="font-size:24px;font-weight:700;color:#e6edf3;">${percentage.toFixed(1)}%</div>
      </div>
      <p style="color:#8b949e;font-size:13px;">Log in to SmartAssign to see detailed ML feedback and study tips.</p>
    </div>`,
  });
};
