import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import './AuthPages.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)

    try {
      const data = await authService.login(form.email, form.password)
      const user = await authService.me(data.access_token)
      login(user, data.access_token)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-logo">
            <span className="auth-logo-mark" style={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", sans-serif', paddingRight: '5px' }}>🏢</span>
          </div>
          <h1 className="auth-brand-title">ACME Talent Hub</h1>
          <p className="auth-brand-sub">
            Centralized performance &amp; development management for your entire organization.
          </p>
          <ul className="auth-brand-features">
            <li>
              <span className="feature-dot" />
              Track performance reviews &amp; ratings
            </li>
            <li>
              <span className="feature-dot" />
              Identify skill gaps &amp; high-potential talent
            </li>
            <li>
              <span className="feature-dot" />
              Manage development plans &amp; career goals
            </li>
          </ul>
        </div>
        <div className="auth-brand-footer">
          &copy; {new Date().getFullYear()} ACME Inc. All rights reserved.
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {location.state?.successMessage && (
            <div className="auth-alert" role="alert" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#15803d', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <span className="alert-icon">✓</span>
              {location.state.successMessage}
            </div>
          )}

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span className="alert-icon">!</span>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@acmeinc.com"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
                <Link to="/forgot-password" className="form-link-inline" tabIndex={-1}>
                  Forgot password?
                </Link>
              </label>
              <div className="input-with-action">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`auth-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? <span className="btn-spinner" /> : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account?{' '}
            <Link to="/register">Request access</Link>
          </p>
        </div>
      </div>
    </div>
  )
}