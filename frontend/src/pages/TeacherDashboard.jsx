import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getClasses, createClass, deleteClass, updateClass,
  uploadStudents, getClassStudents, deleteStudent, updateStudent, clearStudents,
  getTests, publishTest, deleteTest, exportResults,
} from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const mlBadge = (level) => {
  if (!level) return null;
  const c = { Beginner: '#f7c948', Intermediate: '#00d9ff', Advanced: '#39d353' }[level] || '#888';
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: c + '22', color: c, border: `1px solid ${c}44`, fontWeight: 700 }}>{level}</span>;
};

const statusBadge = (status) => {
  const styles = {
    active:    { bg: 'rgba(57,211,83,0.15)',    color: 'var(--neon-green)',  border: 'rgba(57,211,83,0.4)' },
    draft:     { bg: 'rgba(255,255,255,0.05)',  color: 'var(--text-muted)', border: 'var(--border)' },
    completed: { bg: 'rgba(247,201,72,0.15)',   color: 'var(--neon-amber)', border: 'rgba(247,201,72,0.4)' },
  };
  const s = styles[status] || styles.draft;
  return <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span>;
};

export default function TeacherDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [hasStudents, setHasStudents] = useState(true);

  // Modals
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [classForm, setClassForm] = useState({ name: '', subjectCode: '', description: '' });
  const [studentForm, setStudentForm] = useState({ name: '', email: '' });
  const [uploadingFor, setUploadingFor] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cr, tr] = await Promise.all([getClasses(), getTests()]);
      setClasses(cr.classes || []);
      setTests(tr.tests || []);
    } catch (e) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleCreateClass = async () => {
    if (!classForm.name) return toast.error('Class name required');
    try {
      await createClass(classForm);
      toast.success('Class created!');
      setShowCreateClass(false);
      setClassForm({ name: '', subjectCode: '', description: '' });
      loadAll();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleUpdateClass = async () => {
    if (!classForm.name) return toast.error('Class name required');
    try {
      await updateClass(editingClass._id, classForm);
      toast.success('Class updated!');
      setEditingClass(null);
      setClassForm({ name: '', subjectCode: '', description: '' });
      loadAll();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleDeleteClass = async (id) => {
    if (!confirm('Delete this class? This cannot be undone.')) return;
    try { await deleteClass(id); toast.success('Class deleted'); loadAll(); if (selectedClass?._id === id) setSelectedClass(null); }
    catch (e) { toast.error('Failed to delete class'); }
  };

  const handleViewStudents = async (cls) => {
    setSelectedClass(cls);
    setStudentsLoading(true);
    try {
      const res = await getClassStudents(cls._id);
      setStudents(res.students || []);
      setHasStudents(res.hasStudents !== false);
    } catch (e) { toast.error('Failed to load students'); }
    finally { setStudentsLoading(false); }
  };

  const handleUpload = async (classId, file) => {
    const fd = new FormData(); fd.append('file', file);
    setUploadingFor(classId);
    try {
      const res = await uploadStudents(classId, fd);
      toast.success(res.message);
      loadAll();
      const cls = classes.find(c => c._id === classId);
      if (cls) handleViewStudents(cls);
    } catch (e) { toast.error(e.response?.data?.message || 'Upload failed'); }
    finally { setUploadingFor(null); }
  };

  const handleDeleteStudent = async (enrollmentNo) => {
    if (!confirm(`Remove ${enrollmentNo} from class?`)) return;
    try {
      await deleteStudent(selectedClass._id, enrollmentNo);
      toast.success('Student removed');
      setStudents(p => p.filter(s => s.enrollmentNo !== enrollmentNo));
    } catch (e) { toast.error('Failed to remove student'); }
  };

  const handleUpdateStudent = async () => {
    try {
      await updateStudent(selectedClass._id, editingStudent.enrollmentNo, studentForm);
      toast.success('Student updated');
      setStudents(p => p.map(s => s.enrollmentNo === editingStudent.enrollmentNo ? { ...s, ...studentForm } : s));
      setEditingStudent(null);
    } catch (e) { toast.error('Failed to update student'); }
  };

  const handleClearStudents = async () => {
    if (!confirm('Remove ALL students from this class?')) return;
    try {
      await clearStudents(selectedClass._id);
      toast.success('All students removed');
      setStudents([]);
      setHasStudents(false);
      loadAll();
    } catch (e) { toast.error('Failed'); }
  };

  const handlePublish = async (id) => {
    try { await publishTest(id); toast.success('Test published!'); loadAll(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleDeleteTest = async (id) => {
    if (!confirm('Delete this test?')) return;
    try { await deleteTest(id); toast.success('Test deleted'); loadAll(); }
    catch (e) { toast.error('Failed'); }
  };

  const handleExport = async (id, title) => {
    try { await exportResults(id, title); }
    catch (e) { toast.error('Export failed'); }
  };

  if (loading) return <Loader fullScreen text="Loading dashboard..." />;

  const card  = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 };
  const btn   = (color = 'var(--neon-cyan)') => ({ padding: '8px 16px', borderRadius: 8, border: 'none', background: color, color: ['var(--neon-cyan)', '#39d353', 'var(--neon-green)'].includes(color) ? '#080b10' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-body)' });
  const inp   = { width: '100%', padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box' };
  const label = { display: 'block', color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 };

  const ClassForm = ({ title, onSave, onCancel }) => (
    <div style={{ ...card, marginBottom: 20, borderColor: 'rgba(0,217,255,0.3)', background: 'rgba(0,217,255,0.02)' }}>
      <h3 style={{ margin: '0 0 16px', color: 'var(--neon-cyan)' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {[['name', 'Class Name *', 'e.g. BCA-3A'], ['subjectCode', 'Subject Code', 'e.g. CS301']].map(([k, l, ph]) => (
          <div key={k}>
            <label style={label}>{l}</label>
            <input value={classForm[k]} onChange={e => setClassForm(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={inp} />
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={label}>Description</label>
        <input value={classForm.description} onChange={e => setClassForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" style={inp} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onSave} style={btn()}>Save</button>
        <button onClick={onCancel} style={{ ...btn('transparent'), color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--neon-cyan)', margin: 0, fontSize: 28 }}>SmartAssign</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>Welcome, {user?.name}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* FIX #10: New Test button goes to create-test with no preselected class — class selector shown on that page */}
            <button onClick={() => navigate('/teacher/create-test')} style={{ ...btn(), padding: '10px 20px' }}>+ New Test</button>
            <button onClick={logoutUser} style={{ padding: '10px 16px', background: 'rgba(255,71,87,0.15)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {[['classes', '🏫 Classes'], ['tests', '📋 All Tests']].map(([key, lbl]) => (
            <button key={key} onClick={() => setTab(key)} style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', color: tab === key ? 'var(--neon-cyan)' : 'var(--text-muted)', borderBottom: tab === key ? '2px solid var(--neon-cyan)' : '2px solid transparent', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)' }}>{lbl}</button>
          ))}
        </div>

        {/* ── CLASSES TAB ── */}
        {tab === 'classes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>My Classes ({classes.length})</h2>
              <button onClick={() => { setShowCreateClass(true); setEditingClass(null); setClassForm({ name: '', subjectCode: '', description: '' }); }} style={btn()}>+ Create Class</button>
            </div>

            {showCreateClass && <ClassForm title="New Class" onSave={handleCreateClass} onCancel={() => setShowCreateClass(false)} />}
            {editingClass && <ClassForm title={`Edit — ${editingClass.name}`} onSave={handleUpdateClass} onCancel={() => setEditingClass(null)} />}

            {classes.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: 60 }}>
                <p style={{ fontSize: 40, margin: '0 0 12px' }}>🏫</p>
                <p style={{ color: 'var(--text-muted)' }}>No classes yet. Create your first class.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {classes.map(cls => (
                  <div key={cls._id} style={{ ...card }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{cls.name}</h3>
                        {cls.subjectCode && <p style={{ margin: '3px 0 0', color: 'var(--neon-cyan)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{cls.subjectCode}</p>}
                        {cls.description && <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{cls.description}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* FIX #3: Edit class button */}
                        <button onClick={() => { setEditingClass(cls); setClassForm({ name: cls.name, subjectCode: cls.subjectCode || '', description: cls.description || '' }); setShowCreateClass(false); }} style={{ background: 'rgba(0,217,255,0.1)', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontSize: 13 }}>✏️</button>
                        <button onClick={() => handleDeleteClass(cls._id)} style={{ background: 'rgba(255,71,87,0.1)', border: 'none', color: '#ff4757', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontSize: 13 }}>🗑</button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                      <span>👥 {cls.students?.length || 0} students</span>
                      <span style={{ color: (cls.students?.filter(s => s.joinStatus === 'joined').length || 0) > 0 ? 'var(--neon-green)' : 'var(--text-muted)' }}>
                        ✓ {cls.students?.filter(s => s.joinStatus === 'joined').length || 0} joined
                      </span>
                    </div>

                    {/* FIX #8: Show tests assigned to this class */}
                    {cls.tests?.length > 0 && (
                      <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 8 }}>
                        <p style={{ margin: '0 0 6px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>📋 TESTS IN THIS CLASS</p>
                        {cls.tests.map(t => (
                          <div key={t._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                            <span style={{ color: 'var(--text-primary)' }}>{t.title}</span>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {statusBadge(t.status)}
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.attemptCount || 0} attempts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button onClick={() => handleViewStudents(cls)} style={{ ...btn('rgba(0,217,255,0.1)'), color: 'var(--neon-cyan)', border: '1px solid rgba(0,217,255,0.3)' }}>👥 View Students</button>
                      <label style={{ ...btn('rgba(176,76,255,0.1)'), color: 'var(--neon-purple)', border: '1px solid rgba(176,76,255,0.3)', cursor: 'pointer' }}>
                        {uploadingFor === cls._id ? '⏳ Uploading...' : '📤 Upload List'}
                        <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleUpload(cls._id, e.target.files[0])} />
                      </label>
                      <button onClick={() => navigate('/teacher/create-test', { state: { classId: cls._id, className: cls.name } })} style={{ ...btn('rgba(57,211,83,0.1)'), color: 'var(--neon-green)', border: '1px solid rgba(57,211,83,0.3)' }}>+ Add Test</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Student List Panel */}
            {selectedClass && (
              <div style={{ ...card, marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                      Students — <span style={{ color: 'var(--neon-cyan)' }}>{selectedClass.name}</span>
                      {selectedClass.subjectCode && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}> · {selectedClass.subjectCode}</span>}
                    </h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{students.length} students</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {students.length > 0 && (
                      <button onClick={handleClearStudents} style={{ padding: '6px 14px', background: 'rgba(255,71,87,0.1)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>🗑 Clear All</button>
                    )}
                    <button onClick={() => setSelectedClass(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 22 }}>✕</button>
                  </div>
                </div>

                {studentsLoading ? <Loader /> : (
                  /* FIX #9: Show upload prompt if no students */
                  !hasStudents || students.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-base)', borderRadius: 10 }}>
                      <p style={{ fontSize: 36, margin: '0 0 12px' }}>📋</p>
                      <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No student list uploaded for this class yet.</p>
                      <label style={{ ...btn(), cursor: 'pointer', display: 'inline-block' }}>
                        📤 Upload Student List Now
                        <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleUpload(selectedClass._id, e.target.files[0])} />
                      </label>
                    </div>
                  ) : (
                    <>
                      {/* Edit student modal */}
                      {editingStudent && (
                        <div style={{ ...card, marginBottom: 16, borderColor: 'rgba(247,201,72,0.3)', background: 'rgba(247,201,72,0.03)' }}>
                          <h4 style={{ margin: '0 0 12px', color: 'var(--neon-amber)' }}>Edit — {editingStudent.enrollmentNo}</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div><label style={label}>Name</label><input value={studentForm.name} onChange={e => setStudentForm(p => ({ ...p, name: e.target.value }))} style={inp} /></div>
                            <div><label style={label}>Email</label><input value={studentForm.email} onChange={e => setStudentForm(p => ({ ...p, email: e.target.value }))} style={inp} /></div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleUpdateStudent} style={btn('var(--neon-amber)')}>Save</button>
                            <button onClick={() => setEditingStudent(null)} style={{ ...btn('transparent'), color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Cancel</button>
                          </div>
                        </div>
                      )}

                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Enrollment No', 'Name', 'Email', 'Join Status', 'Tests Taken', 'Latest Result', 'ML Level', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((s, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: s.flagged ? 'rgba(255,71,87,0.04)' : 'transparent' }}>
                                <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontSize: 13 }}>{s.enrollmentNo}</td>
                                <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{s.name} {s.flagged && <span title="Flagged">⚠️</span>}</td>
                                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 13 }}>{s.email || '—'}</td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                                    background: s.joinStatus === 'joined' ? 'rgba(57,211,83,0.15)' : 'rgba(247,201,72,0.15)',
                                    color: s.joinStatus === 'joined' ? 'var(--neon-green)' : 'var(--neon-amber)',
                                    border: `1px solid ${s.joinStatus === 'joined' ? 'rgba(57,211,83,0.4)' : 'rgba(247,201,72,0.4)'}`,
                                  }}>{s.joinStatus === 'joined' ? '✓ Joined' : '⏳ Pending'}</span>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-primary)' }}>{s.testsTaken}</td>
                                <td style={{ padding: '10px 12px' }}>
                                  {s.latestResult
                                    ? <span style={{ color: s.latestResult.percentage >= 75 ? 'var(--neon-green)' : s.latestResult.percentage >= 40 ? 'var(--neon-amber)' : '#ff4757', fontWeight: 600 }}>{s.latestResult.percentage?.toFixed(1)}% ({s.latestResult.grade})</span>
                                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </td>
                                <td style={{ padding: '10px 12px' }}>{mlBadge(s.mlCluster)}</td>
                                <td style={{ padding: '10px 12px' }}>
                                  {/* FIX #4: Edit + Delete individual student */}
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => { setEditingStudent(s); setStudentForm({ name: s.name, email: s.email }); }} style={{ padding: '4px 10px', background: 'rgba(247,201,72,0.1)', color: 'var(--neon-amber)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✏️</button>
                                    <button onClick={() => handleDeleteStudent(s.enrollmentNo)} style={{ padding: '4px 10px', background: 'rgba(255,71,87,0.1)', color: '#ff4757', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>🗑</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TESTS TAB ── */}
        {tab === 'tests' && (
          <div>
            <h2 style={{ margin: '0 0 20px', color: 'var(--text-primary)' }}>All Tests ({tests.length})</h2>
            {tests.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: 60 }}>
                <p style={{ fontSize: 40, margin: '0 0 12px' }}>📋</p>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No tests yet.</p>
                <button onClick={() => navigate('/teacher/create-test')} style={btn()}>Create First Test</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tests.map(t => {
                  const cls = classes.find(c => c._id === t.classId);
                  return (
                    <div key={t._id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16 }}>{t.title}</h3>
                          {statusBadge(t.status)}
                          {/* FIX #8: show class name next to test */}
                          {cls && <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: 'rgba(0,217,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,217,255,0.2)' }}>🏫 {cls.name}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                          <span>⏱ {t.duration} min</span>
                          <span>📊 {t.attemptCount || 0} attempts</span>
                          {t.endTime && <span>🕐 Ends {new Date(t.endTime).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {t.status === 'draft' && <button onClick={() => handlePublish(t._id)} style={{ ...btn(), fontSize: 12, padding: '6px 14px' }}>Publish</button>}
                        <button onClick={() => navigate(`/teacher/test/${t._id}/insights`)} style={{ padding: '6px 14px', background: 'rgba(176,76,255,0.15)', color: 'var(--neon-purple)', border: '1px solid rgba(176,76,255,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>🧠 ML Insights</button>
                        <button onClick={() => navigate(`/teacher/test/${t._id}/results`)} style={{ padding: '6px 14px', background: 'rgba(0,217,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,217,255,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Results</button>
                        <button onClick={() => handleExport(t._id, t.title)} style={{ padding: '6px 14px', background: 'rgba(57,211,83,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(57,211,83,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>📥 Export</button>
                        <button onClick={() => handleDeleteTest(t._id)} style={{ padding: '6px 14px', background: 'rgba(255,71,87,0.1)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}