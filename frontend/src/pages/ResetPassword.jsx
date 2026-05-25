import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Brain, Eye, EyeOff, Lock } from 'lucide-react';
import { resetPassword } from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await resetPassword(token, { password });
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed or link expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="animate-in" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={20} color="#080b10" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
            Smart<span className="text-gradient">Assign</span>
          </span>
        </div>

        <div className="card" style={{ padding: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Lock size={26} color="var(--neon-cyan)" />
          </div>
          <h2 style={{ fontSize: 22, marginBottom: 8, textAlign: 'center' }}>Set new password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, textAlign: 'center' }}>Must be at least 6 characters</p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPw ? 'text' : 'password'}
                  placeholder="New password" value={password}
                  onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password"
                placeholder="Confirm new password" value={confirm}
                onChange={e => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <span className="spinner" /> : 'Reset Password'}
            </button>
          </form>
          <Link to="/login" style={{ display: 'block', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginTop: 20, textDecoration: 'none' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
