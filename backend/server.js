require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');

const app = express();
connectDB();

// Register ALL models before routes
require('./models/User');
require('./models/Class');
require('./models/Test');
require('./models/Attempt');

app.use(cors({ origin: ['https://smart-assign-mu.vercel.app' || 'http://localhost:5173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/auth', limiter);

app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ SmartAssign backend running on port ${PORT}`));
