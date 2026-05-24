import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import './AuthPages.css'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [passwords, setPasswords] = useState({ new: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSendOTP(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authService.forgotPassword(email)
      setMessage('Verification code sent to your email.')
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    if (otp.length < 6) {
      setError('Please enter a valid 6-digit code.')
      return
    }
    setStep(3)
    setError('')
    setMessage('')
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authService.resetPassword({
        email,
        otp_code: otp,
        new_password: passwords.new
      })
      setMessage('Password successfully reset! Redirecting to login...')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* ── Brand Panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-logo">
            <span className="auth-logo-mark">A</span>
          </div>
          <h1 className="auth-brand-title">Security Center</h1>
          <p className="auth-brand-sub">
            Protecting your career data with enterprise-grade encryption and secure recovery.
          </p>
          <ul className="auth-brand-features">
            <li><span className="feature-dot" /> Multi-factor verification</li>
            <li><span className="feature-dot" /> Secure session management</li>
            <li><span className="feature-dot" /> Instant password updates</li>
          </ul>
        </div>
        <div className="auth-brand-footer">
          &copy; {new Date().getFullYear()} ACME Security. All rights reserved.
        </div>
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>{step === 1 ? 'Reset Password' : step === 2 ? 'Verify Identity' : 'Set New Password'}</h2>
            <p>
              {step === 1 && 'Enter your email to receive a secure reset code'}
              {step === 2 && 'Check your inbox for the 6-digit OTP'}
              {step === 3 && 'Choose a strong, unique password'}
            </p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error">
              <span className="alert-icon">!</span>
              {error}
            </div>
          )}
          {message && (
            <div className="auth-alert" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#15803d', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <span className="alert-icon">✓</span>
              {message}
            </div>
          )}

          <form className="auth-form" onSubmit={step === 1 ? handleSendOTP : step === 2 ? handleVerifyOTP : handleResetPassword}>
            {step === 1 && (
              <div className="form-group">
                <label>Work Email</label>
                <input
                  type="email"
                  placeholder="you@acmeinc.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            )}

            {step === 2 && (
              <div className="form-group">
                <label>6-Digit Code</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  disabled={loading}
                  required
                  style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold' }}
                />
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button type="button" className="form-link-inline" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setStep(1)}>
                    Resend or change email?
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-with-action">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      disabled={loading}
                      required
                    />
                    <button type="button" className="input-action-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    disabled={loading}
                    required
                  />
                </div>
              </>
            )}

            <button type="submit" className={`auth-submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 
               step === 1 ? 'Send Reset Code' : step === 2 ? 'Verify & Continue' : 'Update Password'}
            </button>
          </form>

          <p className="auth-switch">
            Remembered? <Link to="/login">Sign back in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
