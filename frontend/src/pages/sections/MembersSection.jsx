import { useState, useEffect, useRef } from 'react'
import { authService } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import './EnterpriseSection.css'

export default function MembersSection({ user }) {
  const { token, login: updateAuthContext } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [timeline, setTimeline] = useState([])
  const [showTimelineForm, setShowTimelineForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', company: '', start_date: dayjs(), end_date: null, description: '' })
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [dbDepartments, setDbDepartments] = useState([])
  const fileInputRef = useRef(null)
  
  const [profile, setProfile] = useState({
    name:           user?.name           || '',
    email:          user?.email          || '',
    department:     user?.department     || '',
    job_title:      user?.job_title      || '',
    dob:            user?.dob ? dayjs(user.dob) : null,
    address:        user?.address        || '',
    gender:         user?.gender         || '',
    is_handicapped: user?.is_handicapped || false,
    profile_pic_url: user?.profile_pic_url || '',
    linkedin_url:   user?.linkedin_url   || '',
    github_url:     user?.github_url     || '',
    portfolio_url:  user?.portfolio_url  || '',
    role:           user?.role           || 'employee',
  })

  useEffect(() => {
    fetchLatestProfile()
    fetchTimeline()
    fetchDepartments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchLatestProfile() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const freshUser = await res.json()
        setProfile({
          name:           freshUser.name           || '',
          email:          freshUser.email          || '',
          department:     freshUser.department     || '',
          job_title:      freshUser.job_title      || '',
          dob:            freshUser.dob ? dayjs(freshUser.dob) : null,
          address:        freshUser.address        || '',
          gender:         freshUser.gender         || '',
          is_handicapped: freshUser.is_handicapped || false,
          profile_pic_url: freshUser.profile_pic_url || '',
          linkedin_url:   freshUser.linkedin_url   || '',
          github_url:     freshUser.github_url     || '',
          portfolio_url:  freshUser.portfolio_url  || '',
          role:           freshUser.role           || 'employee',
        })
        updateAuthContext(freshUser, token)
      }
    } catch (err) {
      console.error('Failed to fetch latest profile', err)
    }
  }

  async function fetchDepartments() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/departments/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDbDepartments(data)
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err)
    }
  }

  async function fetchTimeline() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/timeline/employee/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const sortedData = data.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        setTimeline(sortedData)
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const payload = {
        name: profile.name,
        department: profile.department,
        job_title: profile.job_title || null,
        dob: profile.dob ? profile.dob.toISOString() : null,
        address: profile.address || null,
        gender: profile.gender || null,
        is_handicapped: profile.is_handicapped,
        linkedin_url: profile.linkedin_url || null,
        github_url: profile.github_url || null,
        portfolio_url: profile.portfolio_url || null
      }
      
      const updatedUser = await authService.updateProfile(user.id, payload, token)
      updateAuthContext(updatedUser, token)
      
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddTimelineEvent(e) {
    e.preventDefault()
    setTimelineLoading(true)
    try {
      const payload = {
        title: newEvent.title,
        company: newEvent.company,
        start_date: newEvent.start_date.toISOString(),
        end_date: newEvent.end_date ? newEvent.end_date.toISOString() : null,
        description: newEvent.description || null
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        fetchTimeline()
        setShowTimelineForm(false)
        setNewEvent({ title: '', company: '', start_date: dayjs(), end_date: null, description: '' })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTimelineLoading(false)
    }
  }

  async function handleDeleteTimelineEvent(id) {
    if(!confirm("Delete this timeline event?")) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/timeline/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchTimeline()
    } catch {
      console.error('Failed to delete timeline event')
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    
    setUploadingPic(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${user.id}/upload-profile-pic`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      if (res.ok) {
        const updatedUser = await res.json()
        setProfile({ ...profile, profile_pic_url: updatedUser.profile_pic_url })
        setImgError(false)
        updateAuthContext(updatedUser, token)
      } else {
        const errorData = await res.json()
        setError(errorData.detail || 'Failed to upload image')
      }
    } catch {
      setError('An error occurred during upload')
    } finally {
      setUploadingPic(false)
    }
  }

  const initials = (profile.name?.[0] || 'U').toUpperCase()

  const GENDER_OPTIONS = [
    { label: 'Male',   icon: '♂️', value: 'Male' },
    { label: 'Female', icon: '♀️', value: 'Female' },
    { label: 'Other',  icon: '⚧', value: 'Other' }
  ]

  return (
    <div className="es-root">
      {/* ── COMMAND BAR ── */}
      <div className="es-command-bar">
        <div className="es-cmd-left">
          <div className="es-breadcrumb">EMPLOYEE <span>/</span> MY PROFILE</div>
          <h1 className="es-page-title">My Profile</h1>
          <p className="es-page-sub">View and update your personal information.</p>
        </div>
        <div className="es-cmd-right">
          {!editing && (
            <button className="es-btn es-btn-primary" onClick={() => setEditing(true)}>
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div className="es-action-banner es-banner-approve">✅ Profile updated successfully.</div>
      )}

      {error && (
        <div className="es-error-banner" style={{ marginBottom: '0' }}>
          <span className="alert-icon">!</span>
          {error}
        </div>
      )}

      {/* ── MAIN PROFILE PANEL ── */}
      <div className="es-panel" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            {profile.profile_pic_url && !imgError ? (
              <img src={profile.profile_pic_url.startsWith('http') || profile.profile_pic_url.startsWith('data:') ? profile.profile_pic_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${profile.profile_pic_url}`} alt="Profile" style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--es-border)', opacity: uploadingPic ? 0.5 : 1 }} onError={() => setImgError(true)} />
            ) : (
              <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'var(--es-indigo)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', opacity: uploadingPic ? 0.5 : 1 }}>
                {initials || '?'}
              </div>
            )}
            {editing && (
              <div onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', inset: 0, background: 'rgba(15,17,23,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', cursor: 'pointer', border: '2px solid transparent' }}>
                {uploadingPic ? '⏳' : '📸'}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--es-text)', letterSpacing: '-0.02em' }}>{profile.name}</div>
            <div style={{ fontSize: '14px', color: 'var(--es-muted)' }}>{profile.email}</div>
            <div style={{ marginTop: '8px' }}>
              <span className={`es-role-badge role-${profile.role}`}>{profile.role}</span>
            </div>
          </div>
        </div>

        {/* ── Professional Links (View Mode) ── */}
        {!editing && (profile.linkedin_url || profile.github_url || profile.portfolio_url) && (
          <div className="es-links-group">
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="es-link-pill">
                💼 LinkedIn
              </a>
            )}
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noreferrer" className="es-link-pill">
                💻 GitHub
              </a>
            )}
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="es-link-pill">
                🌐 Portfolio
              </a>
            )}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave}>
            <div className="es-form-grid">
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="es-field" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="es-field-label">Full Name</label>
                  <input className="es-input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} disabled={loading} />
                </div>
                <div className="es-field" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="es-field-label">Job Title</label>
                  <input className="es-input" value={profile.job_title} onChange={(e) => setProfile({ ...profile, job_title: e.target.value })} disabled={loading} placeholder="e.g. Software Engineer" />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="es-field" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="es-field-label">Department / Team {user?.role === 'employee' && <span className="es-optional">(Manager Assigned)</span>}</label>
                  <select 
                    className="es-input es-select" 
                    value={profile.department || ''} 
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    disabled={loading || user?.role === 'employee'}
                    style={user?.role === 'employee' ? { backgroundColor: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' } : {}}
                    title={user?.role === 'employee' ? 'Department can only be assigned by a manager' : ''}
                  >
                    <option value="" disabled>-- Select Department --</option>
                    {dbDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                    {profile.department && !dbDepartments.includes(profile.department) && (
                       <option value={profile.department}>{profile.department}</option>
                    )}
                  </select>
                </div>
                <div className="es-field" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="es-field-label">Gender</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {GENDER_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button" className={`es-pill ${profile.gender === opt.value ? 'es-pill-active' : ''}`} onClick={() => setProfile({ ...profile, gender: opt.value })} disabled={loading}>
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="es-field" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="es-field-label">Date of Birth</label>
                  <DatePicker value={profile.dob} onChange={(newValue) => setProfile({ ...profile, dob: newValue })} disabled={loading} slotProps={{ textField: { fullWidth: true, size: 'small', sx: { '.MuiInputBase-root': { borderRadius: '10px', fontSize: '13.5px', fontFamily: 'Inter', '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1.5px' } } } } }} />
                </div>
                <div className="es-field" style={{ flex: 1, minWidth: '200px', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="handicapped" checked={profile.is_handicapped} onChange={(e) => setProfile({ ...profile, is_handicapped: e.target.checked })} disabled={loading} style={{ accentColor: 'var(--es-indigo)', width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="handicapped" className="es-field-label" style={{ margin: 0, cursor: 'pointer' }}>Handicapped Status</label>
                </div>
              </div>

              <div className="es-field">
                <label className="es-field-label">Address</label>
                <textarea rows="3" className="es-input es-textarea" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} disabled={loading} placeholder="Enter your full address" />
              </div>

              {/* Professional Links Fields */}
              <h3 style={{ fontSize: '15px', color: 'var(--es-text)', marginTop: '16px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--es-border)' }}>Professional Links</h3>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="es-field" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="es-field-label">LinkedIn URL</label>
                  <input className="es-input" value={profile.linkedin_url} onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })} disabled={loading} placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="es-field" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="es-field-label">GitHub URL</label>
                  <input className="es-input" value={profile.github_url} onChange={(e) => setProfile({ ...profile, github_url: e.target.value })} disabled={loading} placeholder="https://github.com/..." />
                </div>
                <div className="es-field" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="es-field-label">Portfolio URL</label>
                  <input className="es-input" value={profile.portfolio_url} onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })} disabled={loading} placeholder="https://..." />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px', borderTop: '1px solid var(--es-border)', paddingTop: '20px' }}>
              <button type="submit" className="es-btn es-btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" className="es-btn es-btn-ghost" onClick={() => setEditing(false)} disabled={loading}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="es-detail-meta" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', background: 'transparent', border: '1px solid var(--es-border)', padding: '24px', gap: '24px' }}>
            <div className="es-detail-meta-item">
              <span className="es-detail-meta-lbl">Job Title</span>
              <span className="es-detail-meta-val">💼 {profile.job_title || '—'}</span>
            </div>
            <div className="es-detail-meta-item">
              <span className="es-detail-meta-lbl">Department</span>
              <span className="es-detail-meta-val">🏢 {profile.department || '—'}</span>
            </div>
            <div className="es-detail-meta-item">
              <span className="es-detail-meta-lbl">Date of Birth</span>
              <span className="es-detail-meta-val">📅 {profile.dob ? profile.dob.format('DD MMM YYYY') : '—'}</span>
            </div>
            <div className="es-detail-meta-item">
              <span className="es-detail-meta-lbl">Gender</span>
              <span className="es-detail-meta-val">👤 {profile.gender || '—'}</span>
            </div>
            <div className="es-detail-meta-item">
              <span className="es-detail-meta-lbl">Handicapped</span>
              <span className="es-detail-meta-val">{profile.is_handicapped ? '♿ Yes' : 'No'}</span>
            </div>
            <div className="es-detail-meta-item" style={{ gridColumn: '1 / -1' }}>
              <span className="es-detail-meta-lbl">Address</span>
              <span className="es-detail-meta-val">📍 {profile.address || '—'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── WORK TIMELINE PANEL ── */}
      <div className="es-panel" style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Work Timeline</h2>
          <button className="es-btn es-btn-ghost" onClick={() => setShowTimelineForm(!showTimelineForm)}>
            {showTimelineForm ? 'Close Form' : '+ Add Event'}
          </button>
        </div>

        {showTimelineForm && (
          <form onSubmit={handleAddTimelineEvent} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--es-border)', marginBottom: '24px' }}>
            <div className="es-form-grid">
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="es-field" style={{ flex: 1 }}>
                  <label className="es-field-label">Job Title / Role</label>
                  <input required className="es-input" placeholder="e.g. Senior Developer" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} disabled={timelineLoading}/>
                </div>
                <div className="es-field" style={{ flex: 1 }}>
                  <label className="es-field-label">Company / Organization</label>
                  <input required className="es-input" placeholder="e.g. ACME Corp" value={newEvent.company} onChange={e => setNewEvent({...newEvent, company: e.target.value})} disabled={timelineLoading}/>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="es-field" style={{ flex: 1 }}>
                  <label className="es-field-label">Start Date</label>
                  <DatePicker value={newEvent.start_date} onChange={(val) => setNewEvent({ ...newEvent, start_date: val })} slotProps={{ textField: { fullWidth: true, size: 'small', sx: { '.MuiInputBase-root': { borderRadius: '10px', fontSize: '13.5px', fontFamily: 'Inter', '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1.5px' } } } } }} />
                </div>
                <div className="es-field" style={{ flex: 1 }}>
                  <label className="es-field-label">End Date <span className="es-optional">(Leave blank if current)</span></label>
                  <DatePicker value={newEvent.end_date} onChange={(val) => setNewEvent({ ...newEvent, end_date: val })} slotProps={{ textField: { fullWidth: true, size: 'small', sx: { '.MuiInputBase-root': { borderRadius: '10px', fontSize: '13.5px', fontFamily: 'Inter', '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1.5px' } } } } }} />
                </div>
              </div>
              <div className="es-field">
                <label className="es-field-label">Description <span className="es-optional">(Optional)</span></label>
                <textarea className="es-input es-textarea" placeholder="Describe your responsibilities and achievements..." value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} disabled={timelineLoading}/>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="es-btn es-btn-primary" disabled={timelineLoading}>{timelineLoading ? 'Adding...' : 'Add to Timeline'}</button>
                <button type="button" className="es-btn es-btn-ghost" onClick={() => setShowTimelineForm(false)}>Cancel</button>
              </div>
            </div>
          </form>
        )}

        <div className="es-timeline">
          {timeline.length === 0 ? (
            <div style={{ color: 'var(--es-faint)', fontSize: '13px', fontStyle: 'italic', paddingLeft: '8px' }}>No timeline events added yet. Build your career story!</div>
          ) : (
            timeline.map((event) => (
              <div key={event.id} className="es-timeline-event">
                <div className="es-timeline-dot" />
                <div className="es-timeline-content-wrapper">
                  <div className="es-timeline-date">
                    {dayjs(event.start_date).format('MMM YYYY')} - {event.end_date ? dayjs(event.end_date).format('MMM YYYY') : 'Present'}
                  </div>
                  <h3 className="es-timeline-title">{event.title}</h3>
                  <div className="es-timeline-company">
                    <span style={{color: 'var(--es-indigo)', marginRight: '4px'}}>🏢</span>
                    {event.company}
                  </div>
                  {event.description && (
                    <p className="es-timeline-desc">{event.description}</p>
                  )}
                </div>
                <div className="es-timeline-actions">
                  <button onClick={() => handleDeleteTimelineEvent(event.id)} className="es-icon-btn es-icon-del" title="Delete Event">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
