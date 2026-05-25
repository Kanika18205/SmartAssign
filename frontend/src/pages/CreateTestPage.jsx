import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createTest, getClasses } from '../services/api';
import { QUESTION_BANK, SUBJECTS } from '../data/questionBank';
import toast from 'react-hot-toast';

const diffColors = { easy: '#39d353', medium: '#f7c948', hard: '#ff4757' };

// FIX #6: DateTime picker with visible calendar icon (white color)
function DateTimePicker({ label, value, onChange }) {
  const [draft, setDraft] = useState(value ? value.slice(0, 16) : '');
  return (
    <div>
      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="datetime-local"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--bg-base)',
              border: `1px solid ${value ? 'var(--neon-cyan)' : 'var(--border)'}`,
              borderRadius: 8, color: 'var(--text-primary)',
              fontSize: 14, fontFamily: 'var(--font-body)',
              boxSizing: 'border-box',
              colorScheme: 'dark',   // FIX #6: makes calendar icon white on dark bg
            }}
          />
        </div>
        <button
          onClick={() => { onChange(draft); toast.success(label + ' confirmed!'); }}
          style={{ padding: '10px 16px', background: 'var(--neon-cyan)', color: '#080b10', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}
        >✓ OK</button>
        {value && (
          <button onClick={() => { setDraft(''); onChange(''); }} style={{ padding: '10px 12px', background: 'rgba(255,71,87,0.15)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>✕</button>
        )}
      </div>
      {value && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--neon-green)' }}>✓ {new Date(value).toLocaleString()}</p>}
    </div>
  );
}

export default function CreateTestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const preClass = location.state;

  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', duration: 30, startTime: '', endTime: '', classId: preClass?.classId || '' });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [bankOpen, setBankOpen] = useState(false);
  // FIX #7: track which bank questions have been added
  const [addedTexts, setAddedTexts] = useState(new Set());

  useEffect(() => {
    getClasses().then(r => setClasses(r.classes || [])).catch(() => {});
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addBlankQ = () => setQuestions(p => [...p, { text: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', marks: 1, topic: 'General', difficulty: 'medium' }]);

  // FIX #7: prevent adding same question twice
  const addFromBank = (q) => {
    if (addedTexts.has(q.text)) return toast.error('This question is already added!');
    setQuestions(p => [...p, { ...q, marks: 1, difficulty: 'medium' }]);
    setAddedTexts(p => new Set([...p, q.text]));
    toast.success('Question added!');
  };

  const updateQ    = (i, k, v) => setQuestions(p => p.map((q, j) => j === i ? { ...q, [k]: v } : q));
  const updateOpt  = (i, opt, v) => setQuestions(p => p.map((q, j) => j === i ? { ...q, options: { ...q.options, [opt]: v } } : q));
  const removeQ    = (i) => {
    const removed = questions[i];
    setAddedTexts(p => { const n = new Set(p); n.delete(removed.text); return n; });
    setQuestions(p => p.filter((_, j) => j !== i));
  };

  const handleSubmit = async () => {
    if (!form.title) return toast.error('Test title required');
    if (!form.duration || form.duration < 1) return toast.error('Duration required');
    if (questions.length === 0) return toast.error('Add at least one question');
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return toast.error(`Q${i + 1}: question text is empty`);
      if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) return toast.error(`Q${i + 1}: all 4 options required`);
    }
    setLoading(true);
    try {
      await createTest({ ...form, questions });
      toast.success('Test created successfully!');
      navigate('/teacher');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to create test'); }
    finally { setLoading(false); }
  };

  const inp   = { width: '100%', padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box' };
  const card  = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 };
  const label = { display: 'block', color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 24 }}>
      {/* FIX #6: global style for datetime calendar icon */}
      <style>{`
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(1) brightness(2);
          cursor: pointer;
          opacity: 0.8;
        }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>

      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => navigate('/teacher')} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>← Back</button>
          <h1 style={{ margin: 0, color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)', fontSize: 24 }}>Create Test</h1>
          {preClass?.className && <span style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, background: 'rgba(0,217,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,217,255,0.3)' }}>🏫 {preClass.className}</span>}
        </div>

        {/* Test Details */}
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)' }}>Test Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={label}>Test Title *</label>
              <input style={inp} placeholder="e.g. Data Structures Mid-Term" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label style={label}>Duration (minutes) *</label>
              <input style={inp} type="number" min="1" value={form.duration} onChange={e => set('duration', e.target.value)} />
            </div>
            <div>
              {/* FIX #10: Always show class selector on this page */}
              <label style={label}>Assign to Class {!preClass?.classId && <span style={{ color: 'var(--neon-amber)', fontSize: 12 }}>(select or leave open)</span>}</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.classId} onChange={e => set('classId', e.target.value)}>
                <option value="">— No class (open test) —</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}{c.subjectCode ? ` (${c.subjectCode})` : ''}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={label}>Description (optional)</label>
              <input style={inp} placeholder="Brief description" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <DateTimePicker label="Start Time (optional)" value={form.startTime} onChange={v => set('startTime', v)} />
            <DateTimePicker label="End Time (optional)"   value={form.endTime}   onChange={v => set('endTime',   v)} />
          </div>
        </div>

        {/* Question Bank */}
        <div style={{ ...card, borderColor: 'rgba(176,76,255,0.3)', background: 'rgba(176,76,255,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: bankOpen ? 16 : 0 }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--neon-purple)' }}>🧠 Question Bank</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Pre-built questions — auto-fills everything · {Object.values(QUESTION_BANK).flat().length} questions across {SUBJECTS.length} subjects</p>
            </div>
            <button onClick={() => setBankOpen(p => !p)} style={{ padding: '8px 16px', background: 'rgba(176,76,255,0.15)', color: 'var(--neon-purple)', border: '1px solid rgba(176,76,255,0.4)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {bankOpen ? '▲ Close' : '▼ Browse'}
            </button>
          </div>
          {bankOpen && (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {SUBJECTS.map(s => (
                  <button key={s} onClick={() => setSelectedSubject(s)} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: selectedSubject === s ? 'var(--neon-purple)' : 'rgba(176,76,255,0.1)', color: selectedSubject === s ? '#fff' : 'var(--neon-purple)' }}>{s}</button>
                ))}
              </div>
              {selectedSubject && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                  {QUESTION_BANK[selectedSubject].map((q, i) => {
                    const isAdded = addedTexts.has(q.text);
                    return (
                      <div key={i} style={{ background: 'var(--bg-base)', border: `1px solid ${isAdded ? 'rgba(57,211,83,0.4)' : 'var(--border)'}`, borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, opacity: isAdded ? 0.7 : 1 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: 14 }}>{q.text}</p>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {Object.entries(q.options).map(([k, v]) => (
                              <span key={k} style={{ fontSize: 12, color: k === q.correctAnswer ? 'var(--neon-green)' : 'var(--text-muted)' }}>
                                {k === q.correctAnswer ? '✓ ' : ''}{k}: {v}
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* FIX #7: Show "Added" badge if already in test */}
                        {isAdded
                          ? <span style={{ padding: '6px 14px', background: 'rgba(57,211,83,0.15)', color: 'var(--neon-green)', borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>✓ Added</span>
                          : <button onClick={() => addFromBank(q)} style={{ padding: '6px 14px', background: 'var(--neon-purple)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>+ Add</button>}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Questions List */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
              Questions Added ({questions.length})
              {questions.length > 0 && <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text-muted)' }}>Total marks: {questions.reduce((s, q) => s + (q.marks || 1), 0)}</span>}
            </h3>
            <button onClick={addBlankQ} style={{ padding: '8px 18px', background: 'var(--neon-green)', color: '#080b10', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ Add Blank</button>
          </div>

          {questions.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: 40, borderStyle: 'dashed' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No questions yet. Browse the Question Bank above or click "+ Add Blank".</p>
            </div>
          )}

          {questions.map((q, i) => (
            <div key={i} style={{ ...card, borderLeft: `3px solid ${diffColors[q.difficulty] || 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontSize: 13, fontWeight: 700 }}>Q{i + 1}</span>
                  <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600, background: (diffColors[q.difficulty] || '#888') + '22', color: diffColors[q.difficulty] || '#888', border: `1px solid ${(diffColors[q.difficulty] || '#888')}44` }}>⚡ {q.difficulty}</span>
                  <select value={q.difficulty} onChange={e => updateQ(i, 'difficulty', e.target.value)} style={{ padding: '3px 8px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 13 }}>Marks:</label>
                  <input type="number" min="1" value={q.marks} onChange={e => updateQ(i, 'marks', parseInt(e.target.value) || 1)} style={{ width: 56, padding: '4px 8px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14, textAlign: 'center' }} />
                  <button onClick={() => removeQ(i)} style={{ background: 'rgba(255,71,87,0.15)', border: 'none', color: '#ff4757', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>✕ Remove</button>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={label}>Question Text</label>
                <textarea value={q.text} onChange={e => updateQ(i, 'text', e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="Enter your question here..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {['A', 'B', 'C', 'D'].map(opt => (
                  <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: q.correctAnswer === opt ? 'var(--neon-green)' : 'var(--text-muted)', fontWeight: 700, minWidth: 18 }}>{opt}</span>
                    <input value={q.options[opt]} onChange={e => updateOpt(i, opt, e.target.value)} style={{ ...inp, borderColor: q.correctAnswer === opt ? 'rgba(57,211,83,0.5)' : 'var(--border)' }} placeholder={`Option ${opt}`} />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: 13 }}>Correct:</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button key={opt} onClick={() => updateQ(i, 'correctAnswer', opt)} style={{ width: 36, height: 36, borderRadius: 8, border: '2px solid', borderColor: q.correctAnswer === opt ? 'var(--neon-green)' : 'var(--border)', background: q.correctAnswer === opt ? 'rgba(57,211,83,0.2)' : 'transparent', color: q.correctAnswer === opt ? 'var(--neon-green)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{opt}</button>
                  ))}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 13 }}>Topic:</label>
                  <input value={q.topic} onChange={e => updateQ(i, 'topic', e.target.value)} style={{ padding: '4px 10px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, width: 140 }} placeholder="e.g. Arrays" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingBottom: 40 }}>
          <button onClick={() => navigate('/teacher')} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '12px 28px', background: 'var(--neon-cyan)', color: '#080b10', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Saving...' : `✓ Save Test (${questions.length} questions)`}
          </button>
        </div>
      </div>
    </div>
  );
}