import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResults } from '../services/api';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const gradeColor = (g) => ({ A: '#39d353', B: '#00d9ff', C: '#f7c948', D: '#ff8c42', F: '#ff4757' }[g] || '#888');
const mlColors = { Beginner: '#f7c948', Intermediate: '#00d9ff', Advanced: '#39d353' };

export default function TestResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testTitle, setTestTitle] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getResults(id)
      .then(r => { setResults(r.results || []); setTestTitle(r.testTitle || ''); })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader fullScreen text="Loading results..." />;

  const filtered = results.filter(r =>
    !search || r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    r.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const avg = results.length ? (results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length).toFixed(1) : 0;
  const passed = results.filter(r => r.percentage >= 40).length;
  const flagged = results.filter(r => r.flagged).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => navigate('/teacher')} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>← Back</button>
          <div>
            <h1 style={{ margin: 0, color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)', fontSize: 22 }}>Results</h1>
            {testTitle && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>{testTitle}</p>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Attempts', value: results.length, color: 'var(--neon-cyan)' },
            { label: 'Average Score', value: avg + '%', color: 'var(--neon-purple)' },
            { label: 'Passed (≥40%)', value: passed, color: 'var(--neon-green)' },
            { label: 'Flagged ⚠️', value: flagged, color: '#ff4757' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ color: s.color, fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          placeholder="Search by name or enrollment number..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }}
        />

        {/* Table */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              {results.length === 0 ? 'No attempts yet for this test.' : 'No results match your search.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  {['#', 'Name', 'Enrollment No', 'Score', 'Percentage', 'Grade', 'ML Level', 'Status', 'Flag'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: r.flagged ? 'rgba(255,71,87,0.04)' : 'transparent' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13 }}>{i + 1}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{r.studentName || '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{r.rollNumber || '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>{r.totalMarks} / {r.maxMarks}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ color: r.percentage >= 75 ? 'var(--neon-green)' : r.percentage >= 40 ? 'var(--neon-amber)' : '#ff4757', fontWeight: 600 }}>
                        {r.percentage?.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 13, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: gradeColor(r.grade) + '22', color: gradeColor(r.grade), border: `1px solid ${gradeColor(r.grade)}44` }}>{r.grade}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {r.mlLevel ? (
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: mlColors[r.mlLevel] + '22', color: mlColors[r.mlLevel], border: `1px solid ${mlColors[r.mlLevel]}44` }}>
                          {r.mlLevel}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                        background: r.status === 'submitted' ? 'rgba(57,211,83,0.15)' : 'rgba(247,201,72,0.15)',
                        color: r.status === 'submitted' ? 'var(--neon-green)' : 'var(--neon-amber)',
                      }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {r.flagged ? <span title="Tab switching detected" style={{ color: '#ff4757', fontSize: 16 }}>⚠️</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}