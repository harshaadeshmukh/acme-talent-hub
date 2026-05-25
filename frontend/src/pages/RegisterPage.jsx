import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import './AuthPages.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  useAuth()

  // ⚠️  SECURITY: 'role' is intentionally NOT in form state.
  // It is always hard-coded to 'employee' at submit time so a user
  // cannot self-elevate by tampering with the request payload.
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'employee',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [otpStep, setOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: '' }))
    setError('')
  }

  function validate() {
    const errors = {}
    if (!form.first_name.trim()) errors.first_name = 'Required'
    if (!form.last_name.trim()) errors.last_name = 'Required'
    if (!form.email.trim()) errors.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = 'Enter a valid email'
    if (!form.password) errors.password = 'Required'
    else if (form.password.length < 8)
      errors.password = 'Minimum 8 characters'
    if (!form.confirm_password) errors.confirm_password = 'Required'
    else if (form.password !== form.confirm_password)
      errors.confirm_password = 'Passwords do not match'
    return errors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }
    setLoading(true)
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirm_password, first_name, last_name, ...rest } = form
      const payload = { 
        ...rest, 
        name: `${first_name} ${last_name}`.trim(),
        department: ""
      }
      await authService.register(payload)
      navigate('/login', { 
        replace: true,
        state: { successMessage: 'Account created successfully! Please sign in.' }
      })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (!otpCode.trim()) {
      setError('Please enter the verification code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authService.verifyOtp(registeredEmail, otpCode.trim())
      navigate('/login', { 
        replace: true,
        state: { successMessage: 'Account created successfully! Please sign in.' }
      })
    } catch (err) {
      setError(err.message || 'Verification failed. Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-logo">
            <span className="auth-logo-mark">A</span>
          </div>
          <h1 className="auth-brand-title">ACME Talent Hub</h1>
          <p className="auth-brand-sub">
            Join your team on the centralized performance &amp; development platform.
          </p>
          <ul className="auth-brand-features">
            <li><span className="feature-dot" />View your performance feedback &amp; ratings</li>
            <li><span className="feature-dot" />Track your development progress</li>
            <li><span className="feature-dot" />Set and manage your career goals</li>
          </ul>
        </div>
        <div className="auth-brand-footer">
          &copy; {new Date().getFullYear()} ACME Inc. All rights reserved.
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Fill in your details to request access</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span className="alert-icon">!</span>
              {error}
            </div>
          )}

          {otpStep ? (
            <form className="auth-form" onSubmit={handleVerifyOtp} noValidate>
              <div className="form-group">
                <label htmlFor="otpCode">Verification Code</label>
                <input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={loading}
                />
                <p className="role-locked-hint" style={{marginTop: '8px'}}>
                  We sent a confirmation code to <strong>{registeredEmail}</strong>.
                </p>
              </div>
              <button
                type="submit"
                className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? <span className="btn-spinner" /> : 'Verify Account'}
              </button>
            </form>
          ) : (

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className={`form-group ${fieldErrors.first_name ? 'has-error' : ''}`}>
                <label htmlFor="first_name">First name</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  placeholder="Jane"
                  value={form.first_name}
                  onChange={handleChange}
                  disabled={loading}
                />
                {fieldErrors.first_name && (
                  <span className="field-error">{fieldErrors.first_name}</span>
                )}
              </div>
              <div className={`form-group ${fieldErrors.last_name ? 'has-error' : ''}`}>
                <label htmlFor="last_name">Last name</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  placeholder="Smith"
                  value={form.last_name}
                  onChange={handleChange}
                  disabled={loading}
                />
                {fieldErrors.last_name && (
                  <span className="field-error">{fieldErrors.last_name}</span>
                )}
              </div>
            </div>

            <div className={`form-group ${fieldErrors.email ? 'has-error' : ''}`}>
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
              />
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>



            <div className={`form-group ${fieldErrors.password ? 'has-error' : ''}`}>
              <label htmlFor="password">Password</label>
              <div className="input-with-action">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
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
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </div>

            <div className={`form-group ${fieldErrors.confirm_password ? 'has-error' : ''}`}>
              <label htmlFor="confirm_password">Confirm password</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={form.confirm_password}
                onChange={handleChange}
                disabled={loading}
              />
              {fieldErrors.confirm_password && (
                <span className="field-error">{fieldErrors.confirm_password}</span>
              )}
            </div>

            <button
              type="submit"
              id="register-submit-btn"
              className={`auth-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? <span className="btn-spinner" /> : 'Create account'}
            </button>
          </form>
          )}

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}