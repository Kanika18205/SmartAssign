import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMLInsights } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, CartesianGrid, Legend, Cell, PieChart, Pie,
} from 'recharts';
import Loader from '../components/common/Loader';

// ── Mock data used when no real attempts exist ───────────────
const MOCK = {
  totalAttempts: 28,
  avgScore: 64.3,
  struggling: 6,
  average: 14,
  strong: 8,
  flaggedCount: 3,
  clusterCounts: { Beginner: 6, Intermediate: 14, Advanced: 8 },
  scoreDistribution: [
    { range: '0-20%',   count: 2 },
    { range: '21-40%',  count: 4 },
    { range: '41-60%',  count: 9 },
    { range: '61-80%',  count: 8 },
    { range: '81-100%', count: 5 },
  ],
  questionDifficulty: [
    { label: 'Easy',   count: 4 },
    { label: 'Medium', count: 8 },
    { label: 'Hard',   count: 3 },
  ],
  topicAccuracy: [
    { topic: 'Arrays',     accuracy: 72 },
    { topic: 'Recursion',  accuracy: 48 },
    { topic: 'Sorting',    accuracy: 65 },
    { topic: 'Trees',      accuracy: 41 },
    { topic: 'Graphs',     accuracy: 55 },
  ],
  weakTopics: ['Recursion', 'Trees'],
  scoreTrend: [
    { attempt: 'Attempt 1', avg: 52 },
    { attempt: 'Attempt 2', avg: 58 },
    { attempt: 'Attempt 3', avg: 61 },
    { attempt: 'Attempt 4', avg: 64 },
    { attempt: 'Attempt 5', avg: 67 },
  ],
  questions: [
    { text: 'What is the time complexity of binary search?', topic: 'Arrays',    difficultyLabel: 'easy',   correctRate: 82, attemptCount: 28 },
    { text: 'Which traversal gives sorted output in BST?',  topic: 'Trees',      difficultyLabel: 'medium', correctRate: 54, attemptCount: 28 },
    { text: 'Explain recursion base case importance',       topic: 'Recursion',  difficultyLabel: 'hard',   correctRate: 39, attemptCount: 28 },
    { text: 'What is the best case of QuickSort?',          topic: 'Sorting',    difficultyLabel: 'medium', correctRate: 71, attemptCount: 28 },
    { text: 'DFS uses which data structure?',               topic: 'Graphs',     difficultyLabel: 'easy',   correctRate: 68, attemptCount: 28 },
  ],
  isMock: true,
};

const COLORS = { easy: '#39d353', medium: '#f7c948', hard: '#ff4757', unrated: '#888' };
const CHART_COLORS = ['#00d9ff', '#b04cff', '#39d353', '#f7c948', '#ff4757'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 4px' }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, margin: 0, fontWeight: 600 }}>{p.name}: {p.value}{p.name?.includes('%') || p.dataKey === 'accuracy' || p.dataKey === 'avg' ? '%' : ''}</p>)}
    </div>
  );
};

export default function TestInsightsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || id === 'undefined') { setData({ ...MOCK, testTitle: 'Demo Test' }); setLoading(false); return; }
    getMLInsights(id)
      .then(res => {
        // If no real attempts, use mock data as demo
        if (!res.totalAttempts) {
          setData({ ...MOCK, testTitle: res.testTitle, isMock: true });
        } else {
          setData({ ...res, isMock: false });
        }
      })
      .catch(() => setData({ ...MOCK, testTitle: 'Test Analysis' }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader fullScreen text="Running ML analysis..." />;
  if (!data) return null;

  const card = (extra = {}) => ({
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 20, marginBottom: 16, ...extra,
  });

  const pct = (n, total) => total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 24 }}>
      <style>{`
        .ml-card { transition: transform 0.2s, box-shadow 0.2s; }
        .ml-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(176,76,255,0.15); }
      `}</style>

      <div style={{ maxWidth: 1060, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => navigate('/teacher')} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>← Back</button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, color: 'var(--neon-purple)', fontFamily: 'var(--font-display)', fontSize: 24 }}>🧠 ML Insights</h1>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(176,76,255,0.15)', color: 'var(--neon-purple)', border: '1px solid rgba(176,76,255,0.3)', fontFamily: 'var(--font-mono)' }}>AI-POWERED · RANDOM FOREST + K-MEANS</span>
              {data.isMock && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(247,201,72,0.15)', color: 'var(--neon-amber)', border: '1px solid rgba(247,201,72,0.3)' }}>📊 SAMPLE DATA — Awaiting real attempts</span>}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>{data.testTitle}</p>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { icon: '📊', label: 'Attempts',  value: data.totalAttempts, color: 'var(--neon-cyan)' },
            { icon: '📈', label: 'Avg Score', value: `${data.avgScore}%`, color: 'var(--neon-purple)' },
            { icon: '🚀', label: 'Strong',    value: data.strong, color: '#39d353' },
            { icon: '⚡', label: 'Average',   value: data.average, color: '#f7c948' },
            { icon: '🌱', label: 'Struggling',value: data.struggling, color: '#ff4757' },
            { icon: '🚩', label: 'Flagged',   value: data.flaggedCount, color: '#ff4757' },
          ].map(s => (
            <div key={s.label} className="ml-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ color: s.color, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── ROW 1: Cluster + Score Distribution ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginBottom: 16 }}>

          {/* K-Means Cluster */}
          <div className="ml-card" style={{ ...card(), background: 'linear-gradient(135deg, rgba(176,76,255,0.08), rgba(0,217,255,0.04))', borderColor: 'rgba(176,76,255,0.25)', marginBottom: 0 }}>
            <h3 style={{ margin: '0 0 4px', color: 'var(--neon-purple)', fontSize: 15 }}>🤖 K-Means Clustering</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 12 }}>Students grouped by performance vector</p>
            {[
              { label: 'Struggling', key: 'Beginner',    color: '#ff4757', icon: '🌱', desc: 'Score < 40%' },
              { label: 'Average',    key: 'Intermediate', color: '#f7c948', icon: '⚡', desc: '40% – 75%' },
              { label: 'Advanced',   key: 'Advanced',    color: '#39d353', icon: '🚀', desc: 'Score ≥ 75%' },
            ].map(c => {
              const count = data.clusterCounts?.[c.key] || 0;
              const total = data.totalAttempts || 1;
              const width = pct(count, total);
              return (
                <div key={c.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: c.color, fontSize: 13, fontWeight: 600 }}>{c.icon} {c.label}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{count} students · {c.desc}</span>
                  </div>
                  <div style={{ background: 'var(--bg-base)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${width}%`, height: '100%', background: c.color, borderRadius: 20, transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{width}%</div>
                </div>
              );
            })}
            {/* Pie chart */}
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={[
                  { name: 'Struggling', value: data.clusterCounts?.Beginner || 0, fill: '#ff4757' },
                  { name: 'Average',    value: data.clusterCounts?.Intermediate || 0, fill: '#f7c948' },
                  { name: 'Advanced',   value: data.clusterCounts?.Advanced || 0, fill: '#39d353' },
                ]} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                  {[0,1,2].map(i => <Cell key={i} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Score Distribution */}
          <div className="ml-card" style={{ ...card(), marginBottom: 0 }}>
            <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: 15 }}>📊 Score Distribution</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 12 }}>How scores are spread across the class</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.scoreDistribution} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                  {data.scoreDistribution?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── ROW 2: Topic Radar + Score Trend ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Topic Radar */}
          <div className="ml-card" style={{ ...card(), marginBottom: 0 }}>
            <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: 15 }}>🎯 Topic Accuracy (Radar)</h3>
            <p style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: 12 }}>Class average accuracy per topic</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={data.topicAccuracy}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="topic" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Radar name="Accuracy %" dataKey="accuracy" stroke="var(--neon-purple)" fill="var(--neon-purple)" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} formatter={v => [`${v}%`]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score Trend */}
          <div className="ml-card" style={{ ...card(), marginBottom: 0 }}>
            <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: 15 }}>📈 Score Trend (ML Tracked)</h3>
            <p style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: 12 }}>Average class performance over attempts</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.scoreTrend || MOCK.scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="attempt" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avg" name="Avg Score %" stroke="var(--neon-cyan)" strokeWidth={2.5} dot={{ fill: 'var(--neon-cyan)', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── ROW 3: Question Difficulty + Weak Topics ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Difficulty Breakdown */}
          <div className="ml-card" style={{ ...card(), marginBottom: 0 }}>
            <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: 15 }}>⚡ Question Difficulty (Random Forest)</h3>
            <p style={{ margin: '0 0 14px', color: 'var(--text-muted)', fontSize: 12 }}>Auto-classified by ML using correct rate + avg time</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {data.questionDifficulty?.map(d => {
                const c = { Easy: '#39d353', Medium: '#f7c948', Hard: '#ff4757', Unrated: '#888' }[d.label] || '#888';
                return (
                  <div key={d.label} style={{ flex: 1, padding: '16px 10px', background: 'var(--bg-base)', borderRadius: 10, textAlign: 'center', border: `1px solid ${c}33` }}>
                    <div style={{ color: c, fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{d.count}</div>
                    <div style={{ color: c, fontSize: 13, fontWeight: 600, marginTop: 4 }}>{d.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{pct(d.count, data.questionDifficulty.reduce((s, x) => s + x.count, 0))}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weak Topics + Recommendations */}
          <div className="ml-card" style={{ ...card(), marginBottom: 0, borderColor: 'rgba(255,71,87,0.2)', background: 'rgba(255,71,87,0.02)' }}>
            <h3 style={{ margin: '0 0 4px', color: '#ff4757', fontSize: 15 }}>📉 Weak Topics + ML Recommendations</h3>
            <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 12 }}>Topics where class avg accuracy &lt; 50%</p>
            {data.weakTopics?.length > 0 ? (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  {data.weakTopics.map(t => (
                    <span key={t} style={{ padding: '5px 14px', background: 'rgba(255,71,87,0.15)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 20, fontSize: 13 }}>⚠️ {t}</span>
                  ))}
                </div>
                <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '12px 14px' }}>
                  <p style={{ margin: '0 0 8px', color: 'var(--neon-cyan)', fontSize: 13, fontWeight: 600 }}>💡 ML Recommendations:</p>
                  {data.weakTopics.map(t => (
                    <div key={t} style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                      → Dedicate extra session on <strong style={{ color: 'var(--text-primary)' }}>{t}</strong> with hands-on practice
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>Generated by ML feedback engine</div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--neon-green)' }}>✅ No weak topics — class performing well!</div>
            )}
          </div>
        </div>

        {/* ── Per-Question Table ── */}
        <div className="ml-card" style={card()}>
          <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: 15 }}>📋 Per-Question ML Analysis</h3>
          <p style={{ margin: '0 0 14px', color: 'var(--text-muted)', fontSize: 12 }}>Difficulty auto-classified by Random Forest · Correct rate from real submissions</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  {['#', 'Question', 'Topic', 'ML Difficulty', 'Correct Rate', 'Attempts', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.questions?.map((q, i) => {
                  const dc = COLORS[q.difficultyLabel] || '#888';
                  const cr = q.correctRate;
                  const crColor = cr == null ? 'var(--text-muted)' : cr >= 70 ? '#39d353' : cr >= 40 ? '#f7c948' : '#ff4757';
                  const status = cr == null ? '—' : cr >= 70 ? '✅ Good' : cr >= 40 ? '⚡ Average' : '⚠️ Needs Focus';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Q{i + 1}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-primary)', maxWidth: 280 }}>{q.text}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{q.topic}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: dc + '22', color: dc, border: `1px solid ${dc}44` }}>⚡ {q.difficultyLabel}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: crColor, fontWeight: 700, fontSize: 14 }}>{cr != null ? `${cr}%` : '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{q.attemptCount || 0}</td>
                      <td style={{ padding: '10px 12px', color: crColor, fontSize: 12 }}>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ML Model Info */}
        <div style={{ ...card(), background: 'rgba(0,217,255,0.03)', borderColor: 'rgba(0,217,255,0.15)' }}>
          <h3 style={{ margin: '0 0 12px', color: 'var(--neon-cyan)', fontSize: 14 }}>🔬 ML Models Used in SmartAssign</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { name: 'Random Forest',  use: 'Question difficulty classification', detail: 'Features: correct_rate, avg_time, skip_rate → Easy/Medium/Hard label', color: 'var(--neon-cyan)' },
              { name: 'K-Means Clustering', use: 'Student performance grouping', detail: 'Topic accuracy vector → Struggling/Average/Advanced clusters', color: 'var(--neon-purple)' },
              { name: 'Rule-based NLP', use: 'Smart feedback generation', detail: 'Topic-wise accuracy → Personalized study tips per student', color: 'var(--neon-green)' },
            ].map(m => (
              <div key={m.name} style={{ padding: '14px', background: 'var(--bg-base)', borderRadius: 10, border: `1px solid ${m.color}22` }}>
                <div style={{ color: m.color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{m.name}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: 12, marginBottom: 6 }}>{m.use}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>{m.detail}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}