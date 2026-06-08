import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import './EnterpriseSection.css'

const CATEGORIES = {
  performance: { label: 'Performance', color: '#ec4899', bg: '#fdf2f8' },
  skill: { label: 'Skill', color: '#3b82f6', bg: '#eff6ff' },
  leadership: { label: 'Leadership', color: '#8b5cf6', bg: '#f5f3ff' },
  project: { label: 'Project', color: '#10b981', bg: '#ecfdf5' },
}

const CERT_CATEGORIES = {
  technical: { label: 'Technical', icon: '💻' },
  leadership: { label: 'Leadership', icon: '🎯' },
  compliance: { label: 'Compliance', icon: '🛡️' },
  language: { label: 'Language', icon: '🗣️' },
  other: { label: 'Other', icon: '📌' },
}


// ── Modal Wrapper ────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="es-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="es-modal" style={{ maxWidth: '580px' }}>
        <div className="es-modal-header">
          <div>
            <h2 className="es-modal-title">{title}</h2>
            {subtitle && <p className="es-modal-sub">{subtitle}</p>}
          </div>
          <button className="es-modal-close" onClick={onClose}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="es-modal-body">{children}</div>
      </div>
    </div>
  )
}

export default function LearningSection({ user }) {
  const { token } = useAuth()
  const isManager = user?.role === 'manager'

  const [activeTab, setActiveTab] = useState('goals')
  const [goals, setGoals] = useState([])
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showCertModal, setShowCertModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)

  // Filters & Grouping State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'in_progress', 'completed'
  const [collapsedQuarters, setCollapsedQuarters] = useState({})

  const toggleQuarter = (quarter) => {
    setCollapsedQuarters(prev => ({ ...prev, [quarter]: !prev[quarter] }))
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [gRes, cRes] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/learning/goals', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/learning/certificates', { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (gRes.ok) setGoals(await gRes.json())
      if (cRes.ok) setCerts(await cRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
    const handleUpdate = () => fetchData();
    window.addEventListener('app-update', handleUpdate);
    return () => window.removeEventListener('app-update', handleUpdate);
  }, [fetchData])

  const [gForm, setGForm] = useState({ title: '', description: '', category: 'performance', quarter: '', progress_percentage: 0 })

  // Cert Form State
  const [cForm, setCForm] = useState({ training_name: '', provider: '', category: 'technical', certificate_url: '', completion_date: '', duration_hours: '' })

  const handleSaveGoal = async (e) => {
    e.preventDefault()
    try {
      const url = gForm.id ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/learning/goals/${gForm.id}` : (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/learning/goals'
      const method = gForm.id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(gForm)
      })
      if (res.ok) {
        setShowGoalModal(false)
        fetchData()
      }
    } catch (e) { console.error(e) }
  }

  const handleCreateCert = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...cForm,
        duration_hours: cForm.duration_hours ? parseFloat(cForm.duration_hours) : null,
        completion_date: cForm.completion_date ? `${cForm.completion_date}T00:00:00Z` : null
      }
      const url = cForm.id ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/learning/certificates/${cForm.id}` : (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/learning/certificates'
      const method = cForm.id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setShowCertModal(false)
        fetchData()
      }
    } catch (e) { console.error(e) }
  }

  const handleDeleteCert = async (id) => {
    if (!window.confirm("Are you sure you want to delete this certificate?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/learning/certificates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchData()
    } catch (e) { console.error(e) }
  }

  const verifyCert = async (id, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/learning/certificates/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ verification_status: status })
      })
      if (res.ok) fetchData()
    } catch (e) { console.error(e) }
  }

  const addFeedback = async (id, text, endorse) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/learning/goals/${id}/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ manager_feedback: text, is_endorsed: endorse })
      })
      if (res.ok) {
        setSelectedGoal(null)
        fetchData()
      }
    } catch (e) { console.error(e) }
  }

  const S = {
    card: { background: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
    tabBtn: (active) => ({
      padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: active ? '#fff' : 'transparent',
      color: active ? '#0f172a' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s'
    }),
    badge: (type) => {
      const styles = {
        pending: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
        approved: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
        rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
      }
      const s = styles[type] || styles.pending
      return { background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }
    }
  }

  const filteredGoals = goals.filter(g => {
    const searchMatch = (g.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter === 'all' ? true :
      statusFilter === 'completed' ? (g.status === 'completed' || g.progress_percentage === 100) :
        (g.status !== 'completed' && g.progress_percentage < 100);
    return searchMatch && statusMatch;
  });

  const groupedGoals = filteredGoals.reduce((acc, goal) => {
    const q = goal.quarter || 'Unassigned';
    if (!acc[q]) acc[q] = [];
    acc[q].push(goal);
    return acc;
  }, {});

  const sortedQuarters = Object.keys(groupedGoals).sort((a, b) => b.localeCompare(a));

  return (
    <div className="es-section-content" style={{ animation: 'fadeIn 0.4s ease', paddingTop: '20px' }}>
      <style>{`
        .growth-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px -4px rgba(0,0,0,0.03), 0 0 4px rgba(0,0,0,0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .growth-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .growth-card:hover {
          transform: translateY(-4px) scale(1.005);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08), 0 0 10px rgba(0,0,0,0.03);
          border-color: rgba(99, 102, 241, 0.2);
        }
        .growth-card:hover::before {
          opacity: 1;
        }
        
        .growth-progress-track {
          height: 12px;
          background: #f1f5f9;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
          position: relative;
        }
        .growth-progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        .growth-progress-fill::after {
          content: '';
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2s infinite linear;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .ls-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }
        @media (max-width: 640px) {
          .ls-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .ls-toolbar button {
            width: 100%;
          }
        }

        .growth-feedback {
          background: linear-gradient(145deg, #f8fafc, #f1f5f9);
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          position: relative;
          margin-top: 16px;
        }
        
        .growth-range {
          -webkit-appearance: none;
          width: 100%;
          height: 12px;
          border-radius: 10px;
          background: #f1f5f9;
          outline: none;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        }
        .growth-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15), 0 0 0 4px var(--thumb-color, #6366f1);
          transition: transform 0.2s;
        }
        .growth-range::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>

      {isManager && (!user?.department || user?.department === 'Unassigned') ? (
        <div className="es-panel" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>You are not assigned to a team</h2>
          <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.5' }}>
            Please select or add a team from your profile to start assigning and viewing team development goals.
          </p>
        </div>
      ) : (
        <>
          {/* Hero Header */}
          <div style={{
            backgroundColor: '#0f1117',
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            borderRadius: '16px', padding: '18px 22px',
            marginBottom: '18px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '500', letterSpacing: '0.04em' }}>
                  ⬡ {isManager ? 'Manager Dashboard' : 'Employee Dashboard'} / <span style={{ color: 'rgba(255,255,255,0.6)' }}>Growth Hub</span>
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0', letterSpacing: '-0.02em' }}>
                  {isManager ? 'Learning & Growth' : 'Development'}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0' }}>
                  Track goals, verify skills, and manage professional development {isManager ? 'for your team' : 'journey'}.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{goals.filter(g => g.progress_percentage === 100).length}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Goals Hit</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{certs.filter(c => c.verification_status === 'approved').length}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Verified Skills</div>
                </div>
              </div>
            </div>
          </div>

          {/* Needs Attention (Manager Only) */}
      {isManager && certs.some(c => c.verification_status === 'pending') && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#f59e0b', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚠️</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400e' }}>Action Required</div>
              <div style={{ fontSize: '13px', color: '#b45309' }}>You have {certs.filter(c => c.verification_status === 'pending').length} pending certificate(s) waiting for verification.</div>
            </div>
          </div>
          <button onClick={() => setActiveTab('certs')} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Review Now</button>
        </div>
      )}

      {/* Tabs */}
      <div className="ls-toolbar">
        <div style={{ background: '#f1f5f9', padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button style={S.tabBtn(activeTab === 'goals')} onClick={() => setActiveTab('goals')}>🎯 Goals & Development</button>
          <button style={S.tabBtn(activeTab === 'certs')} onClick={() => setActiveTab('certs')}>📜 Certifications</button>
        </div>

        {!isManager && (
          <button
            onClick={() => {
              if (activeTab === 'goals') {
                setGForm({ title: '', description: '', category: 'performance', quarter: '', progress_percentage: 0 });
                setShowGoalModal(true);
              } else {
                setCForm({ training_name: '', provider: '', category: 'technical', certificate_url: '', completion_date: '', duration_hours: '' });
                setShowCertModal(true);
              }
            }}
            className="es-btn-primary"
            style={{ borderRadius: '20px', padding: '10px 24px', whiteSpace: 'nowrap' }}
          >
            + Add New {activeTab === 'goals' ? 'Career Goal' : 'Certificate'}
          </button>
        )}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading Growth Hub data...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── GOALS TAB ────────────────────────────────────────────── */}
          {activeTab === 'goals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: '16px', background: '#fff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '250px', background: '#f8fafc', padding: '10px 16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <svg width="18" height="18" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" /></svg>
                  <input type="text" placeholder="Search goals..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#0f172a' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setStatusFilter('all')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: statusFilter === 'all' ? '#0f172a' : '#f1f5f9', color: statusFilter === 'all' ? '#fff' : '#475569', transition: 'all 0.2s' }}>All</button>
                  <button onClick={() => setStatusFilter('in_progress')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: statusFilter === 'in_progress' ? '#3b82f6' : '#f1f5f9', color: statusFilter === 'in_progress' ? '#fff' : '#475569', transition: 'all 0.2s' }}>In Progress</button>
                  <button onClick={() => setStatusFilter('completed')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: statusFilter === 'completed' ? '#10b981' : '#f1f5f9', color: statusFilter === 'completed' ? '#fff' : '#475569', transition: 'all 0.2s' }}>Completed</button>
                </div>
              </div>

              {goals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>No goals found.</div>
              ) : sortedQuarters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>No goals match your filters.</div>
              ) : (
                sortedQuarters.map(quarter => (
                  <div key={quarter} style={{ background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div onClick={() => toggleQuarter(quarter)} style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none', background: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{quarter}</h2>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{groupedGoals[quarter].length} Goals</span>
                      </div>
                      <svg width="20" height="20" fill="none" stroke="#64748b" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: collapsedQuarters[quarter] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>

                    {!collapsedQuarters[quarter] && (
                      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '20px', borderTop: '1px solid #e2e8f0' }}>
                        {groupedGoals[quarter].map(goal => (
                          <div key={goal.id} className="growth-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                              <div style={{ flex: 1, paddingRight: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>{goal.title}</h3>
                                  {goal.is_endorsed && <span style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#d97706', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, border: '1px solid #fcd34d', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)' }}>⭐ Approved</span>}
                                  <span style={{ background: CATEGORIES[goal.category]?.bg, color: CATEGORIES[goal.category]?.color, padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, border: `1px solid ${CATEGORIES[goal.category]?.color}33`, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{CATEGORIES[goal.category]?.label}</span>
                                </div>
                                <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.5 }}>{goal.description}</p>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                                {isManager && goal.employee_name && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: '1px solid #c7d2fe' }}>
                                    👤 {goal.employee_name}
                                  </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 10px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '11px', fontWeight: 600 }}>
                                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  {goal.quarter}
                                </div>
                                {!isManager && (
                                  <button onClick={() => {
                                    setGForm({ id: goal.id, title: goal.title, description: goal.description, category: goal.category, quarter: goal.quarter, progress_percentage: goal.progress_percentage || 0 })
                                    setShowGoalModal(true)
                                  }} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#6366f1', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '4px 0', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.8}>
                                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    Edit
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(248, 250, 252, 0.6)', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', fontWeight: 700 }}>
                                <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <svg width="14" height="14" fill="none" stroke={goal.progress_percentage === 100 ? '#10b981' : '#6366f1'} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                  Progress Tracking
                                </span>
                                <span style={{ color: goal.progress_percentage === 100 ? '#10b981' : '#6366f1', background: goal.progress_percentage === 100 ? '#ecfdf5' : '#e0e7ff', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{goal.progress_percentage}%</span>
                              </div>
                              <div className="growth-progress-track" style={{ height: '10px' }}>
                                <div className="growth-progress-fill" style={{ width: `${goal.progress_percentage}%`, background: goal.progress_percentage === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
                              </div>
                            </div>

                            {/* Feedback Section */}
                            <div className="growth-feedback">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ background: '#e0e7ff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manager Feedback</span>
                              </div>

                              {goal.manager_feedback ? (
                                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                  <p style={{ fontSize: '13px', color: '#1e293b', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>"{goal.manager_feedback}"</p>
                                </div>
                              ) : (
                                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 0 32px', fontStyle: 'italic' }}>Waiting for manager review...</p>
                              )}

                              {isManager && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                  {goal.progress_percentage === 100 && !goal.is_endorsed && (
                                    <button onClick={() => addFeedback(goal.id, goal.manager_feedback || 'Goal successfully completed and approved.', true)} style={{ background: '#10b981', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)' }}>
                                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                                      Approve
                                    </button>
                                  )}
                                  <button onClick={() => setSelectedGoal(goal)} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; }}>
                                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    {goal.manager_feedback ? 'Update' : 'Write'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── CERTIFICATES TAB ────────────────────────────────────────────── */}
          {activeTab === 'certs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
              {certs.length === 0 ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>No certificates found.</div> :
                certs.map(cert => (
                  <div key={cert.id} style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: '20px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.08)' }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)' }}>

                    {/* Subtle watermark icon */}
                    <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '140px', opacity: 0.04, transform: 'rotate(15deg)', pointerEvents: 'none' }}>
                      {CERT_CATEGORIES[cert.category]?.icon}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                          {CERT_CATEGORIES[cert.category]?.icon}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{cert.training_name}</h3>
                          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🏢 {cert.provider}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isManager && cert.employee_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#e0e7ff', color: '#4338ca', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, width: 'fit-content', marginBottom: '20px', border: '1px solid #c7d2fe', position: 'relative', zIndex: 1 }}>
                        👤 {cert.employee_name}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                      <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Status</div>
                        <span style={S.badge(cert.verification_status)}>
                          {cert.verification_status.toUpperCase()}
                        </span>
                      </div>
                      {cert.completion_date && (
                        <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Certified On</div>
                          <div style={{ fontSize: '14px', color: '#334155', fontWeight: 700 }}>{new Date(cert.completion_date).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                      {cert.certificate_url ? (
                        <a href={cert.certificate_url} target="_blank" rel="noreferrer" style={{ fontSize: '14px', fontWeight: 600, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#eef2ff', borderRadius: '8px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#e0e7ff'} onMouseOut={e => e.currentTarget.style.background = '#eef2ff'}>
                          🔗 View Credential
                        </a>
                      ) : <div />}

                      {isManager && cert.verification_status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => verifyCert(cert.id, 'approved')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}>Approve</button>
                          <button onClick={() => verifyCert(cert.id, 'rejected')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}>Reject</button>
                        </div>
                      )}

                      {!isManager && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => {
                            setCForm({
                              id: cert.id,
                              training_name: cert.training_name,
                              provider: cert.provider || '',
                              category: cert.category,
                              certificate_url: cert.certificate_url || '',
                              completion_date: cert.completion_date ? cert.completion_date.split('T')[0] : '',
                              duration_hours: cert.duration_hours || ''
                            })
                            setShowCertModal(true)
                          }} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#6366f1', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '4px 0', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.8}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteCert(cert.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '4px 0', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.8}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

        </div>
      )}

      {/* Modals */}
      {showGoalModal && (
        <Modal title={gForm.id ? "Edit Career Goal" : "Create New Career Goal"} onClose={() => setShowGoalModal(false)}>
          <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="es-label">Goal Title</label>
              <input required type="text" className="es-input" value={gForm.title} onChange={e => setGForm({ ...gForm, title: e.target.value })} placeholder="e.g. Master React Hooks" />
            </div>
            <div>
              <label className="es-label">Description</label>
              <textarea required className="es-input" value={gForm.description} onChange={e => setGForm({ ...gForm, description: e.target.value })} placeholder="Detailed plan..." style={{ minHeight: '80px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label className="es-label">Category</label>
                <select className="es-input" value={gForm.category} onChange={e => setGForm({ ...gForm, category: e.target.value })}>
                  {Object.entries(CATEGORIES).map(([key, data]) => (
                    <option key={key} value={key}>{data.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="es-label">Target Quarter (Optional)</label>
                <input type="text" className="es-input" value={gForm.quarter} onChange={e => setGForm({ ...gForm, quarter: e.target.value })} placeholder="e.g. Q3 2024" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="es-label" style={{ marginBottom: 0 }}>Progress</label>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6366f1', background: '#e0e7ff', padding: '2px 8px', borderRadius: '12px' }}>{gForm.progress_percentage || 0}%</span>
                </div>
                <input required type="range" min="0" max="100" value={gForm.progress_percentage !== undefined ? gForm.progress_percentage : 0} onChange={e => setGForm({ ...gForm, progress_percentage: parseInt(e.target.value) || 0 })} style={{ width: '100%', cursor: 'pointer', accentColor: '#6366f1', height: '6px', marginTop: '6px' }} />
              </div>
            </div>
            <button type="submit" className="es-btn-primary" style={{ marginTop: '10px' }}>{gForm.id ? "Save Changes" : "Create Career Goal"}</button>
          </form>
        </Modal>
      )}

      {showCertModal && (
        <Modal title="Upload Certificate" onClose={() => setShowCertModal(false)}>
          <form onSubmit={handleCreateCert} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="es-label">Certificate Name</label>
              <input required type="text" className="es-input" value={cForm.training_name} onChange={e => setCForm({ ...cForm, training_name: e.target.value })} placeholder="e.g. AWS Solutions Architect" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="es-label">Provider/Issuer</label>
                <input required type="text" className="es-input" value={cForm.provider} onChange={e => setCForm({ ...cForm, provider: e.target.value })} placeholder="e.g. Amazon Web Services" />
              </div>
              <div>
                <label className="es-label">Category</label>
                <select className="es-input" value={cForm.category} onChange={e => setCForm({ ...cForm, category: e.target.value })}>
                  {Object.entries(CERT_CATEGORIES).map(([key, data]) => (
                    <option key={key} value={key}>{data.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="es-label">Credential URL (Optional)</label>
              <input type="url" className="es-input" value={cForm.certificate_url} onChange={e => setCForm({ ...cForm, certificate_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="es-label">Completion/Certified Date</label>
              <input type="date" className="es-input" value={cForm.completion_date} onChange={e => setCForm({ ...cForm, completion_date: e.target.value })} />
            </div>
            <div>
              <label className="es-label">Duration (Hours) (Optional)</label>
              <input type="number" min="0" step="0.5" className="es-input" value={cForm.duration_hours} onChange={e => setCForm({ ...cForm, duration_hours: e.target.value })} placeholder="e.g. 24" />
            </div>
            <button type="submit" className="es-btn-primary" style={{ marginTop: '10px' }}>Submit for Verification</button>
          </form>
        </Modal>
      )}

      {selectedGoal && isManager && (
        <Modal title="Goal Feedback" subtitle={`Providing feedback for: ${selectedGoal.title}`} onClose={() => setSelectedGoal(null)}>
          <form onSubmit={(e) => { e.preventDefault(); addFeedback(selectedGoal.id, e.target.feedback.value, selectedGoal.is_endorsed); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="es-label">Feedback</label>
              <textarea name="feedback" required className="es-input" defaultValue={selectedGoal.manager_feedback || ''} placeholder="Great progress on this..." style={{ minHeight: '100px' }} />
            </div>
            <button type="submit" className="es-btn-primary" style={{ marginTop: '10px' }}>Save Feedback</button>
          </form>
        </Modal>
      )}
        </>
      )}
    </div>
  )
}
