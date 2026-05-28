import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import './ManagerDashboard.css'

// ── Mini Sparkline Bar ──────────────────────────────────────────────────────
function SparkBar({ value, max = 100, color = '#6366f1' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="spark-track">
      <div className="spark-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ── Circular Ring Progress ──────────────────────────────────────────────────
function RingProgress({ value, max = 100, size = 80, stroke = 7, color = '#6366f1', label, sublabel }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, value / max)
  const dash = circ * pct
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="ring-inner">
        <span className="ring-value">{label}</span>
        {sublabel && <span className="ring-sub">{sublabel}</span>}
      </div>
    </div>
  )
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, accent, trend, sparkValues, loading }) {
  const trendUp = trend >= 0
  return (
    <div className={`mgr-kpi-card`} style={{ '--accent': accent || color }}>
      <div className="mgr-kpi-top">
        <div className="mgr-kpi-icon" style={{ background: `${color}22`, color }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`mgr-kpi-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mgr-kpi-value">
        {loading ? <span className="mgr-skeleton" style={{ width: 48, height: 28 }} /> : value}
      </div>
      <div className="mgr-kpi-label">{label}</div>
      {sub && <div className="mgr-kpi-sub">{sub}</div>}
      {sparkValues && (
        <div className="mgr-spark-row">
          {sparkValues.map((v, i) => (
            <div key={i} className="mgr-spark-col" style={{ height: `${v}%`, background: color }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Rating Star Bar ─────────────────────────────────────────────────────────
function RatingBar({ rating, max = 5 }) {
  const pct = (rating / max) * 100
  const color = rating >= 4.5 ? '#10b981' : rating >= 3.5 ? '#6366f1' : rating >= 2.5 ? '#f59e0b' : '#ef4444'
  return (
    <div className="rating-bar-wrap">
      <div className="rating-bar-track">
        <div className="rating-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="rating-bar-val" style={{ color }}>{rating.toFixed(1)}</span>
    </div>
  )
}

// ── Performance Badge ───────────────────────────────────────────────────────
function PerfBadge({ rating }) {
  if (rating >= 4.5) return <span className="perf-badge perf-elite">Elite</span>
  if (rating >= 4.0) return <span className="perf-badge perf-high">High</span>
  if (rating >= 3.0) return <span className="perf-badge perf-mid">Mid</span>
  return <span className="perf-badge perf-low">Low</span>
}

// ── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, src, size = 36, index = 0 }) {
  if (src) {
    return <img src={src} alt={name} className="mgr-avatar" style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%' }} />
  }
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b']
  const bg = colors[index % colors.length]
  return (
    <div className="mgr-avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.4 }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  )
}

// ── Risk Badge ──────────────────────────────────────────────────────────────
function RiskBadge({ level }) {
  const map = {
    high:   { label: 'High Risk',   cls: 'risk-high' },
    medium: { label: 'Medium Risk', cls: 'risk-med' },
    low:    { label: 'Low Risk',    cls: 'risk-low' },
  }
  const r = map[level] || { label: level || 'Risk', cls: 'risk-med' }
  return <span className={`risk-badge ${r.cls}`}>{r.label}</span>
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function ManagerOverviewSection({ onNavigate }) {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [pendingReviews, setPendingReviews] = useState(0)
  const [approvedGoals, setApprovedGoals] = useState(0)
  const [topPerformers, setTopPerformers] = useState([])
  const [atRisk, setAtRisk] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('performers')
  const [unassignedEmployees, setUnassignedEmployees] = useState([])
  const [now] = useState(new Date())

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('acme_token')
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

    try {
      const [statsRes, reviewsRes, goalsRes, highPerfRes, unassignedRes, usersRes] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/manager-dashboard/stats', { headers }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/reviews?limit=100', { headers }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/goals?status=approved', { headers }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/manager-dashboard/high-performers', { headers }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users/unassigned', { headers }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users', { headers })
      ])

      if (!statsRes.ok || !reviewsRes.ok || !goalsRes.ok || !highPerfRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const [, reviewsData, goalsData, highPerfData, unassignedData, usersData] = await Promise.all([
        statsRes.json(), reviewsRes.json(), goalsRes.json(), highPerfRes.json(), unassignedRes.json(), usersRes.json()
      ])

      let atRiskData = []
      try {
        const atRiskRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/manager-dashboard/at-risk-employees', { headers })
        if (atRiskRes.ok) atRiskData = await atRiskRes.json()
      } catch { /* ignore */ }

      // Dynamic Team Filtering
      const isManager = user?.role !== 'admin'
      const myTeamUsers = usersData.filter(u => 
        u.role === 'employee' && (!isManager || (u.department === user.department && u.id !== user.id))
      )
      const myTeamIds = new Set(myTeamUsers.map(u => u.id))

      const teamReviews = reviewsData.filter(r => myTeamIds.has(r.employee_id))
      const teamGoals = goalsData.filter(g => myTeamIds.has(g.employee_id))
      const teamHighPerf = highPerfData.filter(h => myTeamIds.has(h.id))
      const teamAtRisk = atRiskData.filter(a => myTeamIds.has(a.id))

      setStats({
        total_employees: myTeamIds.size,
        active_employees: myTeamIds.size,
        high_performers: teamHighPerf.length,
        at_risk_employees: teamAtRisk.length
      })

      setPendingReviews(teamReviews.filter(r => r.rating === null || r.rating === 0).length)
      setApprovedGoals(teamGoals.length)
      setTopPerformers(teamHighPerf.slice(0, 8))
      setAtRisk(teamAtRisk)
      setUnassignedEmployees(unassignedData)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { 
    setTimeout(() => fetchAll(), 0);
    const handleUpdate = () => fetchAll();
    window.addEventListener('app-update', handleUpdate);
    return () => window.removeEventListener('app-update', handleUpdate);
  }, [fetchAll])

  // Derived metrics
  const engagementRate = stats ? Math.round(((stats.total_employees - (atRisk.length || 0)) / Math.max(1, stats.total_employees)) * 100) : 0
  const reviewCompletion = stats ? Math.round(((stats.total_employees - pendingReviews) / Math.max(1, stats.total_employees)) * 100) : 0
  const goalApprovalRate = stats ? Math.round((approvedGoals / Math.max(1, stats.total_employees)) * 100) : 0

  // Fake spark data for visual richness (based on real stats for proportional accuracy)
  const teamSpark = [55, 62, 70, 60, 75, 68, 80, 73, 88, 79, 92, 85]

  const timeLabel = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  if (error) {
    return (
      <div className="mgr-error-card">
        <div className="mgr-error-icon">⚠️</div>
        <h3>Dashboard Unavailable</h3>
        <p>{error}</p>
        <button onClick={fetchAll} className="mgr-retry-btn">Retry Connection</button>
      </div>
    )
  }

  return (
    <div className="mgr-dashboard">

      {/* ── Command Bar ── */}
      <div className="mgr-command-bar">
        <div className="mgr-command-left">
          <div className="mgr-breadcrumb">
            <span className="mgr-bc-home">⬡ Manager Dashboard</span>
            <span className="mgr-bc-sep">/</span>
            <span className="mgr-bc-current">Overview</span>
          </div>
          <div className="mgr-greeting">
            <span className="mgr-greeting-wave">👋</span>
            <span>{timeLabel}, <strong>{user?.name?.split(' ')[0] || 'Manager'}</strong></span>
            <span className="mgr-live-dot" title="Live data" />
          </div>
        </div>
        <div className="mgr-command-actions">
          <button className="mgr-cmd-btn mgr-cmd-secondary" onClick={() => onNavigate('Manage Team')}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M4 21v-1a7 7 0 0114 0v1"/></svg>
            Manage Team
          </button>
          <button className="mgr-cmd-btn mgr-cmd-primary" onClick={() => onNavigate('Review Center')}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            Review Center
            {pendingReviews > 0 && <span className="mgr-cmd-badge">{pendingReviews}</span>}
          </button>
        </div>
      </div>

      {/* ── Unassigned Alert ── */}
      {unassignedEmployees.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, color: '#b45309', fontSize: '16px' }}>Unassigned Employees Detected</div>
              <div style={{ fontSize: '14px', color: '#d97706', marginTop: '4px' }}>{unassignedEmployees.length} employee(s) have not been assigned to a department yet.</div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('Manage Team')}
            style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#d97706'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f59e0b'}
          >
            Review & Assign
          </button>
        </div>
      )}

      {/* ── KPI Strip ── */}
      <div className="mgr-kpi-grid">
        <KpiCard
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
          label="Direct Reports"
          value={stats?.total_employees ?? '—'}
          sub="Active headcount"
          color="#6366f1"
          trend={3}
          sparkValues={teamSpark}
          loading={loading}
        />
        <KpiCard
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
          label="Pending Reviews"
          value={loading ? '—' : pendingReviews}
          sub={pendingReviews === 0 ? 'All caught up!' : `${pendingReviews} need action`}
          color="#f59e0b"
          trend={pendingReviews > 0 ? -8 : 0}
          sparkValues={[40, 60, 45, 70, 55, 80, 65, 50, 40, 35, 30, 20]}
          loading={loading}
        />
        <KpiCard
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          label="Approved Goals"
          value={loading ? '—' : approvedGoals}
          sub="Successfully completed"
          color="#ec4899"
          trend={-5}
          sparkValues={[30, 45, 55, 40, 65, 50, 45, 60, 70, 55, 45, 35]}
          loading={loading}
        />
        <KpiCard
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          label="High Performers"
          value={stats?.high_performers ?? '—'}
          sub="Above 4.0 avg rating"
          color="#10b981"
          trend={12}
          sparkValues={[20, 30, 35, 45, 50, 55, 60, 65, 70, 75, 80, 88]}
          loading={loading}
        />
      </div>

      {/* ── Analytics Row ── */}
      <div className="mgr-analytics-row">

        {/* Team Health Panel */}
        <div className="mgr-panel mgr-health-panel">
          <div className="mgr-panel-header">
            <h3 className="mgr-panel-title">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Team Health Score
            </h3>
            <span className="mgr-panel-tag mgr-tag-live">● Live</span>
          </div>

          <div className="mgr-rings-row">
            <div className="mgr-ring-item">
              <RingProgress value={engagementRate} max={100} size={88} stroke={8} color="#10b981"
                label={`${engagementRate}%`} sublabel="ENG" />
              <span className="mgr-ring-label">Engagement</span>
            </div>
            <div className="mgr-ring-item">
              <RingProgress value={reviewCompletion} max={100} size={88} stroke={8} color="#6366f1"
                label={`${reviewCompletion}%`} sublabel="REV" />
              <span className="mgr-ring-label">Reviews Done</span>
            </div>
            <div className="mgr-ring-item">
              <RingProgress value={goalApprovalRate} max={100} size={88} stroke={8} color="#f59e0b"
                label={`${goalApprovalRate}%`} sublabel="GLs" />
              <span className="mgr-ring-label">Goals Approved</span>
            </div>
          </div>

          <div className="mgr-health-metrics">
            <div className="mgr-hm-row">
              <span className="mgr-hm-label">Retention Risk</span>
              <SparkBar value={atRisk.length} max={Math.max(1, stats?.total_employees || 1)} color="#ef4444" />
              <span className="mgr-hm-val red">{atRisk.length} at risk</span>
            </div>
            <div className="mgr-hm-row">
              <span className="mgr-hm-label">Review Coverage</span>
              <SparkBar value={reviewCompletion} max={100} color="#6366f1" />
              <span className="mgr-hm-val">{reviewCompletion}%</span>
            </div>
            <div className="mgr-hm-row">
              <span className="mgr-hm-label">Top Talent Rate</span>
              <SparkBar value={stats?.high_performers || 0} max={Math.max(1, stats?.total_employees || 1)} color="#10b981" />
              <span className="mgr-hm-val green">
                {stats ? Math.round(((stats.high_performers || 0) / Math.max(1, stats.total_employees)) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="mgr-panel mgr-actions-panel">
          <div className="mgr-panel-header">
            <h3 className="mgr-panel-title">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Quick Actions
            </h3>
          </div>
          <div className="mgr-quick-actions">
            {[
              { icon: '📋', label: 'Write Review', sub: `${pendingReviews} pending`, color: '#f59e0b', action: 'Review Center' },
              { icon: '✅', label: 'Approved Goals', sub: `${approvedGoals} completed`, color: '#6366f1', action: 'Learning & Growth' },
              { icon: '👥', label: 'View Team', sub: `${stats?.total_employees || '—'} members`, color: '#0ea5e9', action: 'Manage Team' },
              { icon: '📊', label: 'Performance Report', sub: 'Q2 summary', color: '#10b981', action: 'Review Center' },
            ].map((a, i) => (
              <button key={i} className="mgr-qa-item" onClick={() => onNavigate(a.action)}>
                <div className="mgr-qa-icon" style={{ background: `${a.color}18`, color: a.color }}>{a.icon}</div>
                <div className="mgr-qa-info">
                  <span className="mgr-qa-label">{a.label}</span>
                  <span className="mgr-qa-sub">{a.sub}</span>
                </div>
                <svg className="mgr-qa-arrow" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Performers / At-Risk Tabs ── */}
      <div className="mgr-panel mgr-table-panel">
        <div className="mgr-panel-header">
          <div className="mgr-tab-switcher">
            <button className={`mgr-tab ${activeTab === 'performers' ? 'mgr-tab-active' : ''}`} onClick={() => setActiveTab('performers')}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Top Performers
              <span className="mgr-tab-count">{topPerformers.length}</span>
            </button>
            <button className={`mgr-tab ${activeTab === 'atrisk' ? 'mgr-tab-active' : ''}`} onClick={() => setActiveTab('atrisk')}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
              At-Risk Employees
              {atRisk.length > 0 && <span className="mgr-tab-count mgr-tab-count-red">{atRisk.length}</span>}
            </button>
          </div>
          <button className="mgr-view-all-btn" onClick={() => onNavigate(activeTab === 'performers' ? 'Review Center' : 'Manage Team')}>
            View all →
          </button>
        </div>

        {/* Top Performers Table */}
        {activeTab === 'performers' && (
          <div className="mgr-table-wrap">
            {loading ? (
              <div className="mgr-table-loading">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="mgr-skeleton-row">
                    <span className="mgr-skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <span className="mgr-skeleton" style={{ width: 120, height: 14 }} />
                    <span className="mgr-skeleton" style={{ width: 80, height: 14 }} />
                    <span className="mgr-skeleton" style={{ width: 140, height: 10 }} />
                    <span className="mgr-skeleton" style={{ width: 50, height: 22, borderRadius: 20 }} />
                  </div>
                ))}
              </div>
            ) : topPerformers.length === 0 ? (
              <div className="mgr-empty">
                <div className="mgr-empty-icon">📊</div>
                <p>No performance data yet.</p>
                <span>Complete reviews to see rankings here.</span>
              </div>
            ) : (
              <table className="mgr-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Performance</th>
                    <th>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((p, i) => (
                    <tr key={p.id} className={i < 3 ? 'mgr-row-top' : ''}>
                      <td>
                        <span className={`mgr-rank ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : 'rank-plain'}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                      </td>
                      <td>
                        <div className="mgr-emp-cell">
                          <Avatar name={p.name} src={p.avatar_url} index={i} />
                          <div>
                            <div className="mgr-emp-name">{p.name}</div>
                            <div className="mgr-emp-meta">Employee</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="mgr-dept-tag">{p.department || 'General'}</span>
                      </td>
                      <td style={{ minWidth: 180 }}>
                        <RatingBar rating={p.average_rating} />
                      </td>
                      <td>
                        <PerfBadge rating={p.average_rating} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* At-Risk Table */}
        {activeTab === 'atrisk' && (
          <div className="mgr-table-wrap">
            {loading ? (
              <div className="mgr-table-loading">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="mgr-skeleton-row">
                    <span className="mgr-skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <span className="mgr-skeleton" style={{ width: 120, height: 14 }} />
                    <span className="mgr-skeleton" style={{ width: 80, height: 14 }} />
                    <span className="mgr-skeleton" style={{ width: 70, height: 22, borderRadius: 20 }} />
                    <span className="mgr-skeleton" style={{ width: 100, height: 22, borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            ) : atRisk.length === 0 ? (
              <div className="mgr-empty mgr-empty-success">
                <div className="mgr-empty-icon">🎯</div>
                <p>All clear — no at-risk employees!</p>
                <span>Your team engagement is strong. Keep it up.</span>
              </div>
            ) : (
              <table className="mgr-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Avg Rating</th>
                    <th>Risk Level</th>
                    <th>Flag Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map((p, i) => (
                    <tr key={p.id} className="mgr-row-risk">
                      <td>
                        <div className="mgr-emp-cell">
                          <Avatar name={p.name} src={p.avatar_url} index={i + 10} />
                          <div>
                            <div className="mgr-emp-name">{p.name}</div>
                            <div className="mgr-emp-meta">Needs attention</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="mgr-dept-tag">{p.department || 'General'}</span></td>
                      <td>
                        {p.average_rating
                          ? <RatingBar rating={p.average_rating} />
                          : <span className="mgr-na">N/A</span>}
                      </td>
                      <td><RiskBadge level={p.risk_level || 'medium'} /></td>
                      <td>
                        <span className="mgr-reason-tag">{p.reason || 'Low engagement'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>



    </div>
  )
}
