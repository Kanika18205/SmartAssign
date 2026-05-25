import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAttemptDetail } from '../services/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import Loader from '../components/common/Loader';

const gradeColors = { A: '#39d353', B: '#00d9ff', C: '#f7c948', D: '#ff8c42', F: '#ff4757' };
const levelColors = { Beginner: '#f7c948', Intermediate: '#00d9ff', Advanced: '#39d353' };
const diffColors  = { easy: '#39d353', medium: '#f7c948', hard: '#ff4757', unrated: '#888' };

export default function ResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    getAttemptDetail(attemptId).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <Loader fullScreen text="Loading results..." />;
  if (!data) return <div style={{ color: '#fff', padding: 40 }}>Result not found</div>;

  const { attempt, test, mlFeedback } = data;
  const grade = attempt?.grade || 'F';
  const pct   = attempt?.percentage?.toFixed(1) || 0;
  const level = mlFeedback?.level || 'Beginner';

  const radarData = mlFeedback?.topicAccuracy
    ? Object.entries(mlFeedback.topicAccuracy).map(([topic, accuracy]) => ({ topic, accuracy }))
    : [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 24 }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--neon-cyan)', margin: 0 }}>Your Result</h1>
          <button onClick={() => navigate('/student')} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, cursor: 'pointer' }}>← Dashboard</button>
        </div>

        {/* Score Card */}
        <div style={{ background: 'var(--bg-card)', border: `2px solid ${gradeColors[grade]}44`, borderRadius: 16, padding: 32, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 72, fontFamily: 'var(--font-display)', color: gradeColors[grade], lineHeight: 1 }}>{grade}</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-primary)', margin: '8px 0' }}>{pct}%</div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{attempt?.totalScore} / {attempt?.maxScore} marks · {test?.title}</div>
          {attempt?.flagged && (
            <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.4)', borderRadius: 8, color: '#ff4757', fontSize: 13, fontWeight: 600 }}>
              ⚠️ Flagged: Tab switching detected during test
            </div>
          )}
        </div>

        {/* ML ANALYSIS PANEL — prominently displayed */}
        {mlFeedback && (
          <div style={{ background: 'linear-gradient(135deg, rgba(176,76,255,0.08), rgba(0,217,255,0.05))', border: '1px solid rgba(176,76,255,0.3)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 22 }}>🤖</span>
              <h2 style={{ margin: 0, color: 'var(--neon-purple)', fontFamily: 'var(--font-display)', fontSize: 20 }}>ML Analysis</h2>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(176,76,255,0.15)', color: 'var(--neon-purple)', border: '1px solid rgba(176,76,255,0.3)', fontFamily: 'var(--font-mono)' }}>AI-Powered</span>
            </div>

            {/* Level Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '14px 18px', background: 'var(--bg-base)', borderRadius: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: levelColors[level] + '22', border: `2px solid ${levelColors[level]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {level === 'Beginner' ? '🌱' : level === 'Intermediate' ? '⚡' : '🚀'}
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Performance Level (ML Classified)</div>
                <div style={{ color: levelColors[level], fontWeight: 700, fontSize: 18 }}>{level}</div>
              </div>
            </div>

            {/* Summary */}
            {mlFeedback.summary && (
              <div style={{ padding: '14px 18px', background: 'var(--bg-base)', borderRadius: 10, marginBottom: 14 }}>
                <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.7, fontSize: 14 }}>{mlFeedback.summary}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {/* Weak Topics */}
              {mlFeedback.weakTopics?.length > 0 && (
                <div style={{ padding: '14px 18px', background: 'rgba(255,71,87,0.05)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 10 }}>
                  <div style={{ color: '#ff4757', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>📉 Needs Improvement</div>
                  {mlFeedback.weakTopics.map(t => <div key={t} style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>• {t}</div>)}
                </div>
              )}
              {/* Strong Topics */}
              {mlFeedback.strongTopics?.length > 0 && (
                <div style={{ padding: '14px 18px', background: 'rgba(57,211,83,0.05)', border: '1px solid rgba(57,211,83,0.2)', borderRadius: 10 }}>
                  <div style={{ color: 'var(--neon-green)', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>📈 Strong Areas</div>
                  {mlFeedback.strongTopics.map(t => <div key={t} style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>• {t}</div>)}
                </div>
              )}
            </div>

            {/* Study Tips */}
            {mlFeedback.tips?.length > 0 && (
              <div style={{ padding: '14px 18px', background: 'rgba(0,217,255,0.04)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: 10, marginBottom: 14 }}>
                <div style={{ color: 'var(--neon-cyan)', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>💡 Study Tips (ML Recommended)</div>
                {mlFeedback.tips.map((tip, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-muted)', padding: '6px 0', borderBottom: i < mlFeedback.tips.length-1 ? '1px solid var(--border)' : 'none', lineHeight: 1.6 }}>→ {tip}</div>
                ))}
              </div>
            )}

            {/* Radar Chart */}
            {radarData.length > 1 && (
              <div style={{ padding: '14px 18px', background: 'var(--bg-base)', borderRadius: 10 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>Topic Performance (ML Analysis)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="topic" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Radar name="Accuracy" dataKey="accuracy" stroke="var(--neon-purple)" fill="var(--neon-purple)" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v) => [`${v}%`, 'Accuracy']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Answer Review */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAnswers ? 20 : 0 }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Answer Review</h3>
            <button onClick={() => setShowAnswers(p => !p)} style={{ padding: '8px 16px', background: 'rgba(0,217,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,217,255,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {showAnswers ? '▲ Hide' : '▼ Show Answers'}
            </button>
          </div>
          {showAnswers && data.responses?.map((r, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <span style={{ color: r.isCorrect ? 'var(--neon-green)' : '#ff4757', fontSize: 18, marginTop: 1 }}>{r.isCorrect ? '✓' : '✗'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>Q{i+1}.</span>{r.questionText}
                  </p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span style={{ color: r.isCorrect ? 'var(--neon-green)' : '#ff4757' }}>Your: {r.selectedAnswer || '—'}</span>
                    {!r.isCorrect && <span style={{ color: 'var(--neon-green)' }}>Correct: {r.correctAnswer}</span>}
                    {/* ML difficulty badge on each question */}
                    {r.difficultyLabel && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: diffColors[r.difficultyLabel] + '22', color: diffColors[r.difficultyLabel], border: `1px solid ${diffColors[r.difficultyLabel]}44` }}>⚡ {r.difficultyLabel}</span>}
                    {r.topic && <span style={{ color: 'var(--text-muted)' }}>· {r.topic}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}