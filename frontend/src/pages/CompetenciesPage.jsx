import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Autocomplete,
  useMediaQuery,
  useTheme,
  Fab
} from '@mui/material'
import {
  Add,
  Delete,
  Edit,
  WorkspacePremium
} from '@mui/icons-material'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts'
import './CompetenciesPage.css'

// Predefined list of common skills for the dropdown
const COMMON_SKILLS = [
  'React', 'Python', 'JavaScript', 'Node.js', 'SQL',
  'Project Management', 'Agile', 'Leadership', 'Data Analysis',
  'Communication', 'AWS', 'Docker', 'TypeScript', 'UI/UX Design'
]

// Level to numeric mapping for the Radar Chart
const LEVEL_MAPPING = {
  'Beginner': 1,
  'Intermediate': 2,
  'Advanced': 3,
  'Expert': 4,
  'Master': 5
}


export default function CompetenciesPage() {
  const { user, token } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [skills, setSkills] = useState([])
  const [systemCompetencies, setSystemCompetencies] = useState([])
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)
  const [showAllSkills, setShowAllSkills] = useState(false)
  const [filterLevel, setFilterLevel] = useState('All')

  const [formData, setFormData] = useState({
    name: '',
    level: 'Beginner',
    expYears: 1
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch system competencies
      const sysRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/competencies/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      let sysData = []
      if (sysRes.ok) {
        sysData = await sysRes.json()
        setSystemCompetencies(sysData)
      }

      // Fetch user competencies
      const userRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/competencies/employee/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (userRes.ok) {
        const userData = await userRes.json()
        // Map from API schema to UI schema
        const mappedData = userData.map(ec => ({
          id: ec.id,
          competency_id: ec.competency_id,
          name: ec.competency.name,
          level: ec.skill_level.charAt(0).toUpperCase() + ec.skill_level.slice(1),
          expYears: ec.years_of_experience
        }))
        setSkills(mappedData)
      }
    } catch (err) {
      console.error('Failed to fetch data', err)
    } finally {
      setLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    if (!token || !user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const handleUpdate = () => fetchData();
    window.addEventListener('app-update', handleUpdate);
    return () => window.removeEventListener('app-update', handleUpdate);
  }, [token, user, fetchData]);

  // Prepare chart data mapped to numeric values
  const chartData = skills.map(skill => ({
    name: skill.name,
    levelValue: LEVEL_MAPPING[skill.level] || 1,
    fullMark: 5
  }))

  const handleOpen = (skill = null) => {
    if (skill) {
      setEditingSkill(skill)
      setFormData({
        name: skill.name,
        level: skill.level,
        expYears: skill.expYears
      })
    } else {
      setEditingSkill(null)
      setFormData({
        name: '',
        level: 'Beginner',
        expYears: 1
      })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingSkill(null)
  }

  const handleSave = async () => {
    if (!formData.name) return

    try {
      if (editingSkill) {
        // UPDATE
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/competencies/employee/${user.id}/${editingSkill.competency_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            competency_id: editingSkill.competency_id,
            skill_level: formData.level.toLowerCase(),
            years_of_experience: formData.expYears
          })
        })
        if (res.ok) await fetchData()
      } else {
        // ADD NEW
        // 1. Find or create competency
        let comp = systemCompetencies.find(c => c.name.toLowerCase() === formData.name.toLowerCase())
        if (!comp) {
          const createRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/competencies/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: formData.name })
          })
          if (createRes.ok) {
            comp = await createRes.json()
          } else {
            console.error('Failed to create competency')
            return
          }
        }
        
        // 2. Add to user
        const addRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/competencies/employee/${user.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            competency_id: comp.id,
            skill_level: formData.level.toLowerCase(),
            years_of_experience: formData.expYears
          })
        })
        if (addRes.ok) await fetchData()
      }
    } catch (err) {
      console.error(err)
    }

    handleClose()
  }

  const handleDelete = async (skill) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/competencies/employee/${user.id}/${skill.competency_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) await fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  // eslint-disable-next-line no-unused-vars
  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return 'info'
      case 'Intermediate': return 'success'
      case 'Advanced': return 'primary'
      case 'Expert': return 'warning'
      case 'Master': return 'error'
      default: return 'default'
    }
  }

  return (
    <Container maxWidth={false} sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 0, sm: 2, md: 3 } }}>
      {/* Hero Header */}
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
              ⬡ Employee Portal / <span style={{ color: 'rgba(255,255,255,0.6)' }}>Competencies</span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0', letterSpacing: '-0.02em' }}>
              Competencies & Skills
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0' }}>
              {user?.first_name ? `Hi ${user.first_name}, track your skill progression and expertise levels.` : 'Track your skill progression and expertise levels.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => handleOpen()} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff', fontSize: '13px', fontWeight: 700,
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
              flexShrink: 0, whiteSpace: 'nowrap'
            }}>
              <span style={{ fontSize: '18px' }}>＋</span> Add Skill
            </button>
          </div>
        </div>
      </div>

      {/* Radar Chart Section */}
      <Card sx={{ mb: { xs: 2, sm: 3, md: 4 }, borderRadius: { xs: 2, md: 3 } }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '0.95rem', md: '1.25rem' } }}>
            Skills Radar
          </Typography>
          {skills.length >= 3 ? (
            <Box sx={{ height: { xs: 250, sm: 350, md: 400 }, mx: { xs: -2, sm: 0 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "60%" : "70%"} data={chartData}>
                  <defs>
                    <linearGradient id="colorRadar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: isMobile ? 10 : 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Radar name="Skill Level" dataKey="levelValue" stroke="#6366f1" strokeWidth={2} fill="url(#colorRadar)" fillOpacity={1} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value) => {
                      const levelName = Object.keys(LEVEL_MAPPING).find(key => LEVEL_MAPPING[key] === value);
                      return [levelName || value, 'Level'];
                    }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 3 }}>
              <Typography color="text.secondary">
                Add at least 3 skills to view your competency radar graph.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Skills List Header & Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 3 }, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, m: 0 }}>
          Your Skills
        </Typography>
        
        {skills.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['All', 'Master', 'Expert', 'Advanced', 'Intermediate', 'Beginner']
              .filter(lvl => lvl === 'All' || skills.some(s => s.level === lvl))
              .map(lvl => {
                const count = lvl === 'All' ? skills.length : skills.filter(s => s.level === lvl).length;
                return (
                  <Chip 
                    key={lvl}
                    label={`${lvl} (${count})`}
                    onClick={() => { setFilterLevel(lvl); setShowAllSkills(false); }}
                    clickable
                    sx={{ 
                      fontWeight: filterLevel === lvl ? 700 : 500,
                      fontSize: { xs: '0.85rem', md: '0.95rem' },
                      height: { xs: '32px', md: '38px' },
                      px: 1,
                      borderRadius: '99px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '1px solid',
                      borderColor: filterLevel === lvl ? 'transparent' : '#e2e8f0',
                      color: filterLevel === lvl ? '#ffffff' : '#64748b',
                      background: filterLevel === lvl 
                        ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' 
                        : '#f8fafc',
                      boxShadow: filterLevel === lvl 
                        ? '0 4px 12px rgba(99, 102, 241, 0.3)' 
                        : '0 2px 4px rgba(0,0,0,0.02)',
                      '&:hover': {
                        background: filterLevel === lvl 
                          ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' 
                          : '#f1f5f9',
                        transform: 'translateY(-1.5px)',
                        boxShadow: filterLevel === lvl 
                          ? '0 6px 16px rgba(99, 102, 241, 0.4)' 
                          : '0 4px 8px rgba(0,0,0,0.05)',
                      }
                    }}
                  />
                );
            })}
          </Box>
        )}
      </Box>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {(() => {
          const displayedSkills = filterLevel === 'All' 
            ? [...skills] 
            : skills.filter(s => s.level === filterLevel);
            
          displayedSkills.sort((a, b) => {
            const levelDiff = (LEVEL_MAPPING[b.level] || 0) - (LEVEL_MAPPING[a.level] || 0);
            if (levelDiff !== 0) return levelDiff;
            return a.name.localeCompare(b.name);
          });

          return (showAllSkills ? displayedSkills : displayedSkills.slice(0, 9)).map((skill) => (
          <Grid item xs={12} sm={6} md={4} key={skill.id}>
            <div className="skill-card-premium">
              <div className="skill-header">
                <div className="skill-title-area">
                  <div className="skill-icon-wrapper">
                    <WorkspacePremium fontSize="medium" />
                  </div>
                  <h3 className="skill-title">{skill.name}</h3>
                </div>
                <div className="skill-actions">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpen(skill)}>
                      <Edit fontSize="small" sx={{ color: '#6b7280' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(skill)}>
                      <Delete fontSize="small" sx={{ color: '#ef4444' }} />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>

              <div className="skill-level-container">
                <div className="skill-level-header">
                  <span className="skill-level-label">Level</span>
                  <span className="skill-level-value">{skill.level}</span>
                </div>
                <div className="skill-progress-bar">
                  <div className={`skill-progress-fill level-${skill.level}`}></div>
                </div>
              </div>

              <div className="skill-footer">
                <span className="exp-badge">
                  ⏱️ {skill.expYears} yr{skill.expYears !== 1 ? 's' : ''} exp
                </span>
              </div>
            </div>
          </Grid>
        ))})()}
      </Grid>

      {(() => {
        const displayedCount = filterLevel === 'All' ? skills.length : skills.filter(s => s.level === filterLevel).length;
        if (displayedCount <= 9) return null;
        return (
          <Box sx={{ mt: { xs: 3, md: 4 }, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={() => setShowAllSkills(!showAllSkills)}
              sx={{ borderRadius: 8, px: 4, py: 1, textTransform: 'none', fontWeight: 600, color: '#4f46e5', borderColor: '#4f46e5', '&:hover': { borderColor: '#4338ca', backgroundColor: 'rgba(79, 70, 229, 0.04)' } }}
            >
              {showAllSkills ? 'Show Less' : `Show ${displayedCount - 9} More Skills`}
            </Button>
          </Box>
        );
      })()}

      {/* Add/Edit Skill Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile} className="premium-dialog">
        <DialogTitle className="premium-dialog-title">
          {editingSkill ? 'Edit Skill' : 'Add New Skill'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, pb: 1, display: 'flex', flexDirection: 'column', gap: { xs: 2.5, md: 3 } }}>
            <Autocomplete
              freeSolo
              options={Array.from(new Set([...COMMON_SKILLS, ...systemCompetencies.map(c => c.name)]))}
              value={formData.name}
              onChange={(event, newValue) => {
                setFormData({ ...formData, name: newValue || '' });
              }}
              onInputChange={(event, newInputValue) => {
                setFormData({ ...formData, name: newInputValue });
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Skill Name" 
                  required 
                  className="premium-input"
                  size={isMobile ? 'small' : 'medium'}
                  placeholder="e.g. React, Python, Leadership"
                />
              )}
            />
            
            <Box sx={{ display: 'flex', gap: { xs: 2, md: 2.5 }, flexDirection: { xs: 'column', sm: 'row' } }}>
              <FormControl fullWidth size={isMobile ? 'small' : 'medium'} className="premium-input">
                <InputLabel>Expertise Level</InputLabel>
                <Select
                  value={formData.level}
                  label="Expertise Level"
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  <MenuItem value="Beginner">Beginner</MenuItem>
                  <MenuItem value="Intermediate">Intermediate</MenuItem>
                  <MenuItem value="Advanced">Advanced</MenuItem>
                  <MenuItem value="Expert">Expert</MenuItem>
                  <MenuItem value="Master">Master</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Years of Experience"
                type="number"
                className="premium-input"
                value={formData.expYears}
                onChange={(e) => setFormData({ ...formData, expYears: Math.max(0, parseInt(e.target.value) || 0) })}
                fullWidth
                inputProps={{ min: 0, step: 1 }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: { xs: 3, md: 4 }, justifyContent: 'center', gap: 2 }}>
          <Button onClick={handleClose} className="premium-btn-cancel">Cancel</Button>
          <Button onClick={handleSave} className="premium-btn-save" disabled={!formData.name}>
            {editingSkill ? 'Update' : 'Add'} Skill
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
