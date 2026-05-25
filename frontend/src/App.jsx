import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/globals.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOTP from './pages/VerifyOTP';
import TeacherDashboard from './pages/TeacherDashboard';
import TestResultsPage from './pages/TestResultsPage';
import CreateTestPage from './pages/CreateTestPage';
import TestInsightsPage from './pages/TestInsightsPage';
import StudentDashboard from './pages/StudentDashboard';
import TestAttemptPage from './pages/TestAttemptPage';
import ResultPage from './pages/ResultPage';
import Loader from './components/common/Loader';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullScreen />;

  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace /> : <Home />
      } />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/create-test" element={<ProtectedRoute role="teacher"><CreateTestPage /></ProtectedRoute>} />
      <Route path="/teacher/test/:id/insights" element={<ProtectedRoute role="teacher"><TestInsightsPage /></ProtectedRoute>} />
      <Route path="/teacher/test/:id/results" element={<ProtectedRoute role="teacher"><TestResultsPage /></ProtectedRoute>} />

      <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/test/:testId/attempt" element={<ProtectedRoute role="student"><TestAttemptPage /></ProtectedRoute>} />
      <Route path="/result/:attemptId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#161b22', color: '#e6edf3',
              border: '1px solid #30363d', borderRadius: '8px',
              fontFamily: "'Inter', sans-serif", fontSize: '14px',
            },
            success: { iconTheme: { primary: '#39d353', secondary: '#080b10' } },
            error:   { iconTheme: { primary: '#ff4757', secondary: '#080b10' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}