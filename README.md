# SmartAssign v2.0 — ML-Driven Assessment Portal

> B.Tech CSE (AI+ML+DL) · TMU-CCSIT · EAI 852

---

## Architecture Decision: Why Separate FastAPI Microservice?

**Recommendation: YES — separate FastAPI ML service.** Here's why:

| Concern | Separate FastAPI | Embedded in Node.js |
|---------|-----------------|---------------------|
| Python ML libraries (sklearn, numpy) | ✅ Native | ❌ Subprocess hacks |
| Independent scaling | ✅ Yes | ❌ No |
| ML model retraining without downtime | ✅ Yes | ❌ No |
| Development clarity | ✅ Clear separation | ⚠️ Mixed concerns |
| Fallback if ML is down | ✅ Built-in | N/A |

The Node.js backend calls ML service via internal REST API. If ML is unavailable, it falls back to rule-based logic — the app never breaks.

---

## ML Features Built

### 1. 🔍 Cheat / Anomaly Detection
- **Tab switch detection** — JavaScript `visibilitychange` event tracks every time student leaves the test tab
- 3 warnings → auto-submit + `flagged: true` saved in DB
- Teachers see flagged submissions highlighted in results
- Teacher ML Insights shows anomaly count

### 2. 🧠 Smart Feedback Generation (FastAPI `/generate-feedback`)
- After test submission, student's topic-wise accuracy is sent to ML service
- Returns: performance level (Beginner/Intermediate/Advanced), weak topics, topic-specific study tips
- Fallback rule-based feedback if ML service is down
- Result email sent automatically with grade

### 3. 📊 Learning Gap Detection — K-Means Clustering (FastAPI `/detect-gaps`)
- Groups students into Struggling / Average / Strong clusters
- Per-topic accuracy vector used as features
- Teacher ML Insights page shows cluster breakdown + radar charts
- Class-wide weak topics surfaced automatically

### 4. 🎯 Question Difficulty Classifier (FastAPI `/classify-difficulty`)  
- Random Forest trained on: correct_rate, avg_time_taken, skip_rate
- Runs asynchronously after each test submission batch
- Updates question records with `difficultyLabel` + confidence score
- Teacher sees difficulty heatmap in ML Insights

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (free tier works)
- Gmail account with App Password enabled

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGO_URI, EMAIL_USER, EMAIL_PASS, JWT_SECRET
npm run dev
# Runs on http://localhost:5000
```

**Gmail App Password setup:**
1. Google Account → Security → 2-Step Verification → App Passwords
2. Generate for "Mail" → copy 16-char password → paste as `EMAIL_PASS`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

### 3. ML Service Setup

```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
# Models auto-train on first run (bootstrap data)
# API docs: http://localhost:8000/docs
```

---

## Project Structure

```
smartassign/
├── frontend/          # React 18 + Vite + CSS (dark theme)
│   └── src/
│       ├── pages/     # Home, Login, Register, OTP, ForgotPW, Reset,
│       │              # TeacherDashboard, StudentDashboard,
│       │              # CreateTest, TestAttempt, ResultPage, MLInsights
│       ├── services/  # api.js — Axios + interceptors
│       ├── context/   # AuthContext (JWT + role)
│       └── styles/    # globals.css — full dark design system
│
├── backend/           # Node.js + Express + MongoDB
│   ├── controllers/   # auth, teacher, student
│   ├── models/        # User, Test, Question, Attempt, StudentList
│   ├── routes/        # auth, teacher, student routes
│   ├── services/      # emailService, mlService (caller), evaluationService
│   └── middleware/    # JWT auth, role guard, error handler
│
└── ml-service/        # Python + FastAPI
    ├── routers/       # difficulty, feedback, gaps, adaptive, insights
    ├── services/      # Random Forest, K-Means, rule-based NLP
    └── schemas/       # Pydantic I/O models
```

---

## API Reference

### Auth (`/api/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Register + trigger OTP email |
| POST | `/verify-otp` | Verify 6-digit OTP |
| POST | `/resend-otp` | Resend OTP (60s cooldown on frontend) |
| POST | `/login` | JWT login |
| POST | `/forgot-password` | Email reset link |
| POST | `/reset-password/:token` | Set new password |
| GET | `/me` | Get current user |

### Teacher (`/api/teacher`) — requires `role: teacher`
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/upload-students` | Upload .xlsx student list |
| POST | `/create-test` | Create test + questions |
| GET | `/tests` | List all my tests |
| DELETE | `/test/:id` | Delete test |
| POST | `/test/:id/publish` | Publish test (makes active) |
| GET | `/test/:id/results` | View all attempts + scores |
| GET | `/test/:id/ml-insights` | ML analytics dashboard data |
| GET | `/test/:id/export` | Download results as .xlsx |

### Student (`/api/student`) — requires `role: student`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/tests` | Available tests (not yet attempted) |
| POST | `/test/:id/start` | Start attempt, get questions |
| POST | `/test/:id/submit` | Submit + auto-evaluate + ML feedback |
| GET | `/results` | All my results |
| GET | `/result/:attemptId` | Detailed result + ML feedback |
| GET | `/performance` | Avg/best score stats |

### ML Service (`http://localhost:8000`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/classify-difficulty` | Random Forest difficulty label |
| POST | `/generate-feedback` | Smart feedback + study tips |
| POST | `/detect-gaps` | K-Means cluster + weak topics |
| POST | `/adaptive-questions` | Reorder questions by weakness |
| POST | `/class-insights` | Teacher class-level analytics |
| GET | `/docs` | Auto-generated Swagger UI |

---

## Key Features

- ✅ OTP email verification on signup
- ✅ Forgot password → secure reset link (expires 30 min)
- ✅ JWT role-based access (teacher / student)
- ✅ Tab-switch cheat detection (3 warnings → auto-submit + flagged)
- ✅ Question shuffle per student (prevents copying)
- ✅ Auto-submit on timer expiry
- ✅ ML Smart Feedback with topic-specific tips
- ✅ K-Means learning gap clustering
- ✅ Random Forest question difficulty classifier (updates asynchronously)
- ✅ Result email sent after submission
- ✅ Teacher ML Insights: radar chart, score distribution, cluster breakdown
- ✅ Export results as .xlsx
- ✅ ML service fallback — app works even if Python service is down
- ✅ Dark UI with neon cyan/purple design system

---

## Deployment

| Service | Platform | Free Tier |
|---------|----------|-----------|
| Frontend | Vercel | ✅ |
| Backend | Render | ✅ (spins down after inactivity) |
| ML Service | Render (Python) | ✅ |
| Database | MongoDB Atlas | ✅ 512MB |

Add environment variables in each platform's dashboard.

---

*SmartAssign v2.0 · Kanika Jain (TCA2259040) · Shivangi Jain (TCA2259071)*
