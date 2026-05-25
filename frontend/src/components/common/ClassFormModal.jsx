// frontend/src/components/ClassFormModal.jsx
// Extracted as a separate file to prevent re-mount on every parent render
// This is the fix for the keyboard freeze bug

import { useState, useEffect } from 'react';

const INPUT_STYLE = {
  width: '100%',
  padding: '10px 14px',
  background: '#010409',
  border: '1px solid #30363d',
  borderRadius: 8,
  color: '#e6edf3',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL_STYLE = {
  display: 'block',
  color: '#8b949e',
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 6,
};

export default function ClassFormModal({ onSubmit, onClose, initial }) {
  const [form, setForm] = useState({
    name: '',
    subject: '',
    section: '',
    semester: '',
    academicYear: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        subject: initial.subject || '',
        section: initial.section || '',
        semester: initial.semester || '',
        academicYear: initial.academicYear || '',
      });
    }
  }, [initial]);

  const handle = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(1,4,9,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#0d1117', border: '1px solid #30363d',
        borderRadius: 14, padding: 28, width: '100%', maxWidth: 460,
      }}>
        <h2 style={{ margin: '0 0 20px', color: '#e6edf3', fontSize: 18 }}>
          {initial ? '✏️ Edit Class' : '➕ Create New Class'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={LABEL_STYLE}>Class Name *</label>
            <input
              autoFocus
              value={form.name}
              onChange={handle('name')}
              placeholder="e.g. BCA 4th Sem A"
              required
              style={INPUT_STYLE}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={LABEL_STYLE}>Subject</label>
            <input
              value={form.subject}
              onChange={handle('subject')}
              placeholder="e.g. Data Structures"
              style={INPUT_STYLE}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={LABEL_STYLE}>Section</label>
              <input
                value={form.section}
                onChange={handle('section')}
                placeholder="e.g. A"
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Semester</label>
              <input
                value={form.semester}
                onChange={handle('semester')}
                placeholder="e.g. 4"
                style={INPUT_STYLE}
              />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={LABEL_STYLE}>Academic Year</label>
            <input
              value={form.academicYear}
              onChange={handle('academicYear')}
              placeholder="e.g. 2024-25"
              style={INPUT_STYLE}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '11px', background: 'none',
              border: '1px solid #30363d', color: '#8b949e',
              borderRadius: 8, cursor: 'pointer', fontSize: 14,
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '11px',
              background: loading ? '#1f2937' : 'linear-gradient(135deg, #b04cff, #00d9ff)',
              border: 'none', color: '#fff',
              borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700,
            }}>
              {loading ? 'Saving...' : initial ? 'Update Class' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}