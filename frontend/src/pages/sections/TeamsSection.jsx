import { useState, useEffect } from 'react'

import { useAuth } from '../../context/AuthContext'
import './EnterpriseSection.css'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#0ea5e9','#10b981','#f59e0b','#ef4444','#14b8a6']
function Avatar({ name, size = 36, index = 0, imageUrl }) {
  const [imgError, setImgError] = useState(false)
  if (imageUrl && !imgError) {
    return <img src={imageUrl} alt={name} className="es-avatar" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--es-border)' }} onError={() => setImgError(true)} />
  }
  const bg = COLORS[index % COLORS.length]
  return (
    <div className="es-avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  )
}

function RoleBadge({ role }) {
  const map = { manager: 'role-manager', employee: 'role-employee', admin: 'role-admin' }
  return <span className={`es-role-badge ${map[role] || 'role-employee'}`}>{role}</span>
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
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="es-modal-body">{children}</div>
      </div>
    </div>
  )
}

export default function TeamsSection({ user }) {
  const { token } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal State
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberSkills, setMemberSkills] = useState([])
  const [memberStats, setMemberStats] = useState({ rating: 0, reviews: 0, trainingHours: 0, activeGoals: 0 })
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [showAllSkills, setShowAllSkills] = useState(false)

  useEffect(() => {
    if (!user?.department || user.department === 'Unassigned') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }

    const fetchMembers = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (!res.ok) throw new Error('Failed to fetch team members')
        const data = await res.json()
        
        // Filter by the current user's department
        const departmentMembers = data.filter(m => m.department === user.department)
        setMembers(departmentMembers.sort((a, b) => {
          // Manager first
          if (a.role === 'manager' && b.role !== 'manager') return -1
          if (a.role !== 'manager' && b.role === 'manager') return 1
          // Then alphabetically
          return a.name.localeCompare(b.name)
        }))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
    const handleUpdate = () => fetchMembers();
    window.addEventListener('app-update', handleUpdate);
    return () => window.removeEventListener('app-update', handleUpdate);
  }, [user, token])

  const handleCardClick = async (member) => {
    setSelectedMember(member)
    setMemberSkills([])
    setMemberStats({ rating: 0, reviews: 0, trainingHours: 0, activeGoals: 0 })
    setSkillsLoading(true)
    setShowAllSkills(false)
    try {
      const [compRes, reviewRes, trainRes, goalRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/competencies/employee/${member.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/reviews/employee/${member.id}/average`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/training-records/employee/${member.id}/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/goals/employee/${member.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (compRes.ok) {
        const data = await compRes.json()
        setMemberSkills(data)
      }

      let rating = 0, reviews = 0, trainingHours = 0, activeGoals = 0
      if (reviewRes.ok) {
        const rData = await reviewRes.json()
        rating = rData.average_rating || 0
        reviews = rData.total_reviews || 0
      }
      if (trainRes.ok) {
        const tData = await trainRes.json()
        trainingHours = tData.total_hours || 0
      }
      if (goalRes.ok) {
        const gData = await goalRes.json()
        activeGoals = gData.filter(g => g.status === 'approved' || g.status === 'submitted').length
      }
      setMemberStats({ rating, reviews, trainingHours, activeGoals })

    } catch (err) {
      console.error(err)
    } finally {
      setSkillsLoading(false)
    }
  }

  if (!user?.department || user.department === 'Unassigned') {
    return (
      <div className="es-root">
        <div className="es-command-bar">
          <div className="es-cmd-left">
            <div className="es-breadcrumb">EMPLOYEE <span>/</span> MY TEAM</div>
            <h1 className="es-page-title">My Team</h1>
            <p className="es-page-sub">You are not assigned to a team yet.</p>
          </div>
        </div>
        <div className="es-empty-full" style={{ marginTop: '24px' }}>
          <div className="es-empty-icon">👥</div>
          <p>No team assigned</p>
          <span>Contact your manager to be added to a department.</span>
        </div>
      </div>
    )
  }

  const manager = members.find(m => m.role === 'manager')

  return (
    <div className="es-root">
      <div className="es-command-bar">
        <div className="es-cmd-left">
          <div className="es-breadcrumb">EMPLOYEE <span>/</span> MY TEAM</div>
          <h1 className="es-page-title">{user.department} Team</h1>
          <p className="es-page-sub">Connect with your colleagues and team leadership</p>
        </div>
      </div>

      <div className="es-stat-strip">
        <div className="es-stat-item">
          <span className="es-stat-num">{members.length}</span>
          <span className="es-stat-lbl">Total Members</span>
        </div>
        <div className="es-stat-divider" />
        <div className="es-stat-item">
          <span className="es-stat-num">{manager ? 1 : 0}</span>
          <span className="es-stat-lbl">Manager</span>
        </div>
        <div className="es-stat-divider" />
        <div className="es-stat-item">
          <span className="es-stat-num">{members.filter(m => m.role === 'employee').length}</span>
          <span className="es-stat-lbl">Teammates</span>
        </div>
      </div>

      {error && (
        <div className="es-error-banner">
          <span className="alert-icon">!</span>
          {error}
        </div>
      )}

      <div className="es-cards-grid" style={{ marginTop: '24px' }}>
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="es-member-card es-card-skeleton" />)
        ) : (
          members.map((m, i) => (
            <div key={m.id} className="es-member-card" style={{ ...(m.id === user.id ? { border: '2px solid var(--es-indigo)' } : {}), cursor: 'pointer' }} onClick={() => handleCardClick(m)}>
              <div className="es-card-top">
                <Avatar name={m.name} size={48} index={i} imageUrl={m.profile_pic_url} />
                {m.id === user.id && (
                  <span className="es-role-badge role-manager" style={{ backgroundColor: 'var(--es-indigo)', color: '#fff' }}>You</span>
                )}
              </div>
              <div className="es-card-name">{m.name}</div>
              <div className="es-card-jobtitle">
                {m.job_title || m.role.charAt(0).toUpperCase() + m.role.slice(1)}
              </div>
              <div className="es-card-email">{m.email}</div>
              <div className="es-card-meta">
                <RoleBadge role={m.role} />
                <span className="es-dept-tag">{m.department}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedMember && (
        <Modal title={selectedMember.name} subtitle={selectedMember.job_title || selectedMember.role.charAt(0).toUpperCase() + selectedMember.role.slice(1)} onClose={() => setSelectedMember(null)}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '28px', background: 'linear-gradient(145deg, #f8fafc, #ffffff)', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
            <div style={{ position: 'relative' }}>
              <Avatar name={selectedMember.name} size={76} index={members.findIndex(m => m.id === selectedMember.id)} imageUrl={selectedMember.profile_pic_url} />
              <div style={{ position: 'absolute', bottom: '0', right: '0', width: '20px', height: '20px', background: '#10b981', border: '3px solid #fff', borderRadius: '50%' }}></div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><span style={{background: '#f1f5f9', padding: '5px', borderRadius: '50%', display: 'flex', color: '#64748b'}}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></span> {selectedMember.email}</div>
              <div style={{ fontSize: '14px', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><span style={{background: '#f1f5f9', padding: '5px', borderRadius: '50%', display: 'flex', color: '#64748b'}}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></span> {selectedMember.department}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <RoleBadge role={selectedMember.role} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
            <div style={{ background: 'linear-gradient(145deg, #ffffff, #f8fafc)', padding: '16px 12px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#6366f1' }}>{memberStats.rating > 0 ? memberStats.rating.toFixed(1) : '-'}</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.5px' }}>Avg Rating</div>
            </div>
            <div style={{ background: 'linear-gradient(145deg, #ffffff, #f8fafc)', padding: '16px 12px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{memberStats.reviews}</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.5px' }}>Reviews</div>
            </div>
            <div style={{ background: 'linear-gradient(145deg, #ffffff, #f8fafc)', padding: '16px 12px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>{memberStats.trainingHours}<span style={{fontSize: '14px', color: '#fbbf24', marginLeft: '2px'}}>h</span></div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.5px' }}>Training</div>
            </div>
            <div style={{ background: 'linear-gradient(145deg, #ffffff, #f8fafc)', padding: '16px 12px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#ec4899' }}>{memberStats.activeGoals}</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.5px' }}>Active Goals</div>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Skills & Competencies
          </h3>
          
          {skillsLoading ? (
            <div className="es-skeleton" style={{ height: '40px', width: '100%', borderRadius: '12px' }} />
          ) : memberSkills.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>No skills or competencies recorded yet.</div>
          ) : (
            <>
              <div className="es-skills-scroll" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', maxHeight: showAllSkills ? '280px' : 'none', overflowY: showAllSkills ? 'auto' : 'visible', paddingRight: '8px', paddingBottom: '4px' }}>
                {(showAllSkills ? memberSkills : memberSkills.slice(0, 10)).map(skill => (
                  <div key={skill.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(145deg, #ffffff, #f8fafc)', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', padding: '8px 14px', borderRadius: '20px', fontSize: '14px', color: '#334155' }}>
                    <strong style={{fontWeight: '600'}}>{skill.competency?.name || 'Skill'}</strong>
                    <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>{skill.skill_level}</span>
                  </div>
                ))}
              </div>
              {memberSkills.length > 10 && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button 
                    onClick={() => setShowAllSkills(!showAllSkills)}
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '20px', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '6px 16px', transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1e293b' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
                  >
                    {showAllSkills ? 'Show less' : `Show ${memberSkills.length - 10} more skills`}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="es-modal-footer" style={{ marginTop: '36px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
            <button className="es-btn es-btn-ghost" style={{ borderRadius: '8px', fontWeight: 600, color: '#64748b', padding: '10px 20px' }} onClick={() => setSelectedMember(null)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
