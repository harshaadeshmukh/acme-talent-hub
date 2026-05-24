import { useState, useEffect, useCallback, useMemo } from 'react'
import { authService } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import './Sections.css'

const STATUS_BADGE = { completed: 'badge-green', 'in_progress': 'badge-yellow', 'pending': 'badge-gray', 'on_hold': 'badge-orange' }
const STATUS_ICON  = { completed: '✅', 'in_progress': '🔄', 'pending': '⏳', 'on_hold': '⏸️' }

function AddForm({ fields, onAdd, onCancel, loading, initialData }) {
  const [form, setForm] = useState(
    Object.fromEntries(fields.map((f) => [f.key, initialData?.[f.key] || f.default || '']))
  )
  
  function handleSubmit(e) {
    e.preventDefault()
    if (fields.some((f) => f.required && !form[f.key])) return
    onAdd(form)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <form className="dev-add-form" onSubmit={handleSubmit}>
        <h3 className="dev-form-title">{initialData ? 'Edit Record' : 'Add New Record'}</h3>
        <div className="dev-form-grid">
          {fields.map((f) => (
            <div key={f.key} className="dev-add-field">
              <label>{f.label}</label>
              {f.type === 'select' ? (
                <select 
                  value={form[f.key]} 
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  disabled={loading}
                >
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'date' ? (
                <DatePicker
                  value={form[f.key] ? dayjs(form[f.key]) : null}
                  onChange={(val) => setForm({ ...form, [f.key]: val ? val.toISOString() : '' })}
                  disabled={loading}
                  slotProps={{ textField: { fullWidth: true, size: 'small', required: f.required } }}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  placeholder={f.placeholder || ''}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  required={f.required}
                  disabled={loading}
                />
              )}
            </div>
          ))}
        </div>
        <div className="dev-add-actions">
          <button type="submit" className="section-action-btn" disabled={loading}>
            {loading ? 'Saving...' : initialData ? 'Update Record' : 'Save Record'}
          </button>
          <button type="button" className="section-cancel-btn" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </LocalizationProvider>
  )
}

export default function DevelopmentSection() {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState('training')
  const [trainings, setTrainings] = useState([])
  const [plans,     setPlans]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [adding,    setAdding]    = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error,     setError]     = useState('')
  const [banner,    setBanner]    = useState('')
  const [filterYear, setFilterYear] = useState('All')

  const availableYears = useMemo(() => {
    const years = new Set()
    trainings.forEach(t => {
      if (t.completion_date) years.add(dayjs(t.completion_date).year().toString())
    })
    plans.forEach(p => {
      if (p.target_date) years.add(dayjs(p.target_date).year().toString())
    })
    return ['All', ...Array.from(years).sort().reverse()]
  }, [trainings, plans])

  const filteredTrainings = useMemo(() => {
    if (filterYear === 'All') return trainings
    return trainings.filter(t => t.completion_date && dayjs(t.completion_date).year().toString() === filterYear)
  }, [trainings, filterYear])

  const filteredPlans = useMemo(() => {
    if (filterYear === 'All') return plans
    return plans.filter(p => p.target_date && dayjs(p.target_date).year().toString() === filterYear)
  }, [plans, filterYear])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [tData, pData] = await Promise.all([
        authService.getTrainingRecords(user.id, token),
        authService.getDevelopmentPlans(user.id, token)
      ])
      setTrainings(tData || [])
      setPlans(pData || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch development data')
    } finally {
      setLoading(false)
    }
  }, [user.id, token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  function showBanner(msg) { setBanner(msg); setTimeout(() => setBanner(''), 3000) }

  function formatErrorMessage(err) {
    if (typeof err === 'string') return err
    if (Array.isArray(err)) return err.map(e => `${e.loc?.join('.')}: ${e.msg}`).join(', ')
    if (err.detail) return typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)
    return 'An unexpected error occurred'
  }

  async function handleAddOrUpdate(formData) {
    setActionLoading(true)
    setError('')
    try {
      if (activeTab === 'training') {
        const payload = {
          employee_id: user.id,
          training_name: formData.training_name || formData.name, // Handle both mapping cases
          provider: formData.provider,
          completion_date: formData.completion_date || formData.date || null,
          duration_hours: parseFloat(formData.duration_hours || formData.hours) || 0,
          certificate_url: formData.certificate_url || null
        }
        if (editingItem) {
          await authService.updateTrainingRecord(editingItem.id, payload, token)
          showBanner('Certificate updated!')
        } else {
          await authService.addTrainingRecord(payload, token)
          showBanner('Certificate added successfully!')
        }
      } else {
        const payload = {
          employee_id: user.id,
          goal: formData.goal,
          description: formData.description || '',
          status: formData.status,
          target_date: formData.target_date || null,
          progress_percentage: formData.progress_percentage || 0
        }
        if (editingItem) {
          await authService.updateDevelopmentPlan(editingItem.id, payload, token)
          showBanner('Growth goal updated!')
        } else {
          await authService.addDevelopmentPlan(payload, token)
          showBanner('Development goal created!')
        }
      }
      setAdding(false)
      setEditingItem(null)
      fetchData()
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRemove(id) {
    if (!window.confirm('Are you sure you want to remove this record?')) return
    setActionLoading(true)
    setError('')
    try {
      if (activeTab === 'training') {
        await authService.deleteTrainingRecord(id, token)
      } else {
        await authService.deleteDevelopmentPlan(id, token)
      }
      fetchData()
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const TRAINING_FIELDS = [
    { key: 'training_name',   label: 'Certificate Name', required: true, placeholder: 'e.g. AWS Solutions Architect' },
    { key: 'provider',        label: 'Issuing Organization', required: true, placeholder: 'e.g. Amazon Web Services' },
    { key: 'completion_date', label: 'Obtained Date', required: true, type: 'date' },
    { key: 'duration_hours',  label: 'Duration (Hours)', required: true, type: 'number', placeholder: 'e.g. 20' },
    { key: 'certificate_url', label: 'Document Link (PDF/Image URL)', required: false, placeholder: 'https://...' },
  ]

  const PLAN_FIELDS = [
    { key: 'goal',        label: 'Career Goal', required: true, placeholder: 'e.g. Become Team Lead' },
    { key: 'description', label: 'Details', required: false, placeholder: 'What are the next steps?' },
    { key: 'target_date', label: 'Target Date', required: true, type: 'date' },
    { key: 'status',      label: 'Status', type: 'select', options: [
        { value: 'pending',     label: '⏳ Not Started' },
        { value: 'in_progress', label: '🔄 In Progress' },
        { value: 'completed',   label: '✅ Completed'   },
        { value: 'on_hold',     label: '⏸️ On Hold'      },
    ], default: 'pending' },
  ]

  const TABS = [
    { id: 'training', label: '🎓 Certificates', count: filteredTrainings.length },
    { id: 'plans',    label: '🎯 Career Goals', count: filteredPlans.length },
  ]

  return (
    <div className="development-section">
      <div className="section-page-header">
        <div>
          <h1 className="section-page-title">Growth & Development</h1>
          <p className="section-page-sub">Your journey of learning and career milestones</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
              height: '40px'
            }}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>
            ))}
          </select>
          {!adding && !editingItem && (
            <button className="section-action-btn" onClick={() => setAdding(true)}>＋ Add New</button>
          )}
        </div>
      </div>

      {banner && <div className="dev-success-banner">✅ {banner}</div>}
      {error && <div className="auth-alert auth-alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div className="dev-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`dev-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(t.id); setAdding(false); setEditingItem(null) }}
          >
            {t.label} <span className="dev-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {(adding || editingItem) && (
        <div className="dev-add-form-wrap">
          <AddForm
            fields={activeTab === 'training' ? TRAINING_FIELDS : PLAN_FIELDS}
            initialData={editingItem}
            onAdd={handleAddOrUpdate}
            onCancel={() => { setAdding(false); setEditingItem(null) }}
            loading={actionLoading}
          />
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading your journey...</div>
      ) : activeTab === 'training' ? (
        filteredTrainings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎓</div>
            <div className="empty-state-title">{trainings.length === 0 ? 'No certificates yet' : 'No certificates for this year'}</div>
            <div className="empty-state-desc">{trainings.length === 0 ? 'Start adding your professional certifications to showcase your skills.' : 'Try selecting a different year.'}</div>
          </div>
        ) : (
          <div className="dev-list">
            {filteredTrainings.map((t) => (
              <div key={t.id} className="dev-item">
                <div className="dev-item-icon">🎓</div>
                <div className="dev-item-body">
                  <div className="dev-item-title">{t.training_name}</div>
                  <div className="dev-item-sub">
                    {t.provider} · Obtained: {t.completion_date ? dayjs(t.completion_date).format('MMM D, YYYY') : '—'} · {t.duration_hours}h
                  </div>
                </div>
                <div className="dev-item-actions">
                  {t.certificate_url && (
                    <a href={t.certificate_url} target="_blank" rel="noopener noreferrer" className="dev-view-btn">📄 View</a>
                  )}
                  <button className="dev-edit-btn" onClick={() => setEditingItem(t)} title="Edit">✎</button>
                  <button className="dev-remove-btn" onClick={() => handleRemove(t.id)} title="Remove">✕</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        filteredPlans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-title">{plans.length === 0 ? 'No career goals set' : 'No goals for this year'}</div>
            <div className="empty-state-desc">{plans.length === 0 ? 'Define your next career milestone to stay on track.' : 'Try selecting a different year.'}</div>
          </div>
        ) : (
          <div className="dev-list">
            {filteredPlans.map((p) => (
              <div key={p.id} className="dev-item">
                <div className="dev-item-icon">{STATUS_ICON[p.status] || '🎯'}</div>
                <div className="dev-item-body">
                  <div className="dev-item-title">{p.goal}</div>
                  {p.description && <div className="dev-item-desc">{p.description}</div>}
                  <div className="dev-item-sub">
                    Target: {p.target_date ? dayjs(p.target_date).format('MMM D, YYYY') : '—'} · 
                    <span className={`badge ${STATUS_BADGE[p.status] || 'badge-gray'}`}>{p.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="dev-item-actions">
                  <button className="dev-edit-btn" onClick={() => setEditingItem(p)} title="Edit">✎</button>
                  <button className="dev-remove-btn" onClick={() => handleRemove(p.id)} title="Remove">✕</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
