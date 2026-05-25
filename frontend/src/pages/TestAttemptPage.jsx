import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startTest, submitTest } from '../services/api';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

export default function TestAttemptPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(0);
  const timerRef = useRef(null);
  const submittedRef = useRef(false);

  const doSubmit = useCallback(async (tabCount = 0) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const res = await submitTest(testId, { answers, tabSwitches: tabCount });
      toast.success(`Submitted! Score: ${res.percentage?.toFixed(1)}%`);
      navigate(`/result/${res.attemptId}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed');
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [testId, answers, navigate]);

  useEffect(() => {
    startTest(testId)
      .then(res => {
        setTest(res.test);
        setQuestions(res.questions || []);
        setTimeLeft((res.test.duration || 30) * 60);
      })
      .catch(e => {
        toast.error(e.response?.data?.message || 'Failed to load test');
        navigate('/student');
      })
      .finally(() => setLoading(false));
  }, [testId]);

  // Timer
  useEffect(() => {
    if (!test) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); doSubmit(tabWarnings); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [test]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setTabWarnings(prev => {
          const next = prev + 1;
          if (next >= 3) {
            toast.error('⚠️ Test auto-submitted: too many tab switches!');
            doSubmit(next);
          } else {
            toast.error(`⚠️ Warning ${next}/3: Do not switch tabs!`);
          }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [doSubmit]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const timerColor = timeLeft < 300 ? '#ff4757' : timeLeft < 600 ? '#f7c948' : 'var(--neon-green)';
  const answered = Object.keys(answers).length;
  const q = questions[current];

  if (loading) return <Loader fullScreen text="Loading test..." />;
  if (!test || !q) return <div style={{ color: '#fff', padding: 40, textAlign: 'center' }}>Test not found. <button onClick={() => navigate('/student')} style={{ color: 'var(--neon-cyan)', background: 'none', border: 'none', cursor: 'pointer' }}>Go back</button></div>;

  const diffColors = { easy: '#39d353', medium: '#f7c948', hard: '#ff4757', unrated: '#888' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* Top Bar */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16, fontFamily: 'var(--font-display)' }}>{test.title}</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{answered}/{questions.length} answered</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {tabWarnings > 0 && <span style={{ color: '#ff4757', fontSize: 13, fontWeight: 600 }}>⚠️ {tabWarnings}/3 warnings</span>}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: timerColor, background: timerColor + '15', padding: '6px 16px', borderRadius: 8, border: `1px solid ${timerColor}44` }}>
            {mins}:{secs}
          </div>
          <button onClick={() => { if (confirm('Submit the test now?')) doSubmit(tabWarnings); }} disabled={submitting} style={{ padding: '10px 20px', background: 'var(--neon-cyan)', color: '#080b10', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '24px', gap: 20 }}>

        {/* Question Panel */}
        <div style={{ flex: 1 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28 }}>
            {/* Question Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontWeight: 700 }}>Q{current + 1} / {questions.length}</span>
                {q.difficultyLabel && q.difficultyLabel !== 'unrated' && (
                  <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, fontWeight: 600, background: (diffColors[q.difficultyLabel] || '#888') + '22', color: diffColors[q.difficultyLabel] || '#888', border: `1px solid ${(diffColors[q.difficultyLabel] || '#888')}44` }}>⚡ {q.difficultyLabel}</span>
                )}
                {q.topic && <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '2px 8px', background: 'var(--bg-base)', borderRadius: 6 }}>{q.topic}</span>}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
            </div>

            {/* Question Text */}
            <p style={{ color: 'var(--text-primary)', fontSize: 17, lineHeight: 1.7, marginBottom: 24, fontWeight: 500 }}>{q.text}</p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['A', 'B', 'C', 'D'].map(opt => {
                const selected = answers[q._id] === opt;
                return (
                  <button key={opt} onClick={() => setAnswers(p => ({ ...p, [q._id]: opt }))} style={{
                    width: '100%', padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${selected ? 'var(--neon-cyan)' : 'var(--border)'}`,
                    background: selected ? 'rgba(0,217,255,0.1)' : 'var(--bg-base)',
                    color: selected ? 'var(--neon-cyan)' : 'var(--text-primary)',
                    textAlign: 'left', fontSize: 15, fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${selected ? 'var(--neon-cyan)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: selected ? 'var(--neon-cyan)' : 'var(--text-muted)', flexShrink: 0 }}>{opt}</span>
                    {q.options?.[opt]}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.5 : 1 }}>← Previous</button>
              {current < questions.length - 1
                ? <button onClick={() => setCurrent(p => p + 1)} style={{ padding: '10px 24px', background: 'var(--neon-cyan)', color: '#080b10', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Next →</button>
                : <button onClick={() => { if (confirm('Submit the test?')) doSubmit(tabWarnings); }} style={{ padding: '10px 24px', background: 'var(--neon-green)', color: '#080b10', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>✓ Submit</button>}
            </div>
          </div>
        </div>

        {/* Question Grid Sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'sticky', top: 80 }}>
            <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>QUESTIONS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {questions.map((qItem, i) => {
                const isAnswered = !!answers[qItem._id];
                const isCurrent = i === current;
                return (
                  <button key={i} onClick={() => setCurrent(i)} style={{
                    width: 36, height: 36, borderRadius: 8, border: `2px solid ${isCurrent ? 'var(--neon-cyan)' : isAnswered ? 'var(--neon-green)' : 'var(--border)'}`,
                    background: isCurrent ? 'rgba(0,217,255,0.15)' : isAnswered ? 'rgba(57,211,83,0.15)' : 'transparent',
                    color: isCurrent ? 'var(--neon-cyan)' : isAnswered ? 'var(--neon-green)' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  }}>{i + 1}</button>
                );
              })}
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(57,211,83,0.15)', border: '1px solid var(--neon-green)' }} />Answered ({answered})</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'transparent', border: '1px solid var(--border)' }} />Not answered ({questions.length - answered})</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}