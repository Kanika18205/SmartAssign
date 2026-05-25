import { Link } from 'react-router-dom';
import { Brain, Zap, BarChart3, Shield, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: '1px solid var(--border)',
        background: 'rgba(8,11,16,0.9)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--gradient-main)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={18} color="#080b10" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>
            Smart<span className="text-gradient">Assign</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" className="btn btn-ghost">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        padding: '100px 40px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '10%', left: '15%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,217,255,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(176,76,255,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        <div className="animate-in" style={{ position: 'relative' }}>
          <div className="badge badge-cyan" style={{ marginBottom: 20, display: 'inline-flex' }}>
            <Zap size={11} /> ML-Powered Assessment Platform
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', marginBottom: 24, lineHeight: 1.1 }}>
            Exams Made<br />
            <span className="text-gradient">Intelligent</span>
          </h1>
          <p style={{
            fontSize: 18, color: 'var(--text-secondary)', maxWidth: 560,
            margin: '0 auto 40px', lineHeight: 1.7,
          }}>
            SmartAssign automates MCQ assessments with ML-driven feedback,
            adaptive testing, and real-time analytics — built for modern educators.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '60px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, marginBottom: 12 }}>
            Everything you need for <span className="text-gradient">smart assessment</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
            From test creation to ML-powered insights — all in one platform
          </p>
        </div>

        <div className="grid-2" style={{ gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card" style={{
              display: 'flex', gap: 16, padding: 28,
              animationDelay: `${i * 0.08}s`,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <f.icon size={20} color={f.color} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '60px 40px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, marginBottom: 48 }}>How it works</h2>
        <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 22, left: '16%', right: '16%',
            height: 1, background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))',
          }} />
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--gradient-main)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16,
                color: 'var(--bg-base)', zIndex: 1, position: 'relative',
              }}>{i + 1}</div>
              <h4 style={{ fontSize: 15, fontWeight: 600 }}>{s.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 600, margin: '0 auto',
          background: 'var(--gradient-glow)',
          border: '1px solid rgba(0,217,255,0.15)',
          borderRadius: 'var(--radius-xl)', padding: '60px 40px',
        }}>
          <h2 style={{ fontSize: 32, marginBottom: 12 }}>Ready to get started?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Join educators who use SmartAssign for smarter assessments.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 40px', textAlign: 'center',
        color: 'var(--text-muted)', fontSize: 13,
      }}>
        © 2025 SmartAssign · Built at TMU-CCSIT · B.Tech CSE (AI+ML+DL)
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    title: 'Question Difficulty Classifier',
    desc: 'ML automatically rates each question as Easy / Medium / Hard based on real student response patterns.',
    icon: Brain, color: '#00d9ff', bg: 'rgba(0,217,255,0.1)',
  },
  {
    title: 'Adaptive Test Engine',
    desc: 'Questions adapt to each student\'s weakness profile — struggling students get targeted practice.',
    icon: Zap, color: '#b04cff', bg: 'rgba(176,76,255,0.1)',
  },
  {
    title: 'Learning Gap Detection',
    desc: 'K-Means clustering groups students by performance patterns and surfaces hidden weak topics.',
    icon: BarChart3, color: '#39d353', bg: 'rgba(57,211,83,0.1)',
  },
  {
    title: 'Secure Verified Access',
    desc: 'Excel-based student ID verification, OTP email signup, and JWT role-based access control.',
    icon: Shield, color: '#f7c948', bg: 'rgba(247,201,72,0.1)',
  },
];

const STEPS = [
  { title: 'Teacher Creates Test', desc: 'Upload student list, add MCQ questions' },
  { title: 'Students Attempt', desc: 'Timed, adaptive, question-shuffled' },
  { title: 'ML Analyses', desc: 'Difficulty scored, gaps detected' },
  { title: 'Smart Feedback', desc: 'Instant results with topic-level hints' },
];
