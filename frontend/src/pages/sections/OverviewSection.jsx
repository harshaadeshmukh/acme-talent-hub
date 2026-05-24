import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import './Sections.css'
import './ManagerDashboard.css'

function RingProgress({ value, max = 100, size = 64, stroke = 6, color = '#6366f1' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, Math.max(0, value / max))
  const dash = circ * pct
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{Math.round(pct * 100)}%</span>
    </div>
  )
}

function KpiCard({ icon, label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 4px 12px -5px rgba(0, 0, 0, 0.05)', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }} className="hover-lift">
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: color }} />
      <div style={{ background: `${color}15`, color, width: '52px', height: '52px', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ color: '#64748b', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: '#0f172a', fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  )
}

export default function OverviewSection({ onNavigate }) {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'User'
  const isProfileComplete = Boolean(user?.dob && user?.address && user?.gender && user?.job_title)

  const [statsData, setStatsData] = useState({
    team_size: 0,
    active_goals: 0,
    pending_reviews: 0,
    achievements: 0
  })
  const [recentGoals, setRecentGoals] = useState([])
  const [recentReviews, setRecentReviews] = useState([])

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('acme_token')
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/employee-dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setStatsData(data)
        }
      } catch (err) {
        console.error('Failed to fetch employee stats:', err)
      }
    }
    const fetchGoals = async () => {
      const token = localStorage.getItem('acme_token')
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/learning/goals', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setRecentGoals(data.slice(0, 3))
        }
      } catch (err) {
        console.error('Failed to fetch goals:', err)
      }
    }
    const fetchReviews = async () => {
      if (!user?.id) return
      const token = localStorage.getItem('acme_token')
      try {
        const res = await fetch(`\${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}/api/reviews/employee/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setRecentReviews(data.slice(0, 3))
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err)
      }
    }
    const fetchAll = () => { fetchStats(); fetchGoals(); fetchReviews(); }
    fetchAll()
    const handleUpdate = () => fetchAll();
    window.addEventListener('app-update', handleUpdate);
    return () => window.removeEventListener('app-update', handleUpdate);
  }, [user?.id])

  const stats = [
    { label: 'Team Size', value: statsData.team_size, icon: '👥', color: '#6366f1', spark: [40, 60, 80, 100, 80, 90, 100] },
    { label: 'Active Goals', value: statsData.active_goals, icon: '🎯', color: '#10b981', spark: [20, 30, 40, 60, 50, 80, 100] },
    { label: 'Total Reviews', value: statsData.pending_reviews, icon: '📊', color: '#f59e0b', spark: [100, 80, 60, 40, 60, 80, 100] },
    { label: 'Achievements', value: statsData.achievements, icon: '🏆', color: '#8b5cf6', spark: [10, 20, 40, 50, 70, 90, 100] },
  ]



  return (
    <div className="overview-container" style={{ width: '100%', paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Enterprise Welcome Hero ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: '24px', padding: '24px 32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px -10px rgba(30, 27, 75, 0.4)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '60%', height: '200%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', transform: 'rotate(-15deg)' }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome back, {firstName}! ✨
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Your enterprise career growth and team management command center. Track your progress, manage objectives, and drive success.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isProfileComplete && (
              <button onClick={() => onNavigate('My Profile')} style={{ background: '#fff', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>Complete Profile</button>
            )}
            <button onClick={() => onNavigate('Development')} style={{ background: isProfileComplete ? '#6366f1' : 'rgba(255,255,255,0.1)', color: '#fff', border: isProfileComplete ? 'none' : '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isProfileComplete ? '0 10px 25px -5px rgba(99, 102, 241, 0.4)' : 'none' }}>
              Add First Goal
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '160px', height: '160px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
            <div style={{ width: '110px', height: '110px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
              <span style={{ fontSize: '48px' }}>🚀</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Enterprise Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {stats.map((s, i) => (
           <KpiCard key={i} {...s} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* ── Left Column: Active Goals ── */}
        <div style={{ flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>Recent Active Goals</h2>
            <button onClick={() => onNavigate('Development')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>View All →</button>
          </div>
          
          {recentGoals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentGoals.slice(0, 2).map((goal, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '20px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 4px 12px -5px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-lift">
                  <RingProgress value={goal.progress_percentage} color={goal.progress_percentage === 100 ? '#10b981' : '#6366f1'} size={72} stroke={8} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{goal.title}</h3>
                      {goal.is_endorsed && <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, border: '1px solid #fcd34d' }}>⭐ Endorsed</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>{goal.description}</p>
                  </div>
                  <div style={{ color: '#cbd5e1' }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '60px 40px', background: '#f8fafc', borderRadius: '24px', textAlign: 'center', border: '2px dashed #e2e8f0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>No active goals</div>
              <div style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px' }}>Start planning your development to see your progress tracked here.</div>
              <button onClick={() => onNavigate('Development')} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Create Goal</button>
            </div>
          )}
        </div>

        {/* ── Right Column: Recent Reviews ── */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>Recent Reviews</h2>
            <button onClick={() => onNavigate('Performance Reviews')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>View All →</button>
          </div>
          
          {recentReviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentReviews.slice(0, 2).map((rev, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '20px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 12px -5px rgba(0,0,0,0.02)', transition: 'all 0.2s' }} className="hover-lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, overflow: 'hidden' }}>
                        {rev.reviewer?.profile_pic_url ? (
                          <img src={rev.reviewer.profile_pic_url} alt={rev.reviewer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          rev.reviewer?.name?.charAt(0) || 'M'
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{rev.reviewer?.name || 'Manager'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(rev.created_at || new Date()).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '4px 10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '14px', color: '#f59e0b' }}>★</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{rev.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    "{rev.feedback || 'No comments provided.'}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', background: '#f8fafc', borderRadius: '24px', textAlign: 'center', border: '2px dashed #e2e8f0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>No reviews yet</div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Your performance reviews and feedback will appear here.</div>
              <button onClick={() => onNavigate('Performance Reviews')} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>View Reviews</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

