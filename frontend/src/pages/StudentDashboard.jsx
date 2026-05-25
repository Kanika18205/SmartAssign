import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAvailableTests, getMyResults, getPerformance } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const gradeColor = g => ({ A:'#39d353', B:'#00d9ff', C:'#f7c948', D:'#ff8c42', F:'#ff4757' }[g] || '#888');

export default function StudentDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('tests');
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tr, rr, pr] = await Promise.all([
        getAvailableTests().catch(e => { console.error('tests err:', e.response?.data); return { tests: [] }; }),
        getMyResults().catch(() => ({ results: [] })),
        getPerformance().catch(() => null),
      ]);
      setTests(tr.tests || []);
      setResults(rr.results || []);
      setPerf(pr);
    } catch (e) {
      toast.error('Failed to load data');
    } finally { setLoading(false); }
  };

  const handleStart = async (testId) => {
    navigate(`/test/${testId}/attempt`);
  };

  if (loading) return <Loader fullScreen text="Loading your dashboard..." />;

  const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--neon-cyan)', margin: 0 }}>SmartAssign</h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 14 }}>
              Welcome, {user?.name} · <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>{user?.enrollmentNo}</span>
            </p>
          </div>
          <button onClick={logoutUser} style={{ padding: '8px 16px', background: 'rgba(255,71,87,0.15)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Logout</button>
        </div>

        {/* Stats Row */}
        {perf && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Tests Attempted', value: perf.totalAttempts, color: 'var(--neon-cyan)' },
              { label: 'Avg Score',       value: `${perf.avgScore}%`, color: 'var(--neon-purple)' },
              { label: 'Best Score',      value: `${perf.bestScore}%`, color: 'var(--neon-green)' },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ color: s.color, fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Score Trend */}
        {perf?.trend?.length > 1 && (
          <div style={{ ...card, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 14px', color: 'var(--text-primary)', fontSize: 15 }}>📈 Your Score Trend</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={perf.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={d => new Date(d).toLocaleDateString()} />
                <YAxis domain={[0,100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={v => [`${v}%`, 'Score']} />
                <Line type="monotone" dataKey="percentage" stroke="var(--neon-cyan)" strokeWidth={2} dot={{ fill: 'var(--neon-cyan)', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {[['tests','📋 Available Tests'], ['results','📊 My Results']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', color: tab===k ? 'var(--neon-cyan)' : 'var(--text-muted)', borderBottom: tab===k ? '2px solid var(--neon-cyan)' : '2px solid transparent', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)' }}>{l}</button>
          ))}
        </div>

        {/* Available Tests */}
        {tab === 'tests' && (
          <div>
            {tests.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: 60 }}>
                <p style={{ fontSize: 40, margin: '0 0 12px' }}>📭</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>No tests available right now.</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
                  Your class: <span style={{ color: 'var(--neon-cyan)' }}>{user?.classId ? 'Assigned' : 'Not assigned'}</span> · Your teacher will publish tests when ready.
                </p>
                <button onClick={loadAll} style={{ marginTop: 16, padding: '8px 20px', background: 'var(--neon-cyan)', color: '#080b10', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>🔄 Refresh</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tests.map(t => (
                  <div key={t._id} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: 16 }}>{t.title}</h3>
                      {t.description && <p style={{ margin: '0 0 6px', color: 'var(--text-muted)', fontSize: 13 }}>{t.description}</p>}
                      <div style={{ display: 'flex', gap: 14, color: 'var(--text-muted)', fontSize: 13 }}>
                        <span>⏱ {t.duration} min</span>
                        <span>📝 {t.totalMarks} marks</span>
                        {t.endTime && <span style={{ color: new Date(t.endTime) < new Date(Date.now() + 3600000) ? '#ff4757' : 'var(--text-muted)' }}>🕐 Ends {new Date(t.endTime).toLocaleString()}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleStart(t._id)} style={{ padding: '12px 24px', background: 'var(--neon-cyan)', color: '#080b10', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
                      🚀 Start Test
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Results */}
        {tab === 'results' && (
          <div>
            {results.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: 60 }}>
                <p style={{ fontSize: 40, margin: '0 0 12px' }}>📊</p>
                <p style={{ color: 'var(--text-muted)' }}>No results yet. Attempt a test to see your results here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {results.map(r => (
                  <div key={r.attemptId} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: gradeColor(r.grade) + '22', border: `2px solid ${gradeColor(r.grade)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: gradeColor(r.grade), fontFamily: 'var(--font-display)', flexShrink: 0 }}>{r.grade}</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: 15 }}>{r.testTitle}</h3>
                      <div style={{ display: 'flex', gap: 14, color: 'var(--text-muted)', fontSize: 13, flexWrap: 'wrap' }}>
                        <span style={{ color: r.percentage >= 75 ? 'var(--neon-green)' : r.percentage >= 40 ? 'var(--neon-amber)' : '#ff4757', fontWeight: 600 }}>{r.percentage?.toFixed(1)}%</span>
                        <span>{r.totalScore} / {r.maxScore} marks</span>
                        {r.mlLevel && <span style={{ color: 'var(--neon-purple)' }}>🤖 {r.mlLevel}</span>}
                        {r.flagged && <span style={{ color: '#ff4757' }}>⚠️ Flagged</span>}
                        {r.submittedAt && <span>{new Date(r.submittedAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <button onClick={() => navigate(`/result/${r.attemptId}`)} style={{ padding: '8px 18px', background: 'rgba(176,76,255,0.15)', color: 'var(--neon-purple)', border: '1px solid rgba(176,76,255,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      🧠 View ML Feedback
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}