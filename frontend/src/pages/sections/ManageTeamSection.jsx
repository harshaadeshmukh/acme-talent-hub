import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import './EnterpriseSection.css'

// ── Avatar ──────────────────────────────────────────────────────────────────
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#0ea5e9','#10b981','#f59e0b','#ef4444','#14b8a6']
const getSkillValue = (level) => {
  const map = { beginner: 1, intermediate: 2, advanced: 3, expert: 4, master: 5 };
  return map[level?.toLowerCase()] || 1;
};
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

// ── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const map = { manager: 'role-manager', employee: 'role-employee', admin: 'role-admin' }
  return <span className={`es-role-badge ${map[role] || 'role-employee'}`}>{role}</span>
}

// ── Modal Wrapper ────────────────────────────────────────────────────────────
function Modal({ title, subtitle, width, onClose, children }) {
  return (
    <div className="es-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="es-modal" style={width ? { maxWidth: width, width: '100%' } : {}}>
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

// ── Field ────────────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div className="es-field">
      <label className="es-field-label">{label}{required && <span className="es-required">*</span>}</label>
      {children}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ManageTeamSection() {
  const { user } = useAuth()
  const [members, setMembers]           = useState([])
  const [unassigned, setUnassigned]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [successMsg, setSuccessMsg]     = useState(null)
  const [warningMsg, setWarningMsg]     = useState(null)
  const [search, setSearch]             = useState('')
  const [viewMode, setViewMode]         = useState('table') // 'table' | 'cards'
  const [addOpen, setAddOpen]           = useState(false)
  const [unassignedOpen, setUnassignedOpen] = useState(false)
  const [unassignedSearch, setUnassignedSearch] = useState('')
  const [selectedUnassigned, setSelectedUnassigned] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberDetails, setMemberDetails] = useState(null)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [newMember, setNewMember]       = useState({ name: '', email: '', department: '', job_title: '', role: 'employee' })
  const [submitting, setSubmitting]     = useState(false)
  const [filterRole, setFilterRole]     = useState('All')
  const [dbDepartments, setDbDepartments] = useState([])
  const [addDeptOpen, setAddDeptOpen] = useState(false)
  const [newDeptInput, setNewDeptInput] = useState('')

  const headers = () => ({
    'Authorization': `Bearer ${localStorage.getItem('acme_token')}`,
    'Content-Type': 'application/json'
  })

  const fetchMembers = useCallback(async (query = '') => {
    setLoading(true)
    setError(null)
    try {
      const url = query
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users?search=${encodeURIComponent(query)}`
        : (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users'
      const res = await fetch(url, { headers: headers() })
      if (!res.ok) throw new Error('Failed to fetch team members')
      const data = await res.json()
      const uPool = data.filter(u => u.role === 'employee' && (!u.department || u.department === 'Unassigned'))
      setUnassigned(uPool)

      const myTeam = data.filter(u => {
        if (!user?.department) return true;
        return u.department === user?.department;
      });

      setMembers(myTeam.sort((a, b) => {
        const aU = !a.department || a.department === 'Unassigned'
        const bU = !b.department || b.department === 'Unassigned'
        if (aU && !bU) return -1
        if (!aU && bU) return 1
        if (a.role === 'manager' && b.role !== 'manager') return -1
        if (a.role !== 'manager' && b.role === 'manager') return 1
        return a.name.localeCompare(b.name)
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const doFetch = () => fetchMembers(search)
    const t = setTimeout(doFetch, 300)
    const handleUpdate = () => doFetch();
    window.addEventListener('app-update', handleUpdate);
    return () => { clearTimeout(t); window.removeEventListener('app-update', handleUpdate) }
  }, [search, fetchMembers])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/departments/list`, { headers: headers() })
      .then(res => res.json())
      .then(data => setDbDepartments(data))
      .catch(err => console.error('Failed to fetch departments:', err))
  }, [])

  useEffect(() => {
    const target = selectedMember || selectedUnassigned
    if (target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMemberDetails(null)
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${target.id}/details`, { headers: headers() })
        .then(res => res.json())
        .then(data => setMemberDetails(data))
        .catch(err => console.error(err))
    }
  }, [selectedMember, selectedUnassigned])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setWarningMsg(null)
    setSuccessMsg(null)
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ ...newMember, job_title: newMember.job_title || null, password: 'TempPass123!' })
      })
      if (!res.ok) throw new Error('Failed to add member')
      setAddOpen(false)
      setNewMember({ name: '', email: '', department: '', job_title: '', role: 'employee' })
      setSuccessMsg("employee added successfully")
      setTimeout(() => setSuccessMsg(null), 3000)
      fetchMembers(search)
    } catch (err) { 
      console.error(err.message) 
      setWarningMsg("Warning: " + err.message)
      setTimeout(() => setWarningMsg(null), 3000)
    }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${editTarget.id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ name: editTarget.name, department: editTarget.department, job_title: editTarget.job_title || null, role: editTarget.role })
      })
      if (!res.ok) throw new Error('Failed to update member')
      setEditTarget(null)
      fetchMembers(search)
    } catch (err) { console.error(err.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${deleteTarget.id}`, {
        method: 'PATCH', 
        headers: headers(),
        body: JSON.stringify({ department: 'Unassigned' })
      })
      if (!res.ok) throw new Error('Failed to unassign member')
      setDeleteTarget(null)
      fetchMembers(search)
    } catch (err) { console.error(err.message) }
  }

  const handleAssignToTeam = async (employeeId) => {
    setWarningMsg(null)
    setSuccessMsg(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${employeeId}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ department: user?.department || 'General' })
      })
      if (!res.ok) throw new Error('Failed to assign member')
      setSuccessMsg("employee added successfully")
      setTimeout(() => setSuccessMsg(null), 3000)
      fetchMembers(search)
    } catch (err) { 
      console.error(err.message) 
      setWarningMsg("Warning: " + err.message)
      setTimeout(() => setWarningMsg(null), 3000)
    }
  }

  const filteredUnassigned = unassigned.filter(u => 
    u.name.toLowerCase().includes(unassignedSearch.toLowerCase()) || 
    (u.job_title || '').toLowerCase().includes(unassignedSearch.toLowerCase())
  )

  const filtered = members.filter(m =>
    (filterRole === 'All' || m.role === filterRole.toLowerCase())
  )

  const roles = ['All', 'Employee', 'Manager']
  const deptSet = [...new Set(members.map(m => m.department).filter(Boolean))]

  return (
    <div className="es-root">
      {/* Command Bar */}
      <div className="es-command-bar">
        <div className="es-cmd-left">
          <div className="es-breadcrumb">⬡ Manager Dashboard / <span>Manage Team</span></div>
          <h1 className="es-page-title">{user?.department || 'My Team'}</h1>
          <p className="es-page-sub">Manage headcount, roles, and department assignments</p>
        </div>
        <div className="es-cmd-right" style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="es-btn" 
            style={{ 
              background: unassigned.length > 0 ? '#fef3c7' : '#f8fafc', 
              color: unassigned.length > 0 ? '#b45309' : '#94a3b8', 
              border: `1px solid ${unassigned.length > 0 ? '#fcd34d' : '#e2e8f0'}`,
              opacity: unassigned.length === 0 ? 0.7 : 1,
              pointerEvents: unassigned.length === 0 ? 'none' : 'auto'
            }} 
            onClick={() => setUnassignedOpen(true)}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Unassigned Pool ({unassigned.length})
          </button>
          <button className="es-btn es-btn-ghost" onClick={() => setAddDeptOpen(true)}>
            <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>+</span> Add Department
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="es-stat-strip">
        <div className="es-stat-item">
          <span className="es-stat-num">{members.length}</span>
          <span className="es-stat-lbl">Total Members</span>
        </div>
        <div className="es-stat-divider" />
        <div className="es-stat-item">
          <span className="es-stat-num">{members.filter(m => m.role === 'manager').length}</span>
          <span className="es-stat-lbl">Managers</span>
        </div>
        <div className="es-stat-divider" />
        <div className="es-stat-item">
          <span className="es-stat-num">{members.filter(m => m.role === 'employee').length}</span>
          <span className="es-stat-lbl">Employees</span>
        </div>
        <div className="es-stat-divider" />
        <div className="es-stat-item">
          <span className="es-stat-num">{deptSet.length}</span>
          <span className="es-stat-lbl">Departments</span>
        </div>
        <div className="es-stat-divider" />
        <div className="es-stat-item">
          <span className="es-stat-num" style={{ color: '#10b981' }}>{members.filter(m => m.department && m.department !== 'Unassigned').length}</span>
          <span className="es-stat-lbl">Assigned</span>
        </div>
        <div className="es-stat-spacer" />
        {/* View toggle */}
        <div className="es-view-toggle">
          <button className={`es-vt-btn ${viewMode === 'table' ? 'es-vt-active' : ''}`} onClick={() => setViewMode('table')} title="Table view">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
          </button>
          <button className={`es-vt-btn ${viewMode === 'cards' ? 'es-vt-active' : ''}`} onClick={() => setViewMode('cards')} title="Card view">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="es-toolbar">
        <div className="es-search-wrap">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            className="es-search"
            placeholder="Search name, email or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="es-search-clear" onClick={() => setSearch('')}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        <div className="es-filter-pills">
          {roles.map(r => (
            <button key={r} className={`es-pill ${filterRole === r ? 'es-pill-active' : ''}`} onClick={() => setFilterRole(r)}>
              {r}
              {r !== 'All' && <span className="es-pill-count">{members.filter(m => m.role === r.toLowerCase()).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="es-error-banner" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
          {successMsg}
        </div>
      )}
      {warningMsg && (
        <div className="es-error-banner" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          {warningMsg}
        </div>
      )}

      {error && (
        <div className="es-error-banner">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          {error}
          <button onClick={() => fetchMembers(search)}>Retry</button>
        </div>
      )}

      {(!user?.department || user?.department === 'Unassigned') ? (
        <div className="es-panel" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>You are not assigned to a team</h2>
          <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.5' }}>
            Please select or add a team from your profile to start managing employees and viewing their performance collections.
          </p>
        </div>
      ) : (
        <>
          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="es-panel">
              <div className="es-table-wrap">
                <table className="es-table">
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>#</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          {[...Array(7)].map((_, j) => (
                            <td key={j}><span className="es-skeleton" style={{ width: j === 0 ? 24 : j === 1 ? 140 : j === 6 ? 80 : 90, height: 14 }} /></td>
                          ))}
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="es-empty">
                            <div className="es-empty-icon">👥</div>
                            <p>{search ? `No results for "${search}"` : 'No team members found'}</p>
                            <span>{search ? 'Try a different search term.' : 'Members will appear here once assigned to your department.'}</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((m, i) => (
                        <tr key={m.id} onClick={() => setSelectedMember(m)} style={{ cursor: 'pointer' }} className="es-table-row-hover">
                          <td><span className="es-row-num">{i + 1}</span></td>
                          <td>
                            <div className="es-emp-cell">
                              <Avatar name={m.name} index={i} imageUrl={m.profile_pic_url} />
                              <div>
                                <div className="es-emp-name">{m.name}</div>
                                <div className="es-emp-jobtitle">
                                  {m.job_title || m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {m.department && m.department !== 'Unassigned'
                              ? <span className="es-dept-tag">{m.department}</span>
                              : <span className="es-unassigned">Unassigned</span>
                            }
                          </td>
                          <td><RoleBadge role={m.role} /></td>
                          <td><span className="es-email">{m.email}</span></td>
                          <td><span className="es-status-active">● Active</span></td>
                          <td>
                            {m.id !== user?.id && (
                              <div className="es-row-actions" onClick={e => e.stopPropagation()}>
                                <button className="es-action-btn es-edit-btn" onClick={() => setEditTarget({ ...m })} title="Edit">
                                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                  Edit
                                </button>
                                <button className="es-action-btn es-delete-btn" onClick={() => setDeleteTarget(m)} title="Remove">
                                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                                  Remove
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {!loading && filtered.length > 0 && (
                <div className="es-table-footer">
                  Showing <strong>{filtered.length}</strong> of <strong>{members.length}</strong> members
                </div>
              )}
            </div>
          )}

          {/* CARD VIEW */}
          {viewMode === 'cards' && (
            <div className="es-cards-grid">
              {loading ? (
                [...Array(6)].map((_, i) => <div key={i} className="es-member-card es-card-skeleton" />)
              ) : filtered.length === 0 ? (
                <div className="es-empty-full">
                  <div className="es-empty-icon">👥</div>
                  <p>{search ? `No results for "${search}"` : 'No team members found'}</p>
                </div>
              ) : (
                filtered.map((m, i) => (
                  <div key={m.id} className="es-member-card" onClick={() => setSelectedMember(m)} style={{ cursor: 'pointer' }}>
                    <div className="es-card-top">
                      <Avatar name={m.name} size={48} index={i} imageUrl={m.profile_pic_url} />
                      <div className="es-card-actions" onClick={e => e.stopPropagation()}>
                        {m.id !== user?.id && (
                          <>
                            <button className="es-icon-btn" onClick={() => setEditTarget({ ...m })} title="Edit">
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="es-icon-btn es-icon-del" onClick={() => setDeleteTarget(m)} title="Remove">
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="es-card-name">{m.name}</div>
                    <div className="es-card-jobtitle">
                      {m.job_title || m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                    </div>
                    <div className="es-card-email">{m.email}</div>
                    <div className="es-card-meta">
                      <RoleBadge role={m.role} />
                      {m.department && m.department !== 'Unassigned'
                        ? <span className="es-dept-tag">{m.department}</span>
                        : <span className="es-unassigned">No dept</span>
                      }
                    </div>
                    <div className="es-card-status">
                      <span className="es-status-active">● Active</span>
                      <span className="es-card-id">ID #{m.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ── Add Department Modal ── */}
      {addDeptOpen && (
        <Modal title="Create New Department" subtitle="Add a new department to the database" onClose={() => setAddDeptOpen(false)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const name = newDeptInput.trim();
            if (name) {
              fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users/departments', {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({ name })
              }).then(() => {
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/departments/list`, { headers: headers() })
                  .then(res => res.json())
                  .then(data => setDbDepartments(data))
              });
            }
            setAddDeptOpen(false);
            setNewDeptInput('');
          }}>
            <div className="es-form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <Field label="Department Name" required>
                <input className="es-input" autoFocus required placeholder="e.g. Sales, Marketing" value={newDeptInput} onChange={e => setNewDeptInput(e.target.value)} />
              </Field>
            </div>
            <div className="es-modal-footer" style={{ marginTop: '24px' }}>
              <button type="button" className="es-btn es-btn-ghost" onClick={() => setAddDeptOpen(false)}>Cancel</button>
              <button type="submit" className="es-btn es-btn-primary">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Add Member Modal ── */}
      {addOpen && (
        <Modal title="Add Team Member" subtitle="New account with temporary password" onClose={() => setAddOpen(false)}>
          <form onSubmit={handleAdd}>
            <div className="es-form-grid">
              <Field label="Full Name" required>
                <input className="es-input" required placeholder="Jane Smith" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} />
              </Field>
              <Field label="Email Address" required>
                <input className="es-input" type="email" required placeholder="jane@company.com" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} />
              </Field>
              <Field label="Job Title">
                <input className="es-input" placeholder="e.g. Software Engineer, Junior Developer…" value={newMember.job_title} onChange={e => setNewMember({ ...newMember, job_title: e.target.value })} />
              </Field>
              <Field label="Department">
                <select 
                  className="es-input es-select" 
                  value={newMember.department || ''} 
                  onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                >
                  <option value="" disabled>-- Select Department --</option>
                  {dbDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  {newMember.department && !dbDepartments.includes(newMember.department) && (
                     <option value={newMember.department}>{newMember.department}</option>
                  )}
                </select>
              </Field>
              <Field label="Account Type">
                <select className="es-input es-select" value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </Field>
            </div>
            <div className="es-info-note">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              Temporary password: <code>TempPass123!</code>
            </div>
            <div className="es-modal-footer">
              <button type="button" className="es-btn es-btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
              <button type="submit" className="es-btn es-btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <Modal title="Edit Team Member" subtitle={`Editing profile for ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit}>
            <div className="es-form-grid">
              <Field label="Full Name" required>
                <input className="es-input" required value={editTarget.name} onChange={e => setEditTarget({ ...editTarget, name: e.target.value })} />
              </Field>
              <Field label="Job Title">
                <input className="es-input" placeholder="e.g. Software Engineer, Senior Developer…" value={editTarget.job_title || ''} onChange={e => setEditTarget({ ...editTarget, job_title: e.target.value })} />
              </Field>
              <Field label="Department">
                <select 
                  className="es-input es-select" 
                  value={editTarget.department || ''} 
                  onChange={(e) => setEditTarget({ ...editTarget, department: e.target.value })}
                >
                  <option value="" disabled>-- Select Department --</option>
                  {dbDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  {editTarget.department && !dbDepartments.includes(editTarget.department) && (
                     <option value={editTarget.department}>{editTarget.department}</option>
                  )}
                </select>
              </Field>
              <Field label="Account Type">
                <select className="es-input es-select" value={editTarget.role} onChange={e => setEditTarget({ ...editTarget, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </Field>
            </div>
            <div className="es-modal-footer">
              <button type="button" className="es-btn es-btn-ghost" onClick={() => setEditTarget(null)}>Cancel</button>
              <button type="submit" className="es-btn es-btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Member Detail Modal ── */}
      {selectedMember && (
        <Modal 
          title={selectedMember.name} 
          subtitle={selectedMember.job_title || (selectedMember.role === 'manager' ? 'Manager' : 'Employee')} 
          width="600px"
          onClose={() => setSelectedMember(null)}
        >
          <div className="es-unassigned-detail">
            {/* Profile Header Box */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', marginBottom: '24px', background: '#fafafa', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={selectedMember.name} size={76} imageUrl={selectedMember.profile_pic_url} />
                <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '16px', height: '16px', background: '#10b981', border: '2px solid white', borderRadius: '50%' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '1 1 200px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '15px', wordBreak: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                  <svg style={{ flexShrink: 0 }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span style={{ minWidth: 0, overflowWrap: 'break-word' }}>{selectedMember.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '15px' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
                  {selectedMember.department || 'Unassigned'}
                </div>
                <div>
                  <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: 600, border: '1px solid #a7f3d0' }}>
                    {selectedMember.role === 'manager' ? 'Manager' : 'Employee'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', marginBottom: '32px' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 8px', textAlign: 'center', background: '#fff' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#6366f1' }}>{memberDetails ? (memberDetails.avg_rating || '-') : '-'}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginTop: '8px', letterSpacing: '0.5px' }}>AVG RATING</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 8px', textAlign: 'center', background: '#fff' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{memberDetails ? memberDetails.reviews_count : '0'}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginTop: '8px', letterSpacing: '0.5px' }}>REVIEWS</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 8px', textAlign: 'center', background: '#fff' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{memberDetails ? memberDetails.training_hours : '0'}<span style={{fontSize:'16px', fontWeight:'600'}}>h</span></div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginTop: '8px', letterSpacing: '0.5px' }}>TRAINING</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 8px', textAlign: 'center', background: '#fff' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#ec4899' }}>{memberDetails ? memberDetails.active_goals : '0'}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginTop: '8px', letterSpacing: '0.5px' }}>ACTIVE GOALS</div>
              </div>
            </div>

            {/* Skills Section */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '17px', color: '#0f172a', margin: '0 0 16px' }}>
                <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                Skills & Competencies
              </h4>
              {!memberDetails ? (
                <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '15px', background: '#f8fafc' }}>
                  Loading skills...
                </div>
              ) : memberDetails.skills.length === 0 ? (
                <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '15px', background: '#f8fafc' }}>
                  No skills or competencies recorded yet.
                </div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', background: '#fff', height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={memberDetails.skills.map(s => ({
                      subject: s.name,
                      level: getSkillValue(s.level),
                      fullMark: 5,
                      originalLevel: s.level
                    }))}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                      <Radar name="Skills" dataKey="level" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.4} />
                      <RechartsTooltip 
                        formatter={(value, name, props) => [props.payload.originalLevel, 'Level']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="es-modal-footer" style={{ borderTop: 'none', padding: 0, justifyContent: 'flex-end', display: 'flex' }}>
              <button type="button" className="es-btn es-btn-ghost" onClick={() => setSelectedMember(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Remove Confirm ── */}
      {deleteTarget && (
        <Modal title="Unassign Team Member?" onClose={() => setDeleteTarget(null)}>
          <div className="es-confirm-body">
            <div className="es-confirm-avatar">
              <Avatar name={deleteTarget.name} size={52} imageUrl={deleteTarget.profile_pic_url} />
            </div>
            <p className="es-confirm-name">{deleteTarget.name}</p>
            <p className="es-confirm-text">
              This will remove them from your department and move them back to the Unassigned Pool. Their account will remain active.
            </p>
          </div>
          <div className="es-modal-footer">
            <button className="es-btn es-btn-ghost" onClick={() => setDeleteTarget(null)}>Keep Member</button>
            <button className="es-btn es-btn-danger" onClick={handleDelete}>Yes, Unassign</button>
          </div>
        </Modal>
      )}
      {/* ── Unassigned Modal ── */}
      {unassignedOpen && (
        <Modal 
          title={selectedUnassigned ? selectedUnassigned.name : "Unassigned Employees"} 
          subtitle={selectedUnassigned ? (selectedUnassigned.job_title || 'Employee') : "Review and assign these employees to your department"} 
          width={selectedUnassigned ? "600px" : undefined}
          onClose={() => { setUnassignedOpen(false); setSelectedUnassigned(null); setUnassignedSearch(''); }}
        >
          {selectedUnassigned ? (
            <div className="es-unassigned-detail">
              {/* Profile Header Box */}
              <div className="es-profile-header">
                <div style={{ position: 'relative' }}>
                  <Avatar name={selectedUnassigned.name} size={76} imageUrl={selectedUnassigned.profile_pic_url} />
                  <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '16px', height: '16px', background: '#10b981', border: '2px solid white', borderRadius: '50%' }}></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '15px' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {selectedUnassigned.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '15px' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
                    {selectedUnassigned.department || 'Unassigned'}
                  </div>
                  <div>
                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: 600, border: '1px solid #a7f3d0' }}>
                      {selectedUnassigned.role === 'manager' ? 'Manager' : 'Employee'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="es-profile-stats">
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 8px', textAlign: 'center', background: '#fff' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#6366f1' }}>{memberDetails ? (memberDetails.avg_rating || '-') : '-'}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginTop: '8px', letterSpacing: '0.5px' }}>AVG RATING</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 8px', textAlign: 'center', background: '#fff' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{memberDetails ? memberDetails.reviews_count : '0'}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginTop: '8px', letterSpacing: '0.5px' }}>REVIEWS</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 8px', textAlign: 'center', background: '#fff' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{memberDetails ? memberDetails.training_hours : '0'}<span style={{fontSize:'16px', fontWeight:'600'}}>h</span></div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginTop: '8px', letterSpacing: '0.5px' }}>TRAINING</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 8px', textAlign: 'center', background: '#fff' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#ec4899' }}>{memberDetails ? memberDetails.active_goals : '0'}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginTop: '8px', letterSpacing: '0.5px' }}>ACTIVE GOALS</div>
                </div>
              </div>

              {/* Skills Section */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '17px', color: '#0f172a', margin: '0 0 16px' }}>
                  <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                  Skills & Competencies
                </h4>
                {!memberDetails ? (
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '15px', background: '#f8fafc' }}>
                    Loading skills...
                  </div>
                ) : memberDetails.skills.length === 0 ? (
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '15px', background: '#f8fafc' }}>
                    No skills or competencies recorded yet.
                  </div>
                ) : (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', background: '#fff', height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={memberDetails.skills.map(s => ({
                        subject: s.name,
                        level: getSkillValue(s.level),
                        fullMark: 5,
                        originalLevel: s.level
                      }))}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                        <Radar name="Skills" dataKey="level" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.4} />
                        <RechartsTooltip 
                          formatter={(value, name, props) => [props.payload.originalLevel, 'Level']}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="es-modal-footer" style={{ borderTop: 'none', padding: 0, justifyContent: 'space-between', display: 'flex' }}>
                <button type="button" className="es-btn es-btn-ghost" onClick={() => setSelectedUnassigned(null)}>← Back to List</button>
                <button type="button" className="es-btn es-btn-primary" onClick={() => { handleAssignToTeam(selectedUnassigned.id); setSelectedUnassigned(null); }}>
                  Add to My Team
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="text" 
                className="es-input" 
                placeholder="Search unassigned employees by name or title..." 
                value={unassignedSearch}
                onChange={e => setUnassignedSearch(e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                {filteredUnassigned.length === 0 ? (
                  <p style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No employees found matching "{unassignedSearch}".</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
                    {filteredUnassigned.map(u => (
                      <div 
                        key={u.id} 
                        onClick={() => setSelectedUnassigned(u)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.1)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar name={u.name} size={40} imageUrl={u.profile_pic_url} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{u.email} • {u.job_title || 'Employee'}</div>
                          </div>
                        </div>
                        <button 
                          type="button"
                          className="es-btn es-btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '13px' }} 
                          onClick={(e) => { e.stopPropagation(); handleAssignToTeam(u.id); }}
                        >
                          Add to My Team
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="es-modal-footer" style={{ marginTop: '8px', padding: 0, borderTop: 'none' }}>
                <button type="button" className="es-btn es-btn-ghost" style={{ width: '100%' }} onClick={() => setUnassignedOpen(false)}>Close Window</button>
              </div>
            </div>
          )}
        </Modal>
      )}

    </div>
  )
}
