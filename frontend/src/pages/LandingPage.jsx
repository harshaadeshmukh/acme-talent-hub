import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const [showVideo, setShowVideo] = useState(false)

  const features = [
    { title: 'AI Team Insights', desc: 'Our AI analyzes team dynamics to predict burnout and optimize workload.', icon: '🧠' },
    { title: 'Predictive Growth', desc: 'AI-powered career paths suggest the best certificates for every employee.', icon: '🚀' },
    { title: 'Smart Reviews', desc: 'Generate professional performance feedback summaries using advanced AI.', icon: '✍️' },
    { title: 'Dynamic Analytics', desc: 'Real-time data processing with neural-network based organizational health tracking.', icon: '⚡' },
  ]

  return (
    <div className="landing-container">
      {/* ── Navigation ── */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <div className="logo-icon">🏢</div>
          <span>ACME Talent Hub</span>
        </div>
        <div className="nav-links">
          <button className="nav-btn-text" onClick={() => navigate('/login')}>Sign In</button>
          <button className="nav-btn-primary" onClick={() => navigate('/register')}>Join the Hub</button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🌟 NEXT-GEN WORKFORCE MANAGEMENT</div>
          <h1 className="hero-h1">Elevate Your <span className="text-gradient">Team's Potential</span></h1>
          <p className="hero-p">
            <strong>Why we built this:</strong> ACME Talent Hub was created to bridge the gap between employee career growth and managerial oversight. It replaces scattered spreadsheets with a beautiful, centralized platform to track goals, evaluate skills, and manage performance reviews.
          </p>
          <div className="hero-btns">
            <button className="hero-btn-main" onClick={() => navigate('/register')}>Get Started</button>
            <button className="hero-btn-outline" onClick={() => setShowVideo(true)}>See it in Action</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="glass-card main-card">
            <div className="card-header">Performance Analytics</div>
            <div className="ai-wave">
              <div className="wave-bar" style={{ height: '40%' }} />
              <div className="wave-bar" style={{ height: '70%' }} />
              <div className="wave-bar" style={{ height: '90%' }} />
              <div className="wave-bar" style={{ height: '60%' }} />
              <div className="wave-bar" style={{ height: '80%' }} />
            </div>
            <div className="ai-status">📈 Tracking Team Growth...</div>
          </div>
          <div className="glass-card float-card-1">🎯 Active Goals: 12</div>
          <div className="glass-card float-card-2">💼 Next Review: Q3</div>
          <div className="blob blob-1" />
          <div className="blob blob-2" />
        </div>
      </header>

      {/* ── How to Use Section ── */}
      <section className="features-section">
        <div className="section-head">
          <h2>How to use the platform.</h2>
          <p style={{ color: '#64748b', marginTop: '16px', fontSize: '1.1rem', maxWidth: '600px', margin: '16px auto 0' }}>Whether you're an employee driving your own career or a manager guiding a team, we have you covered.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>For Employees</h3>
            <p>Log in to track your active goals, log your latest skill certifications, and review your past performance evaluations from your manager.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💼</div>
            <h3>For Managers</h3>
            <p>Access the unified dashboard to oversee your team's progress, assign users to departments, and seamlessly conduct quarterly performance reviews.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Live Analytics</h3>
            <p>Instantly visualize organizational health, team size distribution, and top performers through our dynamic, real-time charting system.</p>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="cta-footer">
        <div className="cta-box ai-box">
          <h2>Ready to transform your workplace?</h2>
          <p>Join ACME Talent Hub today and unlock the true potential of your workforce.</p>
          <button onClick={() => navigate('/register')}>Create an Account</button>
        </div>
      </section>

      <footer className="footer-bottom">
        <p>© 2026 ACME Talent Hub. All rights reserved.</p>
        <p style={{ marginTop: '8px', fontWeight: 600, color: '#4f46e5' }}>Designed and Created by Harshad Deshmukh</p>
      </footer>

      {/* ── Video Modal ── */}
      {showVideo && (
        <div className="video-modal-overlay" onClick={() => setShowVideo(false)}>
          <div className="video-modal-content" onClick={e => e.stopPropagation()}>
            <button className="video-close" onClick={() => setShowVideo(false)}>✕</button>
            <video 
              autoPlay 
              loop
              muted
              className="demo-video"
              src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-circuit-board-and-cpu-9032-large.mp4"
            />
          </div>
        </div>
      )}
    </div>
  )
}
