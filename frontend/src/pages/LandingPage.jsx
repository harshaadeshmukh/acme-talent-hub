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
          <div className="logo-icon">A</div>
          <span>ACME AI Talent Hub</span>
        </div>
        <div className="nav-links">
          <button className="nav-btn-text" onClick={() => navigate('/login')}>Sign In</button>
          <button className="nav-btn-primary" onClick={() => navigate('/register')}>Join the Future</button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🤖 POWERED BY ACME-GENESIS AI</div>
          <h1 className="hero-h1">The Future of <span className="text-gradient">AI-Driven</span> Talent</h1>
          <p className="hero-p">Stop guessing. Start growing. ACME AI Talent Hub uses advanced neural networks to help you manage, track, and elevate your global workforce.</p>
          <div className="hero-btns">
            <button className="hero-btn-main" onClick={() => navigate('/register')}>Get AI Insights</button>
            <button className="hero-btn-outline" onClick={() => setShowVideo(true)}>See AI in Action</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="glass-card main-card">
            <div className="card-header">AI Predictions</div>
            <div className="ai-wave">
              <div className="wave-bar" style={{ height: '40%' }} />
              <div className="wave-bar" style={{ height: '70%' }} />
              <div className="wave-bar" style={{ height: '90%' }} />
              <div className="wave-bar" style={{ height: '60%' }} />
              <div className="wave-bar" style={{ height: '80%' }} />
            </div>
            <div className="ai-status">⚡ Analyzing Team Flux...</div>
          </div>
          <div className="glass-card float-card-1">🧠 Neural Match: 98%</div>
          <div className="glass-card float-card-2">🚀 Next Goal: Lead Dev</div>
          <div className="blob blob-1" />
          <div className="blob blob-2" />
        </div>
      </header>

      {/* ── AI Features ── */}
      <section className="features-section">
        <div className="section-head">
          <h2>Management made <br/> intelligent.</h2>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Assistant Mockup ── */}
      <div className="ai-chat-preview">
        <div className="chat-bubble">
          <div className="bot-avatar">🤖</div>
          <div className="bot-msg">"Hey! Based on Sammer's recent Python certification, I recommend the <b>Advanced Backend Path</b> for Q3."</div>
        </div>
      </div>

      {/* ── CTA Footer ── */}
      <section className="cta-footer">
        <div className="cta-box ai-box">
          <h2>Ready to upgrade to an AI workforce?</h2>
          <p>Join the elite organizations using ACME-Genesis to drive performance.</p>
          <button onClick={() => navigate('/register')}>Activate AI Now</button>
        </div>
      </section>

      <footer className="footer-bottom">
        <p>© 2026 ACME AI Talent Hub. The Intelligence of Growth.</p>
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
            <div className="video-ai-overlay">
              <h3>ACME-GENESIS ANALYZING...</h3>
              <div className="scan-line" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
