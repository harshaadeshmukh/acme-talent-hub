import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  FormControl,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
} from '@mui/material'
import {
  StarRounded,
  TrendingUp,
  BarChart as BarChartIcon,
  Timeline,
  EmojiObjects,
  AutoAwesome,
  AutoFixHigh
} from '@mui/icons-material'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
  ReferenceArea
} from 'recharts'
import '../PerformanceReviewsPage.css' 
import './EnterpriseSection.css' 

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="es-stars">
      {[1,2,3,4,5].map(s => (
        <button
          key={s} type="button"
          className={`es-star ${(hovered || value) >= s ? 'es-star-on' : ''}`}
          onClick={() => !readonly && onChange(s)}
          onMouseEnter={() => !readonly && setHovered(s)}
          onMouseLeave={() => !readonly && setHovered(0)}
          disabled={readonly}
          style={{ cursor: readonly ? 'default' : 'pointer' }}
        >★</button>
      ))}
      {value > 0 && <span className="es-star-label">{value}/5</span>}
    </div>
  )
}

function Modal({ title, subtitle, onClose, children, wide, splitScreen }) {
  return (
    <div className="es-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`es-modal ${wide ? 'es-modal-wide' : ''}`} style={splitScreen ? { maxWidth: '1100px', width: '95%' } : {}}>
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

function NineBoxGrid({ employeeName, rating, potential, onSelectBox }) {
  let activeIndex = -1;
  if (rating > 0) {
    let col = 1;
    if (rating <= 2.5) col = 0;
    else if (rating >= 4.0) col = 2;
    let row = potential !== undefined ? potential : 1;
    activeIndex = row * 3 + col;
  }

  const boxes = [
    { label: 'Enigma', theme: 'purple' },
    { label: 'Growth', theme: 'blue' },
    { label: 'Future Leader', theme: 'teal' },
    { label: 'Dilemma', theme: 'orange' },
    { label: 'Core', theme: 'indigo' },
    { label: 'High Impact', theme: 'emerald' },
    { label: 'Risk', theme: 'red' },
    { label: 'Effective', theme: 'cyan' },
    { label: 'Trusted Pro', theme: 'green' },
  ]

  const getColors = (theme, isActive) => {
    const palette = {
      purple: { base: '#a855f7', light: '#d8b4fe', bg: 'rgba(168,85,247,0.1)' },
      blue: { base: '#3b82f6', light: '#93c5fd', bg: 'rgba(59,130,246,0.1)' },
      teal: { base: '#14b8a6', light: '#5eead4', bg: 'rgba(20,184,166,0.1)' },
      orange: { base: '#f97316', light: '#fdba74', bg: 'rgba(249,115,22,0.1)' },
      indigo: { base: '#6366f1', light: '#a5b4fc', bg: 'rgba(99,102,241,0.1)' },
      emerald: { base: '#10b981', light: '#6ee7b7', bg: 'rgba(16,185,129,0.1)' },
      red: { base: '#ef4444', light: '#fca5a5', bg: 'rgba(239,68,68,0.1)' },
      cyan: { base: '#06b6d4', light: '#67e8f9', bg: 'rgba(6,182,212,0.1)' },
      green: { base: '#22c55e', light: '#86efac', bg: 'rgba(34,197,94,0.1)' },
    };
    const p = palette[theme] || palette.indigo;
    
    if (isActive) {
      return {
        bg: `linear-gradient(135deg, ${p.base} 0%, rgba(255,255,255,0.1) 200%)`,
        border: `1px solid ${p.light}`,
        text: '#ffffff',
        shadow: `0 0 20px ${p.base}80, inset 0 0 12px rgba(255,255,255,0.4)`
      }
    }
    return {
      bg: p.bg,
      border: `1px solid rgba(255,255,255,0.05)`,
      text: p.light,
      shadow: 'none'
    }
  }

  return (
    <div style={{ marginTop: '30px', position: 'relative' }}>
      {/* Dynamic ambient backdrop */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', height: '120%', background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2))' }}></div>
          <span style={{ fontSize: '0.85rem', letterSpacing: '2px', fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Company Calibration (9-Box)</span>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.2))' }}></div>
        </div>

        <div style={{ display: 'flex', position: 'relative', padding: '10px' }}>
          <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
            <span style={{ opacity: 0.5 }}>Low</span> <span style={{ margin: '8px 0', color: '#cbd5e1' }}>← Potential →</span> <span style={{ color: '#6ee7b7' }}>High</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '12px', 
              background: 'rgba(15, 23, 42, 0.4)', 
              backdropFilter: 'blur(16px)',
              padding: '16px', 
              borderRadius: '24px', 
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)'
            }}>
              {boxes.map((box, i) => {
                const isActive = activeIndex === i;
                const colors = getColors(box.theme, isActive);
                
                return (
                  <div key={i} onClick={() => {
                    if (onSelectBox) {
                      const newPotential = Math.floor(i / 3);
                      const col = i % 3;
                      const newRating = col === 0 ? 2 : col === 1 ? 3 : 5;
                      onSelectBox(newRating, newPotential);
                    }
                  }}
                  style={{ 
                    cursor: onSelectBox ? 'pointer' : 'default',
                    background: colors.bg, 
                    color: colors.text,
                    border: colors.border,
                    padding: isActive ? '20px 8px' : '16px 8px', 
                    textAlign: 'center', 
                    fontSize: isActive ? '0.85rem' : '0.8rem', 
                    fontWeight: isActive ? 800 : 600,
                    borderRadius: '16px',
                    boxShadow: colors.shadow,
                    transform: isActive ? 'scale(1.08) translateY(-4px)' : 'none',
                    zIndex: isActive ? 10 : 1,
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    textShadow: isActive ? '0 2px 4px rgba(0,0,0,0.4)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Glass glare effect inside active box */}
                    {isActive && (
                      <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', transform: 'skewX(-20deg)', animation: 'glare 3s infinite' }} />
                    )}
                    
                    <div style={{ position: 'relative', zIndex: 2 }}>{box.label}</div>
                    
                    {isActive && (
                      <div style={{ 
                        fontSize: '0.7rem', 
                        background: 'rgba(255,255,255,0.2)', 
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontWeight: 700, 
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        position: 'relative',
                        zIndex: 2
                      }}>
                        {employeeName}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '16px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              <span style={{ opacity: 0.5 }}>Low</span> <span style={{ margin: '0 8px', color: '#cbd5e1' }}>← Performance →</span> <span style={{ color: '#6ee7b7' }}>High</span>
            </div>
          </div>
        </div>

        {rating === 0 && (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', marginTop: '16px', fontStyle: 'italic', background: 'rgba(15,23,42,0.5)', padding: '8px 16px', borderRadius: '20px', display: 'inline-block', left: '50%', position: 'relative', transform: 'translateX(-50%)', border: '1px solid rgba(255,255,255,0.05)' }}>
            Select a rating to calibrate employee on the grid.
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes glare {
          0% { left: -100% }
          20% { left: 200% }
          100% { left: 200% }
        }
      `}</style>
    </div>
  )
}

const frameworks = {
  sbi: {
    id: 'sbi',
    name: 'SBI Framework',
    color: '#4f46e5',
    bg: 'linear-gradient(to right, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
    activeBg: 'linear-gradient(to right, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
    borderColor: 'rgba(79, 70, 229, 0.3)',
    fields: [
      { id: 'situation', label: 'Situation', placeholder: 'When and where did this happen?' },
      { id: 'behavior', label: 'Behavior', placeholder: 'What observable actions did they take?' },
      { id: 'impact', label: 'Impact', placeholder: 'What was the result of their actions?' }
    ]
  },
  wwwebi: {
    id: 'wwwebi',
    name: 'WWW / EBI',
    color: '#0ea5e9',
    bg: 'linear-gradient(to right, rgba(14,165,233,0.05), rgba(56,189,248,0.05))',
    activeBg: 'linear-gradient(to right, rgba(14,165,233,0.15), rgba(56,189,248,0.15))',
    borderColor: 'rgba(14, 165, 233, 0.3)',
    fields: [
      { id: 'www', label: 'What Went Well', placeholder: 'List the things that went well...' },
      { id: 'ebi', label: 'Even Better If', placeholder: 'List areas for improvement...' }
    ]
  },
  goals: {
    id: 'goals',
    name: 'Goals & Growth',
    color: '#10b981',
    bg: 'linear-gradient(to right, rgba(16,185,129,0.05), rgba(52,211,153,0.05))',
    activeBg: 'linear-gradient(to right, rgba(16,185,129,0.15), rgba(52,211,153,0.15))',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    fields: [
      { id: 'accomplishments', label: 'Key Accomplishments', placeholder: 'Major wins and milestones...' },
      { id: 'growth', label: 'Growth Areas', placeholder: 'Areas to develop further...' },
      { id: 'goals', label: 'Next Period Goals', placeholder: 'Goals for the upcoming cycle...' }
    ]
  }
};

export default function ManagerReviewsSection() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [allCompanyReviews, setAllCompanyReviews] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [filterYear, setFilterYear] = useState('All')
  const [filterCycle, setFilterCycle] = useState('All')
  const [filterEmployee, setFilterEmployee] = useState(null)

  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [reviewCycle, setReviewCycle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [evaluateTarget, setEvaluateTarget] = useState(null)
  const [rating, setRating] = useState(0)
  const [potential, setPotential] = useState(1)
  const [feedback, setFeedback] = useState('')
  const [activeFramework, setActiveFramework] = useState(null)
  const [frameworkData, setFrameworkData] = useState({})
  const [hoveredTier, setHoveredTier] = useState(null)

  const headers = useCallback(() => ({ 'Authorization': `Bearer ${localStorage.getItem('acme_token')}`, 'Content-Type': 'application/json' }), [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rRes, uRes] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/reviews', { headers: headers() }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users',   { headers: headers() })
      ])
      if (!rRes.ok || !uRes.ok) throw new Error('Failed to load review data')
      const allReviews = await rRes.json()
      const allUsers   = await uRes.json()
      
      const myTeamUserIds = allUsers
        .filter(u => u.department === user.department && u.id !== user.id)
        .map(u => u.id)

      setReviews(allReviews.filter(r => myTeamUserIds.includes(r.employee_id)))
      setAllCompanyReviews(allReviews)
      setUsers(allUsers)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user.id, user.department, headers])

  useEffect(() => { 
    setTimeout(() => fetchData(), 0);
    const handleUpdate = () => fetchData();
    window.addEventListener('app-update', handleUpdate);
    return () => window.removeEventListener('app-update', handleUpdate);
  }, [fetchData])

  const getUserName = (id) => users.find(u => u.id === id)?.name || 'Unknown'
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2)

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!selectedEmployee) return
    setSubmitting(true)
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/reviews/', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          employee_id: parseInt(selectedEmployee),
          reviewer_id: user.id,
          rating: 0, feedback: '',
          review_period: reviewCycle
        })
      })
      setAssignOpen(false)
      setSelectedEmployee('')
      fetchData()
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const handleEvaluate = async (e) => {
    e.preventDefault()
    if (!rating) return
    setSubmitting(true)

    let finalFeedback = feedback;
    if (activeFramework) {
      const fw = frameworks[activeFramework];
      finalFeedback = fw.fields.map(f => `${f.label}:\n${frameworkData[f.id] || ''}`).join('\n\n');
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/reviews/${evaluateTarget.id}`, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ rating, feedback: finalFeedback, review_period: evaluateTarget.review_period })
      })
      setEvaluateTarget(null)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  // Formatting for the UI
  const formattedReviews = reviews.map(r => ({
    ...r,
    employeeName: getUserName(r.employee_id),
    employeeAvatar: users.find(u => u.id === r.employee_id)?.profile_pic_url,
    date: new Date(r.created_at).toISOString().split('T')[0],
  }))

  const availableYears = Array.from(new Set(formattedReviews.map(r => r.date.substring(0, 4)))).sort().reverse()
  const uniqueEmployees = Array.from(new Set([
    ...formattedReviews.map(r => r.employeeName),
    ...users.filter(u => u.department === user.department && u.id !== user.id).map(u => u.name)
  ])).filter(Boolean).sort()

  const filteredReviews = formattedReviews.filter(r => {
    const yearMatch = filterYear === 'All' || r.date.startsWith(filterYear)
    const cycleMatch = filterCycle === 'All' || (r.review_period && r.review_period.includes(filterCycle))
    const employeeMatch = !filterEmployee || r.employeeName === filterEmployee
    return yearMatch && cycleMatch && employeeMatch
  })

  const completedReviews = reviews.filter(r => r.rating > 0)
  const pendingReviews = reviews.filter(r => r.rating === 0 || !r.rating)
  
  const averageRating = completedReviews.length > 0 
    ? completedReviews.reduce((sum, r) => sum + r.rating, 0) / completedReviews.length 
    : 0
    
  // Calculate real company average from all completed company reviews
  const completedCompanyReviews = allCompanyReviews.filter(r => r.rating > 0)
  const companyAverage = completedCompanyReviews.length > 0 
    ? parseFloat((completedCompanyReviews.reduce((sum, r) => sum + r.rating, 0) / completedCompanyReviews.length).toFixed(1))
    : 0 

  // For the chart, show individual employees' average ratings to match the employee dashboard
  const employeeStatsMap = {}
  completedReviews.forEach(r => {
    const empName = getUserName(r.employee_id)
    if (!employeeStatsMap[empName]) {
      employeeStatsMap[empName] = {
        name: empName.split(' ')[0], // First name for cleaner X-axis
        fullName: empName,
        sum: 0,
        count: 0
      }
    }
    employeeStatsMap[empName].sum += r.rating
    employeeStatsMap[empName].count += 1
  })
  
  const chartData = Object.values(employeeStatsMap).map(emp => ({
    name: emp.name,
    fullName: emp.fullName,
    rating: parseFloat((emp.sum / emp.count).toFixed(1)),
    companyAvg: companyAverage
  })).sort((a, b) => b.rating - a.rating)

  const topPerformers = chartData.slice(0, 3)
  const needsAttention = [...chartData].reverse().filter(emp => emp.rating < 3.5).slice(0, 3)

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading reviews...</div>

  return (
    <div className="perf-page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Premium Hero Header */}
      <div style={{
        backgroundColor: '#0f1117',
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        borderRadius: '16px', padding: '18px 22px',
        marginBottom: '24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '500', letterSpacing: '0.04em' }}>
              ⬡ Manager Dashboard / <span style={{ color: 'rgba(255,255,255,0.6)' }}>Review Center</span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0', letterSpacing: '-0.02em' }}>
              Performance Reviews
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0' }}>
              Manage team evaluations and calibrate against company benchmarks.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                if (formattedReviews.length === 0) {
                  alert("No reviews available to export.");
                  return;
                }
                const csvContent = "data:text/csv;charset=utf-8," 
                  + "Employee,Date,Period,Rating,Review\n" 
                  + formattedReviews.map(r => `"${r.employeeName}","${r.date}","${r.review_period || ''}",${r.rating},"${(r.feedback||'').replace(/"/g, '""')}"`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "team_reviews_report.csv");
                document.body.appendChild(link);
                link.click();
              }}
              style={{ 
                background: 'rgba(255,255,255,0.1)', 
                color: formattedReviews.length === 0 ? 'rgba(255,255,255,0.4)' : '#fff', 
                border: '1px solid rgba(255,255,255,0.2)', 
                padding: '10px 16px', 
                borderRadius: '8px', 
                fontWeight: 600, 
                cursor: formattedReviews.length === 0 ? 'not-allowed' : 'pointer', 
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '8px',
                opacity: formattedReviews.length === 0 ? 0.6 : 1
              }}
              disabled={formattedReviews.length === 0}
              onMouseEnter={(e) => { if(formattedReviews.length > 0) e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { if(formattedReviews.length > 0) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Export Report
            </button>
            <button 
              onClick={() => setAssignOpen(true)}
              style={{ 
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                color: '#fff', border: 'none', padding: '10px 20px', 
                borderRadius: '8px', fontWeight: 600, cursor: 'pointer', 
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)'; }}
            >
              + Assign Review
            </button>
          </div>
        </div>
      </div>

      {/* Top Section - Overview & Actionable Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Stats - Horizontal */}
        <div className="perf-premium-card" style={{ height: '100%', marginBottom: 0 }}>
          <div className="perf-section-title">Overview</div>
          <div className="perf-metric-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div className="perf-metric-box" style={{ padding: '20px 16px' }}>
              <div className="perf-metric-label">Average Rating Given</div>
              <div className="perf-metric-value">{averageRating.toFixed(1)}</div>
              <div className="perf-stat-sub">Across all evaluations</div>
            </div>
            <div className="perf-metric-box" style={{ padding: '20px 16px' }}>
              <div className="perf-metric-label">Total Reviews</div>
              <div className="perf-metric-value">{completedReviews.length}</div>
              <div className="perf-stat-sub">Completed cycles</div>
            </div>
            <div className="perf-metric-box" style={{ padding: '20px 16px', background: pendingReviews.length > 0 ? '#fffbeb' : '#f8fafc', borderColor: pendingReviews.length > 0 ? '#fde68a' : '#f1f5f9' }}>
              <div className="perf-metric-label">Pending Reviews</div>
              <div className="perf-metric-value" style={{ color: pendingReviews.length > 0 ? '#d97706' : '#0f172a' }}>{pendingReviews.length}</div>
              <div className="perf-stat-sub">Awaiting evaluation</div>
            </div>
          </div>

          {/* New Performance Distribution Visualization */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Team Performance Distribution
              </div>
            </div>
            
            {(() => {
              const dist = { elite: [], high: [], core: [], risk: [] };
              chartData.forEach(emp => {
                if (emp.rating >= 4.5) dist.elite.push(emp.fullName);
                else if (emp.rating >= 3.5) dist.high.push(emp.fullName);
                else if (emp.rating >= 2.5) dist.core.push(emp.fullName);
                else dist.risk.push(emp.fullName);
              });
              const totalDist = chartData.length || 1;
              const tierLabels = { elite: 'Elite (≥4.5)', high: 'High (3.5-4.4)', core: 'Core (2.5-3.4)', risk: 'Risk (<2.5)' };
              const tierColors = { elite: '#10b981', high: '#3b82f6', core: '#8b5cf6', risk: '#f59e0b' };

              return chartData.length > 0 ? (
                <div style={{ position: 'relative' }} onMouseLeave={() => setHoveredTier(null)}>
                  <div style={{ display: 'flex', height: '14px', borderRadius: '8px', overflow: 'hidden', gap: '2px', marginBottom: '16px' }}>
                    {dist.elite.length > 0 && <div onMouseEnter={() => setHoveredTier('elite')} style={{ width: `${(dist.elite.length/totalDist)*100}%`, background: '#10b981', transition: 'width 1s ease-in-out', cursor: 'pointer' }} />}
                    {dist.high.length > 0 && <div onMouseEnter={() => setHoveredTier('high')} style={{ width: `${(dist.high.length/totalDist)*100}%`, background: '#3b82f6', transition: 'width 1s ease-in-out', cursor: 'pointer' }} />}
                    {dist.core.length > 0 && <div onMouseEnter={() => setHoveredTier('core')} style={{ width: `${(dist.core.length/totalDist)*100}%`, background: '#8b5cf6', transition: 'width 1s ease-in-out', cursor: 'pointer' }} />}
                    {dist.risk.length > 0 && <div onMouseEnter={() => setHoveredTier('risk')} style={{ width: `${(dist.risk.length/totalDist)*100}%`, background: '#f59e0b', transition: 'width 1s ease-in-out', cursor: 'pointer' }} />}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 10, height: 10, borderRadius: '3px', background: '#10b981' }} /> Elite ≥4.5 ({dist.elite.length})</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 10, height: 10, borderRadius: '3px', background: '#3b82f6' }} /> High 3.5-4.4 ({dist.high.length})</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 10, height: 10, borderRadius: '3px', background: '#8b5cf6' }} /> Core 2.5-3.4 ({dist.core.length})</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 10, height: 10, borderRadius: '3px', background: '#f59e0b' }} /> Risk &lt;2.5 ({dist.risk.length})</div>
                  </div>

                  {/* Premium Custom Tooltip */}
                  {hoveredTier && dist[hoveredTier].length > 0 && (
                    <div style={{
                      position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px',
                      padding: '12px 16px', zIndex: 100, minWidth: '180px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                      animation: 'achModalIn 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '3px', background: tierColors[hoveredTier] }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>{tierLabels[hoveredTier]}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{dist[hoveredTier].length}</span>
                      </div>
                      <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                        {dist[hoveredTier].map((name, idx) => (
                          <div key={idx} style={{ fontSize: '0.8rem', color: '#475569', padding: '3px 0', fontWeight: 500 }}>
                            • {name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', background: '#f8fafc', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  Complete reviews to see team distribution
                </div>
              );
            })()}
          </div>
        </div>

        {/* Actionable Insights Widget */}
        <div className="perf-premium-card" style={{ height: '100%', marginBottom: 0 }}>
          <div className="perf-section-title">Actionable Insights</div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              🏆 Top Performers
            </div>
            {topPerformers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topPerformers.map((emp, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{emp.fullName}</span>
                    <span style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>{emp.rating.toFixed(1)} <StarRounded style={{ fontSize: '14px' }}/></span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No ratings available yet.</div>
            )}
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              💡 Needs Support
            </div>
            {needsAttention.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {needsAttention.map((emp, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{emp.fullName}</span>
                    <span style={{ fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>{emp.rating.toFixed(1)} <StarRounded style={{ fontSize: '14px' }}/></span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                All team members are performing well!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Chart - Full Width */}
      {completedReviews.length > 0 && (
        <div className="perf-premium-card" style={{ marginBottom: '32px' }}>
          <div className="perf-section-title">Team Performance</div>
          <div style={{ height: '300px', width: '100%', marginTop: '32px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 30 }}>
                <defs>
                  <linearGradient id="premiumBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7}/>
                  </linearGradient>
                  <linearGradient id="benchmarkBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.12}/>
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dy={16} />
                <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', padding: '12px', zIndex: 1000 }}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                />
                
                {/* Premium Benchmark Zone */}
                {companyAverage > 0 && (
                  <ReferenceLine 
                    y={companyAverage} 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    strokeOpacity={0.8}
                    label={({ viewBox }) => (
                      <g>
                        {/* Pill Badge Background */}
                        <rect 
                          x={viewBox.x + viewBox.width - 220} 
                          y={viewBox.y - 14} 
                          width="210" 
                          height="28" 
                          rx="14" 
                          fill="#fef3c7" 
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                        />
                        {/* Label Text */}
                        <text 
                          x={viewBox.x + viewBox.width - 115} 
                          y={viewBox.y + 4} 
                          fill="#b45309" 
                          fontSize="11" 
                          fontWeight="800" 
                          textAnchor="middle" 
                          letterSpacing="0.5px"
                        >
                          ✦ COMPANY BENCHMARK: {companyAverage.toFixed(1)}
                        </text>
                      </g>
                    )}
                  />
                )}

                <Bar dataKey="rating" name="Average Rating" fill="url(#premiumBar)" radius={[6, 6, 0, 0]} barSize={36} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Review History */}
      <div className="perf-reviews-header">
        <div className="perf-section-title" style={{ marginBottom: 0 }}>Team Reviews</div>
        <div className="perf-filters" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Autocomplete
            size="small"
            options={uniqueEmployees}
            value={filterEmployee}
            onChange={(e, newValue) => setFilterEmployee(newValue)}
            renderInput={(params) => <TextField {...params} placeholder="Search Employee..." variant="outlined" />}
            style={{ width: 220, background: '#fff', borderRadius: '8px' }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', '& fieldset': { borderColor: '#e2e8f0' } } }}
          />
          <FormControl size="small" variant="outlined">
            <Select className="perf-filter-select" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} displayEmpty>
              <MenuItem value="All">All Years</MenuItem>
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" variant="outlined">
            <Select className="perf-filter-select" value={filterCycle} onChange={(e) => setFilterCycle(e.target.value)} displayEmpty>
              <MenuItem value="All">All Cycles</MenuItem>
              <MenuItem value="Q1">Q1</MenuItem>
              <MenuItem value="Q2">Q2</MenuItem>
              <MenuItem value="Q3">Q3</MenuItem>
              <MenuItem value="Q4">Q4</MenuItem>
              <MenuItem value="Annual">Annual</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

          {filteredReviews.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginTop: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ color: '#334155', marginBottom: '8px', fontSize: '1.25rem' }}>No Reviews Found</h3>
          <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
            {filterEmployee 
              ? `There are no performance reviews on record for ${filterEmployee}.`
              : "No reviews match your current filter criteria."}
          </p>
        </div>
      ) : (
        <div className="perf-reviews-grid">
          {filteredReviews.map((review) => (
            <div className="perf-review-item" key={review.id}>
              <div className="perf-review-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="perf-review-tag">{review.review_period}</span>
                  <span className="perf-review-date">{new Date(review.date).toLocaleDateString()}</span>
                </div>
                {review.rating > 0 && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => { setEvaluateTarget(review); setRating(review.rating); setPotential(1); setFeedback(review.feedback); setActiveFramework(null); setFrameworkData({}); }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                      title="Edit Review"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button 
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this review?")) {
                          try {
                            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/reviews/${review.id}`, { method: 'DELETE', headers: headers() });
                            if (res.ok) fetchData();
                          } catch (err) { console.error(err); }
                        }
                      }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                      title="Delete Review"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="perf-reviewer-info">
                <div className="perf-reviewer-left">
                  {review.employeeAvatar ? (
                    <img src={review.employeeAvatar} alt={review.employeeName} className="perf-avatar" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="perf-avatar" style={{ background: '#6366f1' }}>
                      {getInitials(review.employeeName)}
                    </div>
                  )}
                  <div className="perf-reviewer-name">{review.employeeName}</div>
                </div>
                {review.rating > 0 && (
                  <div className="perf-review-rating">
                    {review.rating.toFixed(1)}
                    <StarRounded className="perf-star-icon" />
                  </div>
                )}
              </div>
              
              <div className="perf-review-text" style={{ fontStyle: review.rating > 0 ? 'normal' : 'italic', color: review.rating > 0 ? '#475569' : '#94a3b8' }}>
                {review.rating > 0 ? review.feedback : 'Pending evaluation...'}
              </div>

              {review.rating === 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <button 
                    onClick={() => { setEvaluateTarget(review); setRating(0); setPotential(1); setFeedback(''); setActiveFramework(null); setFrameworkData({}); }}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px', fontWeight: 600, color: '#0f172a', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                  >
                    Complete Evaluation
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assign Modal */}
      {assignOpen && (
        <Modal title="Assign Performance Review" subtitle="Select an employee and review period" onClose={() => setAssignOpen(false)}>
          <form onSubmit={handleAssign}>
            <div className="es-field" style={{ marginBottom: '20px' }}>
              <label className="es-field-label">Select Employee (Searchable) <span className="es-required">*</span></label>
              <Autocomplete
                options={users.filter(u => u.id !== user.id && u.department === user.department)}
                getOptionLabel={(option) => `${option.name} (${option.department})`}
                value={users.find(u => u.id.toString() === selectedEmployee.toString()) || null}
                onChange={(e, newValue) => setSelectedEmployee(newValue ? newValue.id : '')}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    placeholder="Search by name..." 
                    required 
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', background: '#fff' } }}
                  />
                )}
                noOptionsText="No employees found in your department"
              />
            </div>
            <div className="es-field">
              <label className="es-field-label">Review Cycle (e.g., Q2 2026, Annual 2027) <span className="es-required">*</span></label>
              <input 
                type="text" 
                className="es-input" 
                required 
                placeholder="Type the review period here..."
                value={reviewCycle} 
                onChange={e => setReviewCycle(e.target.value.toUpperCase())} 
              />
            </div>
            <div className="es-modal-footer" style={{ marginTop: '32px' }}>
              <button type="button" className="es-btn es-btn-ghost" onClick={() => setAssignOpen(false)}>Cancel</button>
              <button type="submit" className="es-btn es-btn-primary" disabled={submitting || !selectedEmployee}>
                {submitting ? 'Assigning…' : 'Assign Review'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Advanced Split-Screen Evaluate Modal */}
      {evaluateTarget && (
        <Modal
          title={`Evaluate ${getUserName(evaluateTarget.employee_id)}`}
          subtitle={`Advanced Company Calibration · ${evaluateTarget.review_period}`}
          onClose={() => setEvaluateTarget(null)}
          wide
          splitScreen
        >
          <div className="evaluate-split-layout">
            
            {/* Left Side: Premium Advanced Analytics Panel */}
            <div style={{ flex: '1', background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', color: '#fff', border: '1px solid #334155', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
              {/* Decorative background glow */}
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(99, 102, 241, 0.2)', filter: 'blur(50px)', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'rgba(16, 185, 129, 0.15)', filter: 'blur(50px)', borderRadius: '50%' }}></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
                <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <Timeline style={{ color: '#fff', fontSize: '1.2rem' }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700, letterSpacing: '0.5px' }}>Advanced Context</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 2 }}>
                {/* Real Data Metric: Historical Average */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
                    <TrendingUp fontSize="small" style={{ color: '#fbbf24' }} /> Past Performance
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    {(() => {
                      const past = allCompanyReviews.filter(r => r.employee_id === evaluateTarget.employee_id && r.rating > 0);
                      if (past.length === 0) {
                        return <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontStyle: 'italic' }}>First review for this employee</span>;
                      }
                      const avg = (past.reduce((sum, r) => sum + r.rating, 0) / past.length).toFixed(1);
                      return (
                        <>
                          <span style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800, textShadow: '0 2px 10px rgba(255,255,255,0.2)' }}>{avg}/5</span>
                          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Historical Average</span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Metric 3: Premium 9-Box Grid */}
                <NineBoxGrid 
                  employeeName={getUserName(evaluateTarget.employee_id).split(' ')[0]} 
                  rating={rating} 
                  potential={potential}
                  onSelectBox={(r, p) => { setRating(r); setPotential(p); }}
                />
              </div>
            </div>

            {/* Right Side: Premium Evaluation Form */}
            <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <form onSubmit={handleEvaluate} style={{ background: '#f8fafc', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                
                {/* Rating Field */}
                <div className="es-field" style={{ marginBottom: '24px' }}>
                  <label className="es-field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Performance Rating <span className="es-required">*</span></span>
                  </label>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <StarRating value={rating} onChange={setRating} />
                    <div style={{ fontWeight: 600, color: rating > 0 ? '#10b981' : '#94a3b8', fontSize: '0.85rem' }}>
                      {['Select Rating','Needs Improvement','Below Expectations','Meets Expectations','Exceeds Expectations','Outstanding'][rating] || 'Pending'}
                    </div>
                  </div>
                </div>
                
                {/* Feedback Field */}
                <div className="es-field">
                  <label className="es-field-label" style={{ marginBottom: '12px', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Detailed Feedback <span className="es-required">*</span></span>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: feedback.length > 20 ? 'flex' : 'none', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                      Tone: Constructive & Professional
                    </span>
                  </label>
                  
                  {/* Premium Smart Chips */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginRight: '4px' }}>Smart Frameworks:</span>
                    {Object.values(frameworks).map(fw => (
                      <button key={fw.id} type="button" onClick={() => { setActiveFramework(fw.id); setFrameworkData({}); }} 
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600, color: fw.color, borderRadius: '20px', border: `1px solid ${fw.borderColor}`, background: activeFramework === fw.id ? fw.activeBg : fw.bg, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} 
                        onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 4px 8px ${fw.borderColor}`}} 
                        onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 4px rgba(0,0,0,0.02)'}}>
                        <AutoFixHigh style={{ fontSize: '14px' }}/> {fw.name}
                      </button>
                    ))}
                    {activeFramework && (
                      <button type="button" onClick={() => setActiveFramework(null)} style={{ fontSize: '0.75rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginLeft: 'auto' }}>
                        Clear Framework
                      </button>
                    )}
                  </div>

                  {activeFramework ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f1f5f9', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      {frameworks[activeFramework].fields.map(f => (
                        <div key={f.id}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>{f.label}</label>
                          <textarea
                            className="es-input es-textarea" required rows={3}
                            style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', fontSize: '0.9rem', lineHeight: '1.4', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            placeholder={f.placeholder}
                            value={frameworkData[f.id] || ''} 
                            onChange={e => setFrameworkData({ ...frameworkData, [f.id]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      className="es-input es-textarea" required rows={7}
                      style={{ background: '#fff', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', borderRadius: '12px', padding: '16px', fontSize: '0.9rem', lineHeight: '1.5', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      placeholder="Provide specific, constructive feedback about this employee's performance this cycle…"
                      value={feedback} onChange={e => setFeedback(e.target.value)}
                    />
                  )}
                </div>
                <div className="es-modal-footer" style={{ marginTop: '24px' }}>
                  <button type="button" className="es-btn es-btn-ghost" onClick={() => setEvaluateTarget(null)}>Cancel</button>
                  <button type="submit" className="es-btn es-btn-primary" disabled={submitting || !rating || (!activeFramework && !feedback.trim()) || (activeFramework && Object.values(frameworkData).join('').trim() === '')}>
                    {submitting ? 'Submitting…' : 'Submit Evaluation'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </Modal>
      )}
    </div>
  )
}
