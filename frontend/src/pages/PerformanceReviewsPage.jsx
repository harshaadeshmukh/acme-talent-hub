import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  FormControl,
  Select,
  MenuItem,
} from '@mui/material'
import {
  StarRounded
} from '@mui/icons-material'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import './PerformanceReviewsPage.css'



export default function PerformanceReviewsPage() {
  const { user, token } = useAuth()
  const [filterYear, setFilterYear] = useState('All')
  const [filterCycle, setFilterCycle] = useState('All')
  const [reviews, setReviews] = useState([])
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true)



  useEffect(() => {
    if (!user || !token) return;
    const fetchReviews = async () => {
      try {
        const [res, usersRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/reviews/employee/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        if (res.ok && usersRes.ok) {
          const data = await res.json();
          const usersData = await usersRes.json();
          const formatted = data.map(r => {
            const reviewer = usersData.find(u => u.id === r.reviewer_id);
            return {
              id: r.id,
              employeeId: r.employee_id,
              reviewerName: reviewer ? reviewer.name : `Manager ID: ${r.reviewer_id}`,
              reviewerRole: reviewer ? reviewer.role.charAt(0).toUpperCase() + reviewer.role.slice(1) : 'Manager',
              reviewerAvatar: reviewer ? reviewer.profile_pic_url : null,
              rating: r.rating,
              feedback: r.feedback || 'No feedback provided.',
              reviewPeriod: r.review_period || 'Evaluation',
              date: new Date(r.created_at).toISOString().split('T')[0],
            };
          });
          setReviews(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch reviews', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
    const handleUpdate = () => fetchReviews();
    window.addEventListener('app-update', handleUpdate);
    return () => window.removeEventListener('app-update', handleUpdate);
  }, [user, token]);

  // Filter reviews based on selected filters
  const filteredReviews = reviews.filter(review => {
    const yearMatch = filterYear === 'All' || review.date.startsWith(filterYear)
    const cycleMatch = filterCycle === 'All' || review.reviewPeriod.includes(filterCycle)
    return yearMatch && cycleMatch
  })

  // Extract unique available years from reviews data
  const availableYears = Array.from(new Set(reviews.map(r => r.date.substring(0, 4)))).sort().reverse()

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  // Group reviews by period to average multiple ratings in the same period
  const periodMap = {}
  reviews.forEach(r => {
    if (!periodMap[r.reviewPeriod]) {
      periodMap[r.reviewPeriod] = { sum: 0, count: 0 }
    }
    periodMap[r.reviewPeriod].sum += r.rating
    periodMap[r.reviewPeriod].count += 1
  })

  // Prepare chart data and sort chronologically
  const chartData = Object.keys(periodMap).map(period => ({
    period: period,
    rating: parseFloat((periodMap[period].sum / periodMap[period].count).toFixed(1)),
  })).sort((a, b) => {
    const matchA = a.period.match(/(\d{4})/)
    const matchB = b.period.match(/(\d{4})/)
    const yearA = matchA ? parseInt(matchA[0]) : 0
    const yearB = matchB ? parseInt(matchB[0]) : 0
    if (yearA !== yearB) return yearA - yearB;
    return a.period.localeCompare(b.period)
  })

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  }

  return (
    <div className="perf-page-container">
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
              ⬡ Employee Dashboard / <span style={{ color: 'rgba(255,255,255,0.6)' }}>Review Center</span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0', letterSpacing: '-0.02em' }}>
              Performance Reviews
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0' }}>
              {user?.first_name ? `${user.first_name}, track your performance history and growth over time.` : 'Track your performance history and growth over time.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats - Horizontal */}
      <div className="perf-premium-card" style={{ marginBottom: '24px' }}>
        <div className="perf-section-title">Overview</div>
        <div className="perf-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="perf-metric-box">
            <div className="perf-metric-label">Average Rating</div>
            <div className="perf-metric-value">{averageRating.toFixed(1)}</div>
            <div className="perf-stat-sub">Across all evaluations</div>
          </div>
          <div className="perf-metric-box">
            <div className="perf-metric-label">Total Reviews</div>
            <div className="perf-metric-value">{reviews.length}</div>
            <div className="perf-stat-sub">Completed cycles</div>
          </div>
          <div className="perf-metric-box">
            <div className="perf-metric-label">Latest Review</div>
            <div className="perf-metric-value" style={{ fontSize: '1.5rem', marginTop: '8px' }}>{reviews.length > 0 ? reviews[0].reviewPeriod : '—'}</div>
            <div className="perf-stat-sub">{reviews.length > 0 ? new Date(reviews[0].date).toLocaleDateString() : '—'}</div>
          </div>
        </div>
      </div>

      {/* Chart - Full Width */}
      <div className="perf-premium-card" style={{ marginBottom: '32px' }}>
        <div className="perf-section-title">Performance Trend</div>
        <div style={{ height: '300px', width: '100%', marginTop: '32px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 30 }} barSize={32}>
              <defs>
                <linearGradient id="premiumEmpBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dy={16} />
              <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', padding: '12px', zIndex: 1000 }}
                labelStyle={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Bar dataKey="rating" fill="url(#premiumEmpBar)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Review History */}
      <div className="perf-reviews-header">
        <div className="perf-section-title" style={{ marginBottom: 0 }}>Review History</div>
        
        <div className="perf-filters">
          <FormControl size="small" variant="outlined">
            <Select
              className="perf-filter-select"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              displayEmpty
            >
              <MenuItem value="All">All Years</MenuItem>
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" variant="outlined">
            <Select
              className="perf-filter-select"
              value={filterCycle}
              onChange={(e) => setFilterCycle(e.target.value)}
              displayEmpty
            >
              <MenuItem value="All">All Cycles</MenuItem>
              <MenuItem value="Q1">Q1</MenuItem>
              <MenuItem value="Q2">Q2</MenuItem>
              <MenuItem value="Q3">Q3</MenuItem>
              <MenuItem value="Q4">Q4</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      <div className="perf-reviews-grid">
        {filteredReviews.map((review) => (
          <div className="perf-review-item" key={review.id}>
            <div className="perf-review-meta">
              <span className="perf-review-tag">{review.reviewPeriod}</span>
              <span className="perf-review-date">Submitted {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            
            <div className="perf-reviewer-info">
              <div className="perf-reviewer-left">
                {review.reviewerAvatar ? (
                  <img 
                    src={review.reviewerAvatar.startsWith('http') ? review.reviewerAvatar : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${review.reviewerAvatar}`} 
                    alt={review.reviewerName} 
                    className="perf-avatar" 
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '';
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="perf-avatar" 
                  style={{ display: review.reviewerAvatar ? 'none' : 'flex' }}
                >
                  {getInitials(review.reviewerName)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="perf-reviewer-name" style={{ lineHeight: '1.2' }}>{review.reviewerName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>{review.reviewerRole}</div>
                </div>
              </div>
              <div className="perf-review-rating">
                {review.rating.toFixed(1)}
                <StarRounded className="perf-star-icon" />
              </div>
            </div>
            
            <div className="perf-review-text">
              {review.feedback}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}