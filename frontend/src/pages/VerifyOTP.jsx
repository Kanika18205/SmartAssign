import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Brain, Mail, RotateCcw, ArrowRight } from 'lucide-react';
import { verifyOTP, resendOTP } from '../services/api';
import toast from 'react-hot-toast';

export default function VerifyOTP() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const refs = useRef([]);
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email || '';

  useEffect(() => {
    if (!email) { navigate('/register'); return; }
    refs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d)) submitOTP(next.join(''));
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const submitOTP = async (code) => {
    setLoading(true);
    try {
      await verifyOTP({ email, otp: code });
      toast.success('Email verified! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await resendOTP({ email });
      toast.success('New OTP sent!');
      setResendTimer(60);
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="animate-in" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={20} color="#080b10" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
            Smart<span className="text-gradient">Assign</span>
          </span>
        </div>

        <div className="card" style={{ padding: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Mail size={26} color="var(--neon-cyan)" />
          </div>

          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Check your email</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
            We sent a 6-digit code to
          </p>
          <p style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', fontSize: 14, marginBottom: 32 }}>
            {email}
          </p>

          {/* OTP inputs */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => refs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)}
                style={{
                  width: 48, height: 56,
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22, fontWeight: 700,
                  background: 'var(--bg-elevated)',
                  border: `2px solid ${digit ? 'var(--neon-cyan)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'var(--transition)',
                }}
              />
            ))}
          </div>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <span className="spinner" />
            </div>
          )}

          <button onClick={handleResend} disabled={resendTimer > 0}
            style={{
              background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer',
              color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--neon-cyan)',
              fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto',
            }}>
            <RotateCcw size={13} />
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 20 }}>
          Wrong email?{' '}
          <Link to="/register" style={{ color: 'var(--neon-cyan)', textDecoration: 'none' }}>Go back</Link>
        </p>
      </div>
    </div>
  );
}
