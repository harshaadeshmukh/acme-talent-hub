import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

/* ─────────────────────────────────────────────────────────────────────────── */
/* Config                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
const TYPES = {
  product_launch:      { icon: '🚀', label: 'Product Launch',      color: '#8b5cf6', light: '#ede9fe', dark: '#6d28d9' },
  revenue_goal:        { icon: '💰', label: 'Revenue Goal',         color: '#10b981', light: '#d1fae5', dark: '#059669' },
  client_success:      { icon: '🤝', label: 'Client Success',       color: '#3b82f6', light: '#dbeafe', dark: '#1d4ed8' },
  innovation:          { icon: '💡', label: 'Innovation',           color: '#f59e0b', light: '#fef3c7', dark: '#d97706' },
  process_improvement: { icon: '⚙️',  label: 'Process Improvement', color: '#6366f1', light: '#e0e7ff', dark: '#4338ca' },
}

const MEDAL = ['🥇', '🥈', '🥉']
const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#cd7c54']
const MEDAL_BG = ['#fef3c7', '#f1f5f9', '#fdf0e8']

/* ─────────────────────────────────────────────────────────────────────────── */
/* Inline styles (no extra CSS file needed)                                     */
/* ─────────────────────────────────────────────────────────────────────────── */
const S = {
  page: {
    width: '100%',
    paddingBottom: '32px', fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '13px',
  },
  /* Hero header */
  heroWrap: {
    backgroundColor: '#0f1117',
    backgroundImage: `
      linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)
    `,
    backgroundSize: '28px 28px',
    borderRadius: '16px', padding: '18px 22px',
    marginBottom: '18px',
    position: 'relative', overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: '-60px', right: '-40px',
    width: '200px', height: '200px',
    background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)',
    pointerEvents: 'none',
  },
  heroTitle: {
    color: '#ffffff', fontSize: '22px', fontWeight: '800',
    margin: '0', letterSpacing: '-0.02em',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0',
  },
  awardBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#ffffff', fontSize: '13px', fontWeight: 700,
    boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
    flexShrink: 0, whiteSpace: 'nowrap',
  },
  /* Stat cards */
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' },
  statCard: (color) => ({
    background: '#ffffff', borderRadius: '12px', padding: '14px 18px',
    border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    borderLeft: `3px solid ${color}`,
  }),
  statNum: (color) => ({ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, color, lineHeight: 1 }),
  statLabel: { fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' },
  /* Filter bar */
  filterBar: {
    display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px',
    padding: '12px 16px', background: '#ffffff', borderRadius: '12px',
    border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    alignItems: 'center',
  },
  filterChip: (active, color) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
    border: active ? `2px solid ${color}` : '2px solid #f1f5f9',
    background: active ? color + '18' : '#f8fafc',
    color: active ? color : '#64748b',
    transition: 'all 0.15s ease',
  }),
  filterDivider: { width: '1px', height: '20px', background: '#e2e8f0', margin: '0 2px', flexShrink: 0 },
  teamSelect: {
    padding: '6px 12px', borderRadius: '8px', border: '2px solid #f1f5f9',
    background: '#f8fafc', color: '#0f172a', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', outline: 'none', marginLeft: 'auto',
  },
  /* Cards grid */
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  card: () => ({
    background: '#ffffff', borderRadius: '16px', padding: '0',
    border: '1px solid #f1f5f9', overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default', display: 'flex', flexDirection: 'column',
  }),
  cardAccent: (color) => ({
    height: '4px',
    background: `linear-gradient(90deg, ${color}, ${color}44)`,
  }),
  cardBody: { padding: '18px 22px', flex: 1, display: 'flex', flexDirection: 'column' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  iconWrap: (bg) => ({
    width: '42px', height: '42px', borderRadius: '11px', background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', boxShadow: `0 0 12px ${bg}`,
  }),
  typeBadge: (color, light) => ({
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    padding: '3px 8px', borderRadius: '6px', background: light,
    color: color, fontSize: '10px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  }),
  cardTitle: { fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '6px', lineHeight: 1.3 },
  cardDesc: { fontSize: '13px', color: '#475569', lineHeight: 1.5, flex: 1 },
  cardFooter: {
    padding: '10px 22px', borderTop: '1px solid #f8fafc',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#fafafa',
  },
  footerTeam: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '3px 10px', borderRadius: '6px', background: '#f1f5f9',
    fontSize: '12px', fontWeight: 700, color: '#334155',
  },
  footerDate: { fontSize: '11px', color: '#94a3b8', fontWeight: 500 },
  /* Empty state */
  empty: {
    textAlign: 'center', padding: '60px 40px',
    background: 'linear-gradient(180deg,#f8fafc,#f1f5f9)',
    borderRadius: '16px', border: '1px dashed #cbd5e1',
  },
  /* Modal overlay */
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  },
  modal: {
    background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '750px',
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 30px 60px -12px rgba(0,0,0,0.35)',
    animation: 'achModalIn 0.3s cubic-bezier(0.16,1,0.3,1)',
  },
  modalHead: {
    padding: '24px 28px 20px',
    background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
    borderRadius: '20px 20px 0 0',
    position: 'relative', overflow: 'hidden',
  },
  modalHeadGlow: {
    position: 'absolute', top: '-40px', right: '-40px',
    width: '200px', height: '200px',
    background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  modalTitle: { fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' },
  modalSub: { fontSize: '13px', color: '#94a3b8', marginTop: '4px', fontWeight: 400 },
  closeBtn: {
    position: 'absolute', top: '16px', right: '16px',
    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s',
  },
  modalBody: { padding: '24px 28px' },
  label: {
    display: 'block', fontSize: '11px', fontWeight: 700,
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px',
  },
  input: {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: '2px solid #e2e8f0', background: '#f8fafc',
    color: '#0f172a', fontSize: '13px', fontWeight: 500,
    outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
  },
  typeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  typeCard: (active, color, light) => ({
    padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '10px',
    border: active ? `2px solid ${color}` : '2px solid #f1f5f9',
    background: active ? light : '#f8fafc',
    transition: 'all 0.18s ease',
    boxShadow: active ? `0 4px 12px ${color}28` : 'none',
  }),
  typeIcon: (bg) => ({
    width: '32px', height: '32px', borderRadius: '8px', background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0,
  }),
  modalFooter: {
    padding: '16px 28px 24px',
    display: 'flex', justifyContent: 'flex-end', gap: '10px',
  },
  cancelBtn: {
    padding: '10px 20px', borderRadius: '10px', background: '#f1f5f9',
    color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer',
    fontSize: '13px', transition: 'background 0.2s',
  },
  submitBtn: (disabled) => ({
    padding: '10px 24px', borderRadius: '10px',
    background: disabled ? '#c4b5fd' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', fontWeight: 700, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '13px', boxShadow: disabled ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
    transition: 'all 0.2s',
  }),
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Sub-components                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Top Teams Leaderboard */
function TopTeamsLeaderboard({ source, departments }) {
  const [expanded, setExpanded] = useState(false)

  // Exclude "Unassigned", only teams that have ≥1 achievement, sorted desc
  const teamScores = departments
    .filter(dept => dept !== 'Unassigned')
    .map(dept => ({
      name: dept,
      count: source.filter(a => a.team_name === dept).length,
      byType: Object.fromEntries(Object.keys(TYPES).map(k => [k, source.filter(a => a.team_name === dept && a.type === k).length])),
    }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count)

  if (teamScores.length === 0) return null

  const top  = teamScores.slice(0, 3)
  const rest = teamScores.slice(3)                          // all after top-3
  const MAX_COMPACT = 7                                     // show up to 7 compact rows
  const visibleRest = expanded ? rest : rest.slice(0, MAX_COMPACT)
  const hiddenCount = rest.length - MAX_COMPACT

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: '20px' }}>
      {/* Header */}
      <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏆</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Top Teams Leaderboard</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{teamScores.length} team{teamScores.length !== 1 ? 's' : ''} with achievements</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Podium top 3 */}
        {top.map((team, i) => {
          const pct = top[0].count > 0 ? (team.count / top[0].count) * 100 : 0
          return (
            <div key={team.name} className="ach-leaderboard-row" style={{
              display: 'grid', gridTemplateColumns: '28px 1fr auto',
              alignItems: 'center', gap: '14px',
              padding: '12px 16px', borderRadius: '12px',
              background: i === 0 ? '#fffbeb' : i === 1 ? '#f8fafc' : '#fdf8f5',
              border: `1px solid ${i === 0 ? '#fde68a' : i === 1 ? '#f1f5f9' : '#f5e0d3'}`,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}>
              <div style={{ fontSize: '20px', textAlign: 'center' }}>{MEDAL[i]}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{team.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: MEDAL_COLORS[i], background: MEDAL_BG[i], padding: '2px 8px', borderRadius: '20px' }}>
                    {team.count} achievement{team.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ height: '5px', borderRadius: '4px', background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '4px',
                    background: i === 0 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : i === 1 ? 'linear-gradient(90deg, #94a3b8, #64748b)' : 'linear-gradient(90deg, #cd7c54, #a05a35)',
                    width: `${pct}%`, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {Object.entries(TYPES).filter(([k]) => team.byType[k] > 0).map(([k, cfg]) => (
                    <span key={k} style={{ fontSize: '10px', fontWeight: 600, color: cfg.color, background: cfg.light, padding: '2px 7px', borderRadius: '5px' }}>
                      {cfg.icon} {team.byType[k]}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: MEDAL_COLORS[i], fontFamily: 'JetBrains Mono, monospace', minWidth: '32px', textAlign: 'right' }}>
                {team.count}
              </div>
            </div>
          )
        })}

        {/* Compact rest — capped at MAX_COMPACT rows */}
        {visibleRest.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
            {visibleRest.map((team, i) => (
              <div key={team.name} style={{
                display: 'grid', gridTemplateColumns: '28px 1fr auto',
                alignItems: 'center', gap: '12px',
                padding: '7px 16px', borderRadius: '9px',
                background: '#fafbfc', border: '1px solid #f1f5f9',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>#{i + 4}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{team.name}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>{team.count}</div>
              </div>
            ))}
          </div>
        )}
        {hiddenCount > 0 && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {expanded ? 'Show less' : `Show ${hiddenCount} more teams`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Achievement Analytics Bar Chart */
function AchievementAnalytics({ source }) {
  const [hovered, setHovered] = useState(null)
  const total = source.length
  if (total === 0) return null

  const data = Object.entries(TYPES).map(([key, cfg]) => ({
    key, cfg,
    count: source.filter(a => a.type === key).length,
  })).sort((a, b) => b.count - a.count)

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📊</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Achievement Analytics</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Distribution by category across all teams</div>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>
          {total} total milestone{total !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.map(({ key, cfg, count }) => {
            const sharePct = total > 0 ? Math.round((count / total) * 100) : 0
            const pct = sharePct
            const isHov = hovered === key
            return (
              <div
                key={key}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'grid', gridTemplateColumns: '140px 1fr 50px',
                  alignItems: 'center', gap: '12px',
                  padding: '8px 10px', borderRadius: '10px',
                  background: isHov ? cfg.light + '60' : 'transparent',
                  transition: 'background 0.15s ease',
                  cursor: 'default',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '16px' }}>{cfg.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cfg.label}</span>
                </div>

                <div style={{ position: 'relative', height: '22px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${cfg.color}, ${cfg.dark})`,
                    borderRadius: '6px',
                    transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px',
                  }}>
                    {count > 0 && pct > 25 && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{sharePct}%</span>
                    )}
                  </div>
                  {(count === 0 || pct <= 25) && count > 0 && (
                    <span style={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translateY(-50%)', paddingLeft: '6px', fontSize: '10px', fontWeight: 700, color: '#64748b' }}>{sharePct}%</span>
                  )}
                </div>

                <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: 800, color: count > 0 ? cfg.color : '#cbd5e1', fontFamily: 'JetBrains Mono, monospace' }}>
                  {count}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f8fafc' }}>
          {data.filter(d => d.count > 0).map(({ key, cfg, count }) => (
            <div key={key} style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '8px',
              background: cfg.light, fontSize: '11px', fontWeight: 600, color: cfg.dark,
            }}>
              {cfg.icon} {cfg.label}
              <span style={{ background: cfg.color, color: '#fff', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main Component                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
export default function AchievementsSection({ user }) {
  const { token } = useAuth()
  const isManager = user?.role === 'manager'

  /* State */
  const [allAchievements, setAllAchievements] = useState([])   // manager sees all teams
  const [achievements, setAchievements]       = useState([])   // employee sees own team
  const [departments, setDepartments]         = useState([])
  const [loading, setLoading]                 = useState(true)
  const [typeFilter, setTypeFilter]           = useState('all')
  const [teamFilter, setTeamFilter]           = useState('all')
  const [modalOpen, setModalOpen]             = useState(false)
  const [teamDropdownOpen, setTeamDropdownOpen]= useState(false)
  const [submitting, setSubmitting]           = useState(false)
  const [form, setForm]                       = useState({ team_name: '', title: '', description: '', type: 'product_launch' })

  const headers = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' })

  /* Fetch */
  useEffect(() => {
    const doFetch = () => {
      if (isManager) {
        fetchAll()
        fetchDepartments()
      } else {
        fetchForTeam(user?.department)
      }
    }
    doFetch()
    const handleUpdate = () => doFetch();
    window.addEventListener('app-update', handleUpdate);
    return () => window.removeEventListener('app-update', handleUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchAll() {
    setLoading(true)
    try {
      const deps = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users/departments/list', { headers: { Authorization: `Bearer ${token}` } })
      const dList = deps.ok ? await deps.json() : []
      setDepartments(dList)
      const results = await Promise.all(
        dList.map(d => fetch(`\${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}/api/achievements/${encodeURIComponent(d)}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []))
      )
      const flat = results.flat().sort((a, b) => new Date(b.date_awarded) - new Date(a.date_awarded))
      setAllAchievements(flat)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function fetchForTeam(dept) {
    if (!dept || dept === 'Unassigned') { setLoading(false); return }
    try {
      const res = await fetch(`\${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}/api/achievements/${encodeURIComponent(dept)}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setAchievements(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function fetchDepartments() {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users/departments/list', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setDepartments(await res.json())
    } catch (e) { console.error(e) }
  }

  const handleAward = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/achievements/', { method: 'POST', headers: headers(), body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed')
      setModalOpen(false)
      setForm({ team_name: '', title: '', description: '', type: 'product_launch' })
      fetchAll()
    } catch (err) { console.error(err.message) }
    finally { setSubmitting(false) }
  }

  /* Derived data */
  const source = isManager ? allAchievements : achievements
  const filtered = source.filter(a =>
    (typeFilter === 'all' || a.type === typeFilter) &&
    (teamFilter === 'all' || a.team_name === teamFilter)
  )

  return (
    <div style={S.page}>
      <style>{`
        @keyframes achModalIn { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:none; } }
        .ach-card:hover { transform: translateY(-5px) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.1) !important; }
        .ach-award-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.55) !important; }
        .ach-type-card:hover { transform: scale(1.02); }
        .ach-input:focus { border-color: #8b5cf6 !important; background: #fff !important; box-shadow: 0 0 0 4px rgba(139,92,246,0.12) !important; }
        .ach-leaderboard-row:hover { transform: translateX(3px); box-shadow: 0 4px 16px rgba(0,0,0,0.06) !important; }
      `}</style>

      {/* ── Hero Header ── */}
      <div style={S.heroWrap}>
        <div style={S.heroGlow} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '500', letterSpacing: '0.04em' }}>
              ⬡ {isManager ? 'Manager Dashboard' : 'Employee Portal'} / <span style={{ color: 'rgba(255,255,255,0.6)' }}>Achievements</span>
            </div>
            <h1 style={S.heroTitle}>Hall of Fame</h1>
            <p style={S.heroSub}>
              {isManager
                ? (() => {
                    const activeTeamsCount = new Set(source.map(a => a.team_name)).size;
                    return `${source.length} milestone${source.length !== 1 ? 's' : ''} across ${activeTeamsCount} team${activeTeamsCount !== 1 ? 's' : ''}`;
                  })()
                : `${achievements.length} achievement${achievements.length !== 1 ? 's' : ''} earned by ${user?.department}`}
            </p>
          </div>
          {isManager && (
            <button className="ach-award-btn" style={S.awardBtn} onClick={() => { setForm({ team_name: departments[0] || '', title: '', description: '', type: 'product_launch' }); setModalOpen(true) }}>
              <span style={{ fontSize: '18px' }}>＋</span> Award Achievement
            </button>
          )}
        </div>
      </div>

      {/* ── Insights: Leaderboard + Analytics (Manager only, when data exists) ── */}
      {isManager && !loading && source.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '0' }}>
          <TopTeamsLeaderboard source={source} departments={departments} />
          <AchievementAnalytics source={source} />
        </div>
      )}

      {/* ── Filter Bar ── */}
      {!loading && source.length > 0 && (
        <div style={S.filterBar}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>Type</span>
          <button style={S.filterChip(typeFilter === 'all', '#6366f1')} onClick={() => setTypeFilter('all')}>All</button>
          {Object.entries(TYPES).map(([key, cfg]) => (
            <button key={key} style={S.filterChip(typeFilter === key, cfg.color)} onClick={() => setTypeFilter(key)}>
              {cfg.icon} {cfg.label}
            </button>
          ))}
          {isManager && departments.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <div style={S.filterDivider} />
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', background: '#fff', 
                    border: '1px solid', borderColor: teamDropdownOpen ? '#6366f1' : '#e2e8f0',
                    borderRadius: '10px',
                    fontSize: '13px', fontWeight: 600, color: '#334155',
                    cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s', outline: 'none'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = teamDropdownOpen ? '#6366f1' : '#cbd5e1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = teamDropdownOpen ? '#6366f1' : '#e2e8f0'}
                >
                  <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  {teamFilter === 'all' ? 'All Teams' : teamFilter}
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: teamDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#94a3b8' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>

                {teamDropdownOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setTeamDropdownOpen(false)} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      background: '#fff', border: '1px solid #e2e8f0',
                      borderRadius: '12px', padding: '6px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                      zIndex: 100, minWidth: '200px',
                      animation: 'achModalIn 0.2s ease'
                    }}>
                      <div 
                        onClick={() => { setTeamFilter('all'); setTeamDropdownOpen(false); }}
                        style={{
                          padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: teamFilter === 'all' ? 700 : 500,
                          color: teamFilter === 'all' ? '#4f46e5' : '#475569',
                          background: teamFilter === 'all' ? '#e0e7ff' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => { if (teamFilter !== 'all') e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { if (teamFilter !== 'all') e.currentTarget.style.background = 'transparent' }}
                      >
                        All Teams
                        {teamFilter === 'all' && <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                      
                      <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                      
                      {departments.map(d => (
                        <div 
                          key={d}
                          onClick={() => { setTeamFilter(d); setTeamDropdownOpen(false); }}
                          style={{
                            padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: teamFilter === d ? 700 : 500,
                            color: teamFilter === d ? '#4f46e5' : '#475569',
                            background: teamFilter === d ? '#e0e7ff' : 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => { if (teamFilter !== d) e.currentTarget.style.background = '#f8fafc' }}
                          onMouseLeave={e => { if (teamFilter !== d) e.currentTarget.style.background = 'transparent' }}
                        >
                          {d}
                          {teamFilter === d && <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⏳</div>
          <p style={{ fontWeight: 600 }}>Loading achievements...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: '56px', marginBottom: '16px', filter: 'grayscale(0.4)' }}>🏆</div>
          <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#334155', margin: '0 0 10px' }}>
            {source.length === 0 ? 'No achievements yet' : 'No results for this filter'}
          </h3>
          <p style={{ color: '#64748b', maxWidth: '380px', margin: '0 auto', lineHeight: 1.6 }}>
            {isManager
              ? source.length === 0 ? 'Click "Award Achievement" to recognize your first team milestone!' : 'Try removing some filters to see more achievements.'
              : "Your team's milestones will appear here once your manager recognizes them."}
          </p>
        </div>
      ) : (
        <div style={S.grid}>
          {filtered.map(ach => {
            const cfg = TYPES[ach.type] || TYPES.product_launch
            const date = new Date(ach.date_awarded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            return (
              <div key={ach.id} className="ach-card" style={S.card()}>
                <div style={S.cardAccent(cfg.color)} />
                <div style={S.cardBody}>
                  <div style={S.cardTop}>
                    <div style={S.iconWrap(cfg.light)}>{cfg.icon}</div>
                    <div style={S.typeBadge(cfg.color, cfg.light)}>{cfg.icon} {cfg.label}</div>
                  </div>
                  <h3 style={S.cardTitle}>{ach.title}</h3>
                  <p style={S.cardDesc}>{ach.description || <em style={{ opacity: 0.5 }}>No description provided.</em>}</p>
                </div>
                <div style={S.cardFooter}>
                  <span style={S.footerTeam}>👥 {ach.team_name}</span>
                  <span style={S.footerDate}>{date}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Award Modal ── */}
      {modalOpen && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <div style={S.modalHeadGlow} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={S.modalTitle}>🏆 Award Achievement</h2>
                <p style={S.modalSub}>Recognize a team for an extraordinary milestone</p>
              </div>
              <button style={S.closeBtn} onClick={() => setModalOpen(false)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAward}>
              <div style={S.modalBody}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

                  <div>
                    <label style={S.label}>Receiving Team</label>
                    <select className="ach-input" style={{ ...S.input, cursor: 'pointer' }} required value={form.team_name} onChange={e => setForm({...form, team_name: e.target.value})}>
                      <option value="" disabled>— Select a team —</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Achievement Category</label>
                    <div style={S.typeGrid}>
                      {Object.entries(TYPES).map(([key, cfg]) => (
                        <div
                          key={key}
                          className="ach-type-card"
                          onClick={() => setForm({...form, type: key})}
                          style={S.typeCard(form.type === key, cfg.color, cfg.light)}
                        >
                          <div style={S.typeIcon(cfg.light)}>{cfg.icon}</div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: form.type === key ? cfg.dark : '#334155' }}>{cfg.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={S.label}>Achievement Title</label>
                    <input className="ach-input" style={S.input} required
                      placeholder="e.g. Shipped v3.0 two weeks early 🚀"
                      value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                  </div>

                  <div>
                    <label style={S.label}>Impact Story</label>
                    <textarea className="ach-input" style={{ ...S.input, resize: 'vertical', minHeight: '100px' }} rows={3}
                      placeholder="Describe the effort, the challenge overcome, and the impact on the company..."
                      value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                  </div>
                </div>
              </div>

              <div style={S.modalFooter}>
                <button type="button" style={S.cancelBtn} onClick={() => setModalOpen(false)}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  Cancel
                </button>
                <button type="submit" style={S.submitBtn(submitting)} disabled={submitting}
                  onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.5)' } }}
                  onMouseLeave={e => { if (!submitting) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.4)' } }}>
                  {submitting ? 'Awarding…' : '🏆 Award Achievement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
