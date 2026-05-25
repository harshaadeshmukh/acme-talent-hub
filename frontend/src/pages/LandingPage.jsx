import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const [showVideo, setShowVideo] = useState(false)
  const [activeTab, setActiveTab] = useState('employee') // 'employee' or 'manager'
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('employee') // workflow selection

  // Simulated live event feed state
  const [events, setEvents] = useState([
    { id: 1, time: '13:24:02', type: 'SYS', msg: 'System initialized on host: acme-prod-01' },
    { id: 2, time: '13:24:18', type: 'AUTH', msg: 'User alice_dev assigned role: EMPLOYEE' },
    { id: 3, time: '13:25:05', type: 'CERT', msg: 'Verification approved: AWS Certified Architect (Alice)' },
  ])

  // Periodically add new mock events to simulate a live database tracker
  useEffect(() => {
    const mockLogs = [
      { type: 'GOAL', msg: 'Goal created: "Optimize database write indexing" (Bob)' },
      { type: 'REV', msg: 'Manager Carol completed review draft for Alice' },
      { type: 'AUTH', msg: 'User harshad_mgr logged into Management Console' },
      { type: 'CERT', msg: 'New certificate uploaded: GCP Cloud Professional (Bob)' },
      { type: 'GOAL', msg: 'Goal marked: "Deliver React performance refactor" 100% COMPLETE' },
    ]

    const interval = setInterval(() => {
      const now = new Date()
      const timeStr = now.toTimeString().split(' ')[0]
      const randomLog = mockLogs[Math.floor(Math.random() * mockLogs.length)]
      
      setEvents(prev => {
        const next = [...prev, { id: Date.now(), time: timeStr, type: randomLog.type, msg: randomLog.msg }]
        return next.slice(-3) // Keep only the latest 3
      })
    }, 4500)

    return () => clearInterval(interval)
  }, [])

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

      {/* ── Hero & Mockup Section ── */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            ENTERPRISE CAREER INTELLIGENCE & PERFORMANCE
          </div>
          <h1 className="hero-h1">
            Build a high-performance <span className="text-gradient">workforce</span> with absolute data clarity.
          </h1>
          <p className="hero-p">
            ACME Talent Hub replaces scattered spreadsheets with a professional performance management suite. Track goals in real-time, audit employee credentials, and conduct structured career growth reviews under one unified enterprise framework.
          </p>
          <div className="hero-btns">
            <button className="hero-btn-main" onClick={() => navigate('/register')}>Get Started Now</button>
            <button className="hero-btn-outline" onClick={() => setShowVideo(true)}>
              <span>Watch Product Tour</span>
              <span>▶</span>
            </button>
          </div>
        </div>

        {/* ── Interactive SaaS Dashboard Mockup ── */}
        <div className="hero-visual">
          <div className="interactive-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <div className="mockup-dot" style={{ background: '#ef4444' }}></div>
                <div className="mockup-dot" style={{ background: '#f59e0b' }}></div>
                <div className="mockup-dot" style={{ background: '#10b981' }}></div>
              </div>
              <div className="mockup-tabs">
                <button 
                  className={`mockup-tab-btn ${activeTab === 'employee' ? 'active' : ''}`}
                  onClick={() => setActiveTab('employee')}
                >
                  Employee View
                </button>
                <button 
                  className={`mockup-tab-btn ${activeTab === 'manager' ? 'active' : ''}`}
                  onClick={() => setActiveTab('manager')}
                >
                  Manager View
                </button>
              </div>
              <div className="mockup-status-indicator">
                <span className="mockup-status-dot"></span>
                <span>Live Sandbox</span>
              </div>
            </div>

            {/* Dashboard Content Container */}
            <div className="mockup-body">
              {activeTab === 'employee' ? (
                <>
                  <div className="mockup-grid-3">
                    <div className="mockup-metric-card">
                      <span className="metric-label">My Active Goals</span>
                      <span className="metric-value">4 / 5</span>
                      <span className="metric-trend">80% Comp.</span>
                    </div>
                    <div className="mockup-metric-card">
                      <span className="metric-label">Certifications</span>
                      <span className="metric-value">6 Verified</span>
                      <span className="metric-trend">+2 This Qtr</span>
                    </div>
                    <div className="mockup-metric-card">
                      <span className="metric-label">Performance Rating</span>
                      <span className="metric-value">4.8 / 5.0</span>
                      <span className="metric-trend neutral">Exceeds Exp.</span>
                    </div>
                  </div>

                  <div className="mockup-details-panel">
                    <div className="panel-title">
                      <span>My Development Objectives</span>
                      <span className="panel-badge">Q3 Sprint</span>
                    </div>
                    <div className="mockup-items-list">
                      <div className="mockup-item">
                        <div className="item-left">
                          <span className="item-icon">💻</span>
                          <span className="item-name">Optimize Backend DB Latency</span>
                        </div>
                        <div className="item-bar-container">
                          <div className="item-bar warning" style={{ width: '65%' }}></div>
                        </div>
                        <span className="item-value-text">65%</span>
                      </div>
                      <div className="mockup-item">
                        <div className="item-left">
                          <span className="item-icon">🔐</span>
                          <span className="item-name">Complete Security Compliance Audit</span>
                        </div>
                        <div className="item-bar-container">
                          <div className="item-bar success" style={{ width: '100%' }}></div>
                        </div>
                        <span className="item-value-text">100%</span>
                      </div>
                      <div className="mockup-item">
                        <div className="item-left">
                          <span className="item-icon">📜</span>
                          <span className="item-name">AWS Certified Architect Certification</span>
                        </div>
                        <span className="status-pill success">Verified</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mockup-grid-3">
                    <div className="mockup-metric-card">
                      <span className="metric-label">Managed Headcount</span>
                      <span className="metric-value">12 Members</span>
                      <span className="metric-trend">Engineering</span>
                    </div>
                    <div className="mockup-metric-card">
                      <span className="metric-label">Team Goal Progress</span>
                      <span className="metric-value">84.3%</span>
                      <span className="metric-trend">+4.2% MoM</span>
                    </div>
                    <div className="mockup-metric-card">
                      <span className="metric-label">Reviews Pending</span>
                      <span className="metric-value">3 Reviews</span>
                      <span className="metric-trend" style={{ color: '#d97706' }}>Due 5 Days</span>
                    </div>
                  </div>

                  <div className="mockup-details-panel">
                    <div className="panel-title">
                      <span>Department Overview & Actions</span>
                      <span className="panel-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', borderColor: 'rgba(99, 102, 241, 0.2)' }}>Manager Suite</span>
                    </div>
                    <div className="mockup-items-list">
                      <div className="mockup-item">
                        <div className="item-left">
                          <span className="item-icon">👩‍💻</span>
                          <span className="item-name">Alice Johnson (Senior Engineer)</span>
                        </div>
                        <span className="status-pill success">Completed (4.9/5)</span>
                      </div>
                      <div className="mockup-item">
                        <div className="item-left">
                          <span className="item-icon">👨‍💻</span>
                          <span className="item-name">Bob Smith (Frontend Dev)</span>
                        </div>
                        <span className="status-pill pending">Pending Review</span>
                      </div>
                      <div className="mockup-item">
                        <div className="item-left">
                          <span className="item-icon">📋</span>
                          <span className="item-name">Assign Review: 3 Performance Reviews waiting</span>
                        </div>
                        <button className="status-pill success" style={{ background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/login')}>
                          Audit
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Live Database Activity Tracker simulating changes in back-end */}
            <div className="mockup-activity-stream">
              <div className="activity-header">LIVE CONSOLE ACTIVITY STREAM</div>
              <div className="activity-logs">
                {events.map(event => (
                  <div className="activity-log-item" key={event.id}>
                    <span>
                      <span className="log-meta">[{event.time}] </span>
                      <span style={{ color: event.type === 'SYS' ? '#7c3aed' : event.type === 'CERT' ? '#2563eb' : event.type === 'REV' ? '#db2777' : '#059669', fontWeight: 600 }}>
                        {event.type}
                      </span>
                      <span>: {event.msg}</span>
                    </span>
                    <span className="log-meta">ACTIVE_DB</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Platform Purpose Section (Clear statement - No Questions) ── */}
      <section className="purpose-section">
        <div className="purpose-content">
          <span className="purpose-badge">ENTERPRISE PURPOSE</span>
          <h2 className="purpose-title">
            ACME Talent Hub was created to bridge the gap between employee career growth and managerial oversight.
          </h2>
          <p className="purpose-p">
            Our platform replaces scattered spreadsheets and disjointed tracking systems with a beautiful, centralized database to organize targets, verify professional certifications, and execute secure performance assessments.
          </p>
        </div>
      </section>

      {/* ── Enterprise Feature Details Section ── */}
      <section className="features-section">
        <div className="section-head">
          <h2>Engineered for modern human resource management.</h2>
          <p>
            An integrated web platform providing structural transparency and operational auditing tools to build highly effective engineering and operations departments.
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Granular Role Control</h3>
            <p>
              Strict separation of permissions. Employees view personal profiles and edit personal goals, while assigned managers supervise specific personnel under their domain.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3>Verification Pipeline</h3>
            <p>
              Employees upload newly obtained certificates directly. Managers audit and approve submissions to maintain a verified corporate database of technical skills.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Quantitative Metrics</h3>
            <p>
              Perform complex multi-factor employee performance ratings. Review trends and compile data summaries automatically using modern web tables and metrics.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Modern API Architecture</h3>
            <p>
              Underpinned by FastAPI backend and React frontend ensuring high-speed transactional logs, instant updates, and absolute security compliance.
            </p>
          </div>
        </div>
      </section>

      {/* ── Interactive Workflow Walkthrough ── */}
      <section className="workflow-section">
        <div className="section-head text-center" style={{ margin: '0 auto 50px', textAlign: 'center' }}>
          <h2>Operational Workflows</h2>
          <p style={{ maxWidth: '600px', margin: '12px auto 0' }}>
            Choose a persona to learn how to utilize ACME Talent Hub inside your organizational pipeline.
          </p>
        </div>

        <div className="workflow-tabs">
          <button 
            className={`workflow-tab-btn ${activeWorkflowTab === 'employee' ? 'active' : ''}`}
            onClick={() => setActiveWorkflowTab('employee')}
          >
            Employee Career Flow
          </button>
          <button 
            className={`workflow-tab-btn ${activeWorkflowTab === 'manager' ? 'active' : ''}`}
            onClick={() => setActiveWorkflowTab('manager')}
          >
            Manager Review Pipeline
          </button>
        </div>

        <div className="workflow-grid">
          {activeWorkflowTab === 'employee' ? (
            <>
              <div className="workflow-step-card">
                <span className="step-num">STEP 01</span>
                <h3>Secure Authentication</h3>
                <p>Register an account and sign into your portal. Set up profile variables, contact information, and role indicators.</p>
                <div className="workflow-details-box">
                  <strong>Trigger:</strong> Click Register / Sign In<br/>
                  <strong>Database:</strong> Creates record with role: <code>employee</code>
                </div>
              </div>
              <div className="workflow-step-card">
                <span className="step-num">STEP 02</span>
                <h3>Establish Objectives</h3>
                <p>Document actionable goals, update completion percentages, and upload valid technical certifications for management verification.</p>
                <div className="workflow-details-box">
                  <strong>Action:</strong> Click "Add Goal" or upload files<br/>
                  <strong>Outcome:</strong> Real-time progress updates on dashboard
                </div>
              </div>
              <div className="workflow-step-card">
                <span className="step-num">STEP 03</span>
                <h3>Evaluate Outcomes</h3>
                <p>Access manager feedback reviews. Check scoring, read key remarks, and formulate the development path for the upcoming quarter.</p>
                <div className="workflow-details-box">
                  <strong>Access:</strong> Navigate to "My Reviews"<br/>
                  <strong>Security:</strong> Encrypted, isolated profile review
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="workflow-step-card">
                <span className="step-num">STEP 01</span>
                <h3>Structure the Org Chart</h3>
                <p>Managers authenticate and gain immediate dashboard diagnostics over their department size, employee roster, and overall target compliance.</p>
                <div className="workflow-details-box">
                  <strong>Trigger:</strong> Authenticate as Manager<br/>
                  <strong>Visibility:</strong> Full team database access
                </div>
              </div>
              <div className="workflow-step-card">
                <span className="step-num">STEP 02</span>
                <h3>Verify Submissions</h3>
                <p>Audit employee goals, approve new certifications, and assign specific career milestones to teammates based on corporate strategy.</p>
                <div className="workflow-details-box">
                  <strong>Action:</strong> Click "Verify Certificate" or edit ratings<br/>
                  <strong>Effect:</strong> Recalculates metrics for team view
                </div>
              </div>
              <div className="workflow-step-card">
                <span className="step-num">STEP 03</span>
                <h3>Execute Appraisals</h3>
                <p>Create annual performance reviews. Type structured write-ups, input quantitative metrics (1-5 scale), and finalize assessments.</p>
                <div className="workflow-details-box">
                  <strong>Output:</strong> Generates permanent review records<br/>
                  <strong>Format:</strong> REST API payload to backend
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── B2B Comparison Matrix Section ── */}
      <section className="comparison-section">
        <div className="section-head">
          <h2>Operational Performance Matrix</h2>
          <p>Analyzing corporate productivity workflows under spreadsheet management versus unified platform database tracking.</p>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Workflow Feature</th>
                <th>Spreadsheets & Email</th>
                <th>ACME Talent Hub</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="td-feature">Data Synchronicity</td>
                <td className="td-bad">
                  <span className="badge-bad">✕ Stale Data</span>
                  <p style={{ margin: 0, fontSize: '12px' }}>Static documents lead to outdated objectives and mismatched reports.</p>
                </td>
                <td className="td-good">
                  <span className="badge-good">✓ Realtime Live Sync</span>
                  <p style={{ margin: 0, fontSize: '12px' }}>Live metrics refresh on both employee and manager portals instantly.</p>
                </td>
              </tr>
              <tr>
                <td className="td-feature">Security & RBAC</td>
                <td className="td-bad">
                  <span className="badge-bad">✕ Zero Access Boundaries</span>
                  <p style={{ margin: 0, fontSize: '12px' }}>Spreadsheets get forwarded, exposing private employee compensation and review ratings.</p>
                </td>
                <td className="td-good">
                  <span className="badge-good">✓ Granular RBAC</span>
                  <p style={{ margin: 0, fontSize: '12px' }}>Strict server-side validation isolates review data to designated personnel.</p>
                </td>
              </tr>
              <tr>
                <td className="td-feature">Audit Logs</td>
                <td className="td-bad">
                  <span className="badge-bad">✕ Manual Verification</span>
                  <p style={{ margin: 0, fontSize: '12px' }}>Verifying a certificate requires chasing emails, PDFs, and links.</p>
                </td>
                <td className="td-good">
                  <span className="badge-good">✓ Click Approval</span>
                  <p style={{ margin: 0, fontSize: '12px' }}>Upload certificates directly to the profile with one-click manager verification.</p>
                </td>
              </tr>
              <tr>
                <td className="td-feature">Performance Analytics</td>
                <td className="td-bad">
                  <span className="badge-bad">✕ No Aggregates</span>
                  <p style={{ margin: 0, fontSize: '12px' }}>Calculating average ratings across departments requires custom equations.</p>
                </td>
                <td className="td-good">
                  <span className="badge-good">✓ Dynamic Charting</span>
                  <p style={{ margin: 0, fontSize: '12px' }}>Average performance scores and team stats automatically compile in real-time.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Call to Action Section ── */}
      <section className="cta-footer">
        <div className="cta-box">
          <h2>Streamline your organization's performance framework today.</h2>
          <p>
            Join teams replacing manual administration with modern, secure, and intuitive talent analytics software.
          </p>
          <button onClick={() => navigate('/register')}>Start Platform Onboarding</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-bottom">
        <div>© 2026 ACME Talent Hub. All rights reserved. Enterprise System of Record.</div>
        <div className="footer-creator-badge">
          <span>Created and Developed by </span>
          <span className="creator-name">Harshad Deshmukh</span>
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
