import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [role, setRole] = useState('student');
  const [step, setStep] = useState(1); // 1=form, 2=otp (teacher only)
  const [form, setForm] = useState({ name: '', enrollmentNo: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.password) return toast.error('All fields required');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (role === 'student' && !form.enrollmentNo) return toast.error('Enrollment number is required');
    if (role === 'teacher' && !form.email) return toast.error('Email is required');
    setLoading(true);
    try {
      const res = await registerUser({ name: form.name, password: form.password, role, enrollmentNo: form.enrollmentNo, email: form.email });
      if (role === 'student') {
        loginUser(res.token, res.user);
        toast.success('Welcome, ' + res.user.name + '! You have joined your class.');
        navigate('/student');
      } else {
        toast.success('OTP sent to ' + form.email);
        navigate('/verify-otp', { state: { email: form.email } });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inp = { width: '100%', padding: '12px 16px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const label = { display: 'block', marginBottom: 6, color: 'var(--text-muted)', fontSize: 13 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 40 }}>
        <h2 style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>Create Account</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>Join SmartAssign</p>

        {/* Role Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg-base)', borderRadius: 10, padding: 4 }}>
          {['student', 'teacher'].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)', background: role === r ? 'var(--neon-cyan)' : 'transparent', color: role === r ? '#080b10' : 'var(--text-muted)', transition: 'all 0.2s' }}>
              {r === 'student' ? '🎓 Student' : '👨‍🏫 Teacher'}
            </button>
          ))}
        </div>

        {/* Info box */}
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13,
          background: role === 'student' ? 'rgba(0,217,255,0.06)' : 'rgba(176,76,255,0.06)',
          border: `1px solid ${role === 'student' ? 'rgba(0,217,255,0.2)' : 'rgba(176,76,255,0.2)'}`,
          color: 'var(--text-muted)', lineHeight: 1.6,
        }}>
          {role === 'student'
            ? '🎓 Enter your enrollment number (e.g. TCA2259040). It must match the list uploaded by your teacher. You will be automatically added to your class.'
            : '👨‍🏫 Register with your email. An OTP will be sent for verification. After verifying, you can create classes and tests.'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label}>Full Name</label>
            <input style={inp} placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          {role === 'student' ? (
            <div>
              <label style={label}>Enrollment Number</label>
              <input style={{ ...inp, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} placeholder="e.g. TCA2259040" value={form.enrollmentNo} onChange={e => set('enrollmentNo', e.target.value.toUpperCase())} />
            </div>
          ) : (
            <div>
              <label style={label}>Email Address</label>
              <input style={inp} type="email" placeholder="teacher@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          )}

          {role === 'student' && (
            <div>
              <label style={label}>Email (optional)</label>
              <input style={inp} type="email" placeholder="For result notifications" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          )}

          <div>
            <label style={label}>Password</label>
            <input style={inp} type="password" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div>
            <label style={label}>Confirm Password</label>
            <input style={inp} type="password" placeholder="Repeat password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'var(--neon-cyan)', color: '#080b10', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-body)', opacity: loading ? 0.7 : 1, marginTop: 8 }}>
            {loading ? 'Please wait...' : role === 'student' ? '🎓 Register & Join Class' : '👨‍🏫 Register & Get OTP'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--neon-cyan)' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}