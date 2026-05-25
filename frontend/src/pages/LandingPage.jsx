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
          <button className="nav-btn-primary" onClick={() => navigate('/register')}>Request Demo / Join</button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">ENTERPRISE PERFORMANCE MANAGEMENT</div>
          <h1 className="hero-h1">Unlock the full <span className="text-gradient">potential</span> of your workforce.</h1>
          <p className="hero-p">
            ACME Talent Hub is the centralized system of record for modern teams. We replace scattered spreadsheets and manual tracking with a unified platform for goal setting, skill evaluation, and structured performance reviews, giving managers total visibility and employees a clear path to growth.
          </p>
          <div className="hero-btns">
            <button className="hero-btn-main" onClick={() => navigate('/register')}>Get Started Now</button>
            <button className="hero-btn-outline" onClick={() => setShowVideo(true)}>Watch Product Tour</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="enterprise-mockup">
            <div className="mockup-header">
              <div className="mockup-dot" style={{background: '#ef4444'}}></div>
              <div className="mockup-dot" style={{background: '#f59e0b'}}></div>
              <div className="mockup-dot" style={{background: '#10b981'}}></div>
            </div>
            <div className="mockup-body">
              <div className="mockup-card">
                <h4>Q3 Performance</h4>
                <div className="mockup-bar-group">
                  <div className="mockup-bar" style={{height: '40%'}}></div>
                  <div className="mockup-bar" style={{height: '70%'}}></div>
                  <div className="mockup-bar" style={{height: '50%'}}></div>
                  <div className="mockup-bar active" style={{height: '90%'}}></div>
                  <div className="mockup-bar" style={{height: '60%'}}></div>
                </div>
              </div>
              <div className="mockup-card">
                <h4>Recent Goals</h4>
                <div className="mockup-list">
                  <div className="mockup-list-item"></div>
                  <div className="mockup-list-item short"></div>
                  <div className="mockup-list-item"></div>
                </div>
              </div>
              <div className="mockup-card" style={{gridColumn: '1 / -1'}}>
                <h4>Team Competency Radar</h4>
                <div className="mockup-list">
                  <div className="mockup-list-item"></div>
                  <div className="mockup-list-item"></div>
                  <div className="mockup-list-item short"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Enterprise Features Section ── */}
      <section className="features-section">
        <div className="section-head">
          <h2>Built for scale. Designed for clarity.</h2>
          <p>Whether you're managing a team of 10 or an organization of 10,000, ACME Talent Hub provides the robust architecture you need to track, evaluate, and develop top-tier talent seamlessly.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Managerial Oversight</h3>
            <p>Access unified dashboards to oversee your department's progress, assign critical roles, and seamlessly conduct quarterly or annual performance reviews with standardized metrics.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Employee Goal Tracking</h3>
            <p>Empower your workforce. Employees can securely log in to track their active objectives, upload their latest certifications, and review past performance evaluations at any time.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Dynamic Talent Analytics</h3>
            <p>Instantly visualize organizational health, team size distribution, and top performers through our real-time charting system, enabling data-driven HR decisions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Role-Based Security</h3>
            <p>Enterprise-grade access control ensures that sensitive evaluation data remains strictly between the specific employee and their assigned departmental manager.</p>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="cta-footer">
        <div className="cta-box">
          <h2>Ready to transform your workplace?</h2>
          <p>Join the industry leaders using ACME Talent Hub to streamline their performance reviews and unlock the true potential of their workforce.</p>
          <button onClick={() => navigate('/register')}>Start Your Free Trial</button>
        </div>
      </section>

      <footer className="footer-bottom">
        <div>© 2026 ACME Talent Hub. All rights reserved.</div>
        <div>
          <span>Designed and Created by </span>
          <span style={{ fontWeight: 700, color: '#2563eb' }}>Harshad Deshmukh</span>
        </div>
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
