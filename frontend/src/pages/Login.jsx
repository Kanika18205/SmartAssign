import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { loginUser: authLogin } = useAuth();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ enrollmentNo: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.password) return toast.error('Password is required');
    if (role === 'student' && !form.enrollmentNo) return toast.error('Enrollment number is required');
    if (role === 'teacher' && !form.email) return toast.error('Email is required');
    setLoading(true);
    try {
      const payload = role === 'student'
        ? { enrollmentNo: form.enrollmentNo, password: form.password, role }
        : { email: form.email, password: form.password, role };
      const res = await loginUser(payload);
      authLogin(res.token, res.user);
      toast.success('Welcome back, ' + res.user.name + '!');
      navigate(res.user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const inp = { width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const label = { display: 'block', marginBottom: 6, color: 'var(--text-muted)', fontSize: 13 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 40 }}>
        <h2 style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)', marginBottom: 8 }}>Sign In</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>Welcome back to SmartAssign</p>

        {/* Role Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg-base)', borderRadius: 10, padding: 4 }}>
          {['student', 'teacher'].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)',
              background: role === r ? 'var(--neon-cyan)' : 'transparent',
              color: role === r ? '#080b10' : 'var(--text-muted)', transition: 'all 0.2s',
            }}>{r.charAt(0).toUpperCase() + r.slice(1)}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {role === 'student' ? (
            <div>
              <label style={label}>Enrollment Number</label>
              <input style={inp} placeholder="e.g. TCA2259040" value={form.enrollmentNo} onChange={e => set('enrollmentNo', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          ) : (
            <div>
              <label style={label}>Email Address</label>
              <input style={inp} type="email" placeholder="teacher@email.com" value={form.email} onChange={e => set('email', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          )}

          <div>
            <label style={label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 48 }} type={showPw ? 'text' : 'password'} placeholder="Your password" value={form.password}
                onChange={e => set('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              <button onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {role === 'teacher' && (
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <Link to="/forgot-password" style={{ color: 'var(--neon-cyan)', fontSize: 13 }}>Forgot password?</Link>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: 'var(--neon-cyan)', color: '#080b10', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-body)',
            opacity: loading ? 0.7 : 1, marginTop: 8,
          }}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 14 }}>
          No account? <Link to="/register" style={{ color: 'var(--neon-cyan)' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}