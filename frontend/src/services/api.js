import axios from 'axios';

// Use deployed backend in production, local in development
const BASE_URL = 'https://smartassign-backend.onrender.com/api' || 'http://localhost:5001/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r.data,
  err => {
    if (err.response?.status === 401) { localStorage.clear(); window.location.href = '/login'; }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const registerUser   = (data) => api.post('/auth/register', data);
export const loginUser      = (data) => api.post('/auth/login', data);
export const verifyOTP      = (data) => api.post('/auth/verify-otp', data);
export const resendOTP      = (data) => api.post('/auth/resend-otp', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword  = (token, data) => api.post(`/auth/reset-password/${token}`, data);
export const getMe          = () => api.get('/auth/me');
export const forgotPW = forgotPassword;
export const resetPW  = resetPassword;

// ── Teacher — Classes ─────────────────────────────────────────
export const getClasses       = ()          => api.get('/teacher/classes');
export const createClass      = (data)      => api.post('/teacher/classes', data);
export const updateClass      = (id, data)  => api.put(`/teacher/class/${id}`, data);
export const deleteClass      = (id)        => api.delete(`/teacher/class/${id}`);

// ── Teacher — Students ────────────────────────────────────────
export const uploadStudents   = (classId, fd)           => api.post(`/teacher/class/${classId}/upload-students`, fd);
export const getClassStudents = (classId)               => api.get(`/teacher/class/${classId}/students`);
export const updateStudent    = (classId, enroll, data) => api.put(`/teacher/class/${classId}/student/${enroll}`, data);
export const deleteStudent    = (classId, enroll)       => api.delete(`/teacher/class/${classId}/student/${enroll}`);
export const clearStudents    = (classId)               => api.delete(`/teacher/class/${classId}/students`);

// ── Teacher — Tests ───────────────────────────────────────────
export const createTest    = (data) => api.post('/teacher/create-test', data);
export const getTests      = ()     => api.get('/teacher/tests');
export const deleteTest    = (id)   => api.delete(`/teacher/test/${id}`);
export const publishTest   = (id)   => api.post(`/teacher/test/${id}/publish`);
export const getResults    = (id)   => api.get(`/teacher/test/${id}/results`);
export const getMLInsights = (id)   => api.get(`/teacher/test/${id}/ml-insights`);
export const getTestResults = getResults;
export const exportResults  = async (id, title) => {
  const res = await axios.get(`${BASE_URL}/teacher/test/${id}/export`, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url; a.download = `results_${title}.xlsx`; a.click();
  URL.revokeObjectURL(url);
};

// ── Student ───────────────────────────────────────────────────
export const getAvailableTests  = ()      => api.get('/student/tests');
export const startTest          = (id)    => api.post(`/student/test/${id}/start`);
export const submitTest         = (id, d) => api.post(`/student/test/${id}/submit`, d);
export const getMyResults       = ()      => api.get('/student/results');
export const getAttemptDetail   = (id)    => api.get(`/student/result/${id}`);
export const getPerformance     = ()      => api.get('/student/performance');
export const getStudentResults  = getMyResults;
