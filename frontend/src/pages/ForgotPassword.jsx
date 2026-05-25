// ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Mail, ArrowLeft, Send } from 'lucide-react';
import { forgotPassword } from '../services/api';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
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

        <div className="card" style={{ padding: 36, textAlign: 'center' }}>
          {!sent ? (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(247,201,72,0.1)', border: '1px solid rgba(247,201,72,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Mail size={26} color="var(--neon-amber)" />
              </div>
              <h2 style={{ fontSize: 22, marginBottom: 8 }}>Forgot password?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
                Enter your email and we'll send a reset link
              </p>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input className="form-input" type="email" placeholder="you@university.edu"
                  value={email} onChange={e => setEmail(e.target.value)} required />
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? <span className="spinner" /> : <><Send size={15} /> Send Reset Link</>}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(57,211,83,0.1)', border: '1px solid rgba(57,211,83,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Mail size={26} color="var(--neon-green)" />
              </div>
              <h2 style={{ fontSize: 22, marginBottom: 8 }}>Check your inbox</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>Reset link sent to</p>
              <p style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', fontSize: 14, marginBottom: 24 }}>{email}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Link expires in 30 minutes</p>
            </>
          )}
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 13, marginTop: 24, textDecoration: 'none' }}>
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
