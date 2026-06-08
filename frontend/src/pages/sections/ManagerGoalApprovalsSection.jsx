import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import './EnterpriseSection.css'

// ── Avatar ───────────────────────────────────────────────────────────────────
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#0ea5e9','#10b981','#f59e0b','#ef4444','#14b8a6']
function Avatar({ name, size = 36, index = 0 }) {
  return (
    <div className="es-avatar" style={{ width: size, height: size, background: COLORS[index % COLORS.length], fontSize: size * 0.38 }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  )
}

// ── Goal Category Icon ────────────────────────────────────────────────────────
function CategoryIcon({ title }) {
  const t = (title || '').toLowerCase()
  if (t.includes('learn') || t.includes('skill') || t.includes('train')) return '📚'
  if (t.includes('lead') || t.includes('manage'))                          return '🎯'
  if (t.includes('sales') || t.includes('revenue') || t.includes('kpi'))  return '📈'
  if (t.includes('product') || t.includes('launch') || t.includes('ship')) return '🚀'
  if (t.includes('team') || t.includes('collab'))                         return '👥'
  if (t.includes('process') || t.includes('optim'))                       return '⚙️'
  return '🏆'
}

// ── Priority Indicator ────────────────────────────────────────────────────────
function PriorityDot({ days }) {
  if (days < 7)  return <span className="es-priority-dot priority-high" title="High priority" />
  if (days < 30) return <span className="es-priority-dot priority-med"  title="Medium priority" />
  return              <span className="es-priority-dot priority-low"  title="Standard" />
}

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <div className="es-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`es-modal ${wide ? 'es-modal-wide' : ''}`}>
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

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ManagerGoalApprovalsSection() {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth()
  const [activeTab, setActiveTab]     = useState('Pending')
  const [pendingGoals, setPending]    = useState([])
  const [approvedGoals, setApproved]  = useState([])
  const [rejectedGoals, setRejected]  = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [users, setUsers]             = useState([])
  const [search, setSearch]           = useState('')

  const [feedbackOpen, setFeedbackOpen]     = useState(false)
  const [feedbackAction, setFeedbackAction] = useState(null)
  const [feedbackGoal, setFeedbackGoal]     = useState(null)
  const [feedbackText, setFeedbackText]     = useState('')
  const [submitting, setSubmitting]         = useState(false)

  const [detailGoal, setDetailGoal] = useState(null)

  const headers = useCallback(() => ({
    'Authorization': `Bearer ${localStorage.getItem('acme_token')}`,
    'Content-Type': 'application/json'
  }), [])

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pRes, aRes, rRes, uRes] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/goals/pending', { headers: headers() }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/goals?status=approved', { headers: headers() }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/goals?status=rejected', { headers: headers() }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users', { headers: headers() })
      ])
      if (!pRes.ok || !aRes.ok || !rRes.ok || !uRes.ok) throw new Error('Failed to load goal data')
      setPending(await pRes.json())
      setApproved(await aRes.json())
      setRejected(await rRes.json())
      setUsers(await uRes.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [headers])

  useEffect(() => { 
    setTimeout(() => fetchGoals(), 0);
    const handleUpdate = () => fetchGoals();
    window.addEventListener('app-update', handleUpdate);
    return () => window.removeEventListener('app-update', handleUpdate);
  }, [fetchGoals])

  const getUserName = (id) => users.find(u => u.id === id)?.name || 'Unknown'
  const getUserIdx  = (id) => users.findIndex(u => u.id === id)

  const openAction = (action, goal) => {
    setFeedbackAction(action)
    setFeedbackGoal(goal)
    setFeedbackText('')
    setFeedbackOpen(true)
  }

  const submitFeedback = async () => {
    setSubmitting(true)
    const ep = feedbackAction === 'approve'
      ? `/api/goals/${feedbackGoal.id}/approve`
      : `/api/goals/${feedbackGoal.id}/reject`
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${ep}`, {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ manager_feedback: feedbackText })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || `Failed to ${feedbackAction} goal`)
      }
      setFeedbackOpen(false)
      setFeedbackText('')
      setFeedbackGoal(null)
      fetchGoals()
    } catch (err) { console.error(err.message) }
    finally { setSubmitting(false) }
  }

  const currentGoals = activeTab === 'Pending' ? pendingGoals : activeTab === 'Approved' ? approvedGoals : rejectedGoals

  const filteredGoals = currentGoals.filter(g => {
    if (!search) return true
    const name = getUserName(g.employee_id).toLowerCase()
    return name.includes(search.toLowerCase()) || g.title?.toLowerCase().includes(search.toLowerCase())
  })

  const [now] = useState(() => Date.now())
  const daysSince = (g) => Math.round((now - new Date(g.created_at)) / 86400000)

  const tabs = [
    { key: 'Pending',  count: pendingGoals.length,  color: '#f59e0b', icon: '⏳' },
    { key: 'Approved', count: approvedGoals.length, color: '#10b981', icon: '✅' },
    { key: 'Rejected', count: rejectedGoals.length, color: '#ef4444', icon: '❌' },
  ]

  return (
    <div className="es-root">

      {/* Command Bar */}
      <div className="es-command-bar">
        <div className="es-cmd-left">
          <div className="es-breadcrumb">⬡ Manager Dashboard / <span>Goal Approvals</span></div>
          <h1 className="es-page-title">Goal Approvals</h1>
          <p className="es-page-sub">Review, approve, or reject career goals submitted by your team</p>
        </div>
        <div className="es-cmd-right">
          <button className="es-btn es-btn-ghost" onClick={fetchGoals}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="es-tab-bar">
        <div className="es-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`es-tab-btn ${activeTab === t.key ? 'es-tab-active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              style={{ '--tab-color': t.color }}
            >
              <span>{t.icon}</span>
              {t.key}
              {t.count > 0 && (
                <span className={`es-tab-badge ${t.key === 'Pending' && t.count > 0 ? 'es-tab-badge-pulse' : ''}`}
                  style={{ background: t.color }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div className="es-tab-stats">
          <span className="es-tab-stat"><strong>{pendingGoals.length + approvedGoals.length + rejectedGoals.length}</strong> total goals</span>
          <span className="es-tab-stat-div">·</span>
          <span className="es-tab-stat">
            {pendingGoals.length + approvedGoals.length + rejectedGoals.length > 0
              ? Math.round((approvedGoals.length / (pendingGoals.length + approvedGoals.length + rejectedGoals.length)) * 100)
              : 0}% approval rate
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="es-toolbar">
        <div className="es-search-wrap">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input className="es-search" placeholder="Search by employee or goal title…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="es-search-clear" onClick={() => setSearch('')}><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>}
        </div>
        <span className="es-result-count">{filteredGoals.length} goal{filteredGoals.length !== 1 ? 's' : ''}</span>
      </div>

      {error && (
        <div className="es-error-banner">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          {error}
          <button onClick={fetchGoals}>Retry</button>
        </div>
      )}

      {/* Goals List */}
      {loading ? (
        <div className="es-goals-list">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="es-goal-card es-goal-skeleton">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="es-skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="es-skeleton" style={{ width: '60%', height: 14 }} />
                  <span className="es-skeleton" style={{ width: '40%', height: 12 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="es-empty-card">
          <div className="es-empty-icon">
            {activeTab === 'Pending' ? '🎯' : activeTab === 'Approved' ? '✅' : '📭'}
          </div>
          <p>{
            activeTab === 'Pending' ? (search ? `No goals matching "${search}"` : 'All caught up — no pending goals!') :
            activeTab === 'Approved' ? (search ? `No approved goals matching "${search}"` : 'No approved goals yet.') :
            (search ? `No rejected goals matching "${search}"` : 'No rejected goals.')
          }</p>
          {!search && activeTab === 'Pending' && <span>Your team's goal submissions will appear here.</span>}
        </div>
      ) : (
        <div className="es-goals-list">
          {filteredGoals.map((g, i) => {
            const name = getUserName(g.employee_id)
            const idx = getUserIdx(g.employee_id)
            const days = daysSince(g)
            const isPending = activeTab === 'Pending'

            return (
              <div key={g.id} className={`es-goal-card ${isPending ? 'es-goal-pending' : activeTab === 'Approved' ? 'es-goal-approved' : 'es-goal-rejected'}`}>
                {/* Left accent */}
                <div className="es-goal-accent" style={{
                  background: isPending ? '#f59e0b' : activeTab === 'Approved' ? '#10b981' : '#ef4444'
                }} />

                {/* Category icon */}
                <div className="es-goal-cat-icon">
                  <CategoryIcon title={g.title} />
                </div>

                {/* Employee info */}
                <div className="es-goal-who">
                  <Avatar name={name} size={38} index={idx >= 0 ? idx : i} />
                  <div>
                    <div className="es-goal-emp-name">{name}</div>
                    <div className="es-goal-date">
                      {isPending && <PriorityDot days={days} />}
                      {days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`}
                    </div>
                  </div>
                </div>

                {/* Goal content */}
                <div className="es-goal-content">
                  <div className="es-goal-title">{g.title}</div>
                  {g.description && <div className="es-goal-desc">{g.description}</div>}
                  {!isPending && g.manager_feedback && (
                    <div className="es-goal-mgr-fb">
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      <em>{g.manager_feedback}</em>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="es-goal-actions">
                  {isPending ? (
                    <>
                      <button className="es-goal-detail-btn" onClick={() => setDetailGoal(g)} title="View details">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="es-btn es-btn-reject" onClick={() => openAction('reject', g)}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        Reject
                      </button>
                      <button className="es-btn es-btn-approve" onClick={() => openAction('approve', g)}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        Approve
                      </button>
                    </>
                  ) : (
                    <span className={`es-goal-status-badge ${activeTab === 'Approved' ? 'es-badge-green' : 'es-badge-red'}`}>
                      {activeTab === 'Approved' ? '✓ Approved' : '✗ Rejected'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {detailGoal && (
        <Modal
          title="Goal Details"
          subtitle={`Submitted by ${getUserName(detailGoal.employee_id)}`}
          onClose={() => setDetailGoal(null)}
          wide
        >
          <div className="es-detail-body">
            <div className="es-detail-cat">
              <span className="es-detail-cat-icon"><CategoryIcon title={detailGoal.title} /></span>
              <span className="es-detail-cat-lbl">Career Goal</span>
            </div>
            <h3 className="es-detail-title">{detailGoal.title}</h3>
            {detailGoal.description && (
              <div className="es-detail-desc">{detailGoal.description}</div>
            )}
            <div className="es-detail-meta">
              <div className="es-detail-meta-item">
                <span className="es-detail-meta-lbl">Submitted by</span>
                <div className="es-emp-cell" style={{ marginTop: 4 }}>
                  <Avatar name={getUserName(detailGoal.employee_id)} size={28} index={getUserIdx(detailGoal.employee_id)} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{getUserName(detailGoal.employee_id)}</span>
                </div>
              </div>
              <div className="es-detail-meta-item">
                <span className="es-detail-meta-lbl">Submitted</span>
                <span className="es-detail-meta-val">{new Date(detailGoal.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="es-detail-meta-item">
                <span className="es-detail-meta-lbl">Status</span>
                <span className="es-badge es-badge-yellow">Pending Review</span>
              </div>
            </div>
          </div>
          <div className="es-modal-footer">
            <button className="es-btn es-btn-ghost" onClick={() => setDetailGoal(null)}>Close</button>
            <button className="es-btn es-btn-reject" onClick={() => { setDetailGoal(null); openAction('reject', detailGoal) }}>
              Reject
            </button>
            <button className="es-btn es-btn-approve" onClick={() => { setDetailGoal(null); openAction('approve', detailGoal) }}>
              Approve
            </button>
          </div>
        </Modal>
      )}

      {/* ── Approve / Reject Modal ── */}
      {feedbackOpen && feedbackGoal && (
        <Modal
          title={feedbackAction === 'approve' ? 'Approve Goal' : 'Reject Goal'}
          subtitle={`${getUserName(feedbackGoal.employee_id)} — ${feedbackGoal.title}`}
          onClose={() => { setFeedbackOpen(false); setFeedbackText(''); setFeedbackGoal(null) }}
          wide
        >
          <div className={`es-action-banner ${feedbackAction === 'approve' ? 'es-banner-approve' : 'es-banner-reject'}`}>
            {feedbackAction === 'approve'
              ? '✅ You are approving this goal. The employee will be notified.'
              : '❌ You are rejecting this goal. Please provide a reason below.'}
          </div>
          <div className="es-field">
            <label className="es-field-label">
              Manager Feedback
              {feedbackAction === 'reject' && <span className="es-required"> *</span>}
              {feedbackAction === 'approve' && <span className="es-optional"> (optional)</span>}
            </label>
            <textarea
              className="es-input es-textarea" rows={4}
              placeholder={feedbackAction === 'approve'
                ? 'Share what makes this goal strong or how to maximize it…'
                : 'Explain what needs to change before this goal can be approved…'}
              required={feedbackAction === 'reject'}
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
            />
          </div>
          <div className="es-modal-footer">
            <button className="es-btn es-btn-ghost" onClick={() => { setFeedbackOpen(false); setFeedbackText(''); setFeedbackGoal(null) }}>Cancel</button>
            <button
              className={`es-btn ${feedbackAction === 'approve' ? 'es-btn-approve' : 'es-btn-reject'}`}
              onClick={submitFeedback}
              disabled={submitting || (feedbackAction === 'reject' && !feedbackText.trim())}
            >
              {submitting ? 'Saving…' : feedbackAction === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
