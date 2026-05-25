import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Rating,
  Select, MenuItem, FormControl, InputLabel, Divider
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';

export default function PerformanceReviewsSection() {
  const { user, token } = useAuth();
  const [filterYear, setFilterYear] = useState('All');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/reviews/employee/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map(r => ({
            id: r.id,
            date: new Date(r.created_at).toISOString().split('T')[0],
            period: r.review_period || 'Evaluation',
            rating: r.rating,
            reviewer: `Manager ID: ${r.reviewer_id}`,
            feedback: r.feedback || 'No feedback provided.'
          }));
          setReviews(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch performance reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [user, token]);

  const parsePeriod = (period, dateStr) => {
    const p = String(period || '').toLowerCase();
    const yearMatch = p.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : (dateStr ? parseInt(dateStr.substring(0, 4), 10) : 0);
    let weight = 0;
    if (p.includes('q1')) weight = 1;
    else if (p.includes('q2')) weight = 2;
    else if (p.includes('q3')) weight = 3;
    else if (p.includes('q4')) weight = 4;
    else if (p.includes('annual')) weight = 5;
    return year * 10 + weight;
  };

  const filteredReviews = useMemo(() => {
    // Sort descending (newest first) for the list
    let revs = [...reviews].sort((a, b) => parsePeriod(b.period, b.date) - parsePeriod(a.period, a.date));
    if (filterYear !== 'All') {
      revs = revs.filter(r => r.date.startsWith(filterYear) || (r.period && r.period.includes(filterYear)));
    }
    return revs;
  }, [filterYear, reviews]);

  const chartData = useMemo(() => {
    // Sort ascending (oldest first) for the trend chart
    return [...reviews].sort((a, b) => parsePeriod(a.period, a.date) - parsePeriod(b.period, b.date)).map(r => ({
      name: r.period,
      Rating: r.rating
    }));
  }, [reviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const years = useMemo(() => {
    const y = new Set(reviews.map(r => {
      const match = String(r.period || '').match(/\d{4}/);
      return match ? match[0] : r.date.substring(0, 4);
    }));
    return ['All', ...Array.from(y).sort().reverse()];
  }, [reviews]);

  if (loading) {
    return <Box sx={{ p: { xs: 2, md: 3 }, textAlign: 'center', py: 10 }}><Typography color="text.secondary">Loading performance reviews...</Typography></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, fontFamily: "'DM Sans', sans-serif" }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, color: '#0f1117', mb: 0.5 }}>
            Performance Reviews
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your ratings, feedback, and improvement over time
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'background.paper' }}>
          <InputLabel>Filter by Year</InputLabel>
          <Select
            value={filterYear}
            label="Filter by Year"
            onChange={(e) => setFilterYear(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <AssessmentIcon sx={{ fontSize: 40, color: '#6366f1', mb: 1 }} />
              <Typography variant="h3" sx={{ fontWeight: 700, fontFamily: "'DM Serif Display', serif", color: '#0f1117' }}>
                {averageRating}
              </Typography>
              <Rating value={parseFloat(averageRating)} precision={0.1} readOnly size="large" sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Overall Average Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ThumbUpAltOutlinedIcon sx={{ color: '#10b981' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Top Strengths</Typography>
              </Box>
              <ul style={{ paddingLeft: 20, margin: 0, color: '#4b5563', fontSize: '14px', lineHeight: 1.8 }}>
                <li>Strong technical problem solving</li>
                <li>Reliable project delivery</li>
                <li>Adaptability to new tools</li>
              </ul>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BuildCircleOutlinedIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Areas for Improvement</Typography>
              </Box>
              <ul style={{ paddingLeft: 20, margin: 0, color: '#4b5563', fontSize: '14px', lineHeight: 1.8 }}>
                <li>Leading cross-team meetings</li>
                <li>Proactive communication</li>
                <li>Mentoring junior peers</li>
              </ul>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Chart */}
      <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3, mb: 4, pt: 2, pb: 3, px: 2 }}>
        <Typography variant="h6" sx={{ px: 2, mb: 3, fontWeight: 600 }}>Performance Trend</Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
              <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="Rating" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* Review History */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Review History</Typography>
      <Grid container spacing={3}>
        {filteredReviews.length === 0 ? (
           <Grid item xs={12}>
             <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No reviews found for the selected filter.</Typography>
           </Grid>
        ) : (
          filteredReviews.map((review) => (
            <Grid item xs={12} key={review.id}>
              <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3, transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' } }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" sx={{ color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}>{review.period}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f1117' }}>{review.rating.toFixed(1)}</Typography>
                        <Rating value={review.rating} precision={0.1} readOnly size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Date: {review.date}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={9}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                        <Chip size="small" label={`Reviewer: ${review.reviewer}`} sx={{ bgcolor: '#f3f4f6', color: '#374151', fontWeight: 500 }} />
                        <Chip size="small" label={review.rating >= 4 ? 'Exceeds Expectations' : review.rating >= 3 ? 'Meets Expectations' : 'Needs Improvement'} color={review.rating >= 4 ? 'success' : review.rating >= 3 ? 'primary' : 'warning'} variant="outlined" />
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="body1" sx={{ color: '#374151', lineHeight: 1.6 }}>
                        "{review.feedback}"
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
