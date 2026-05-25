import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Employee Sections
import OverviewSection from './sections/OverviewSection'
import TeamsSection from './sections/TeamsSection'
import MembersSection from './sections/MembersSection'
import AchievementsSection from './sections/AchievementsSection'
import DevelopmentSection from './sections/DevelopmentSection'
import PerformanceReviewsPage from './PerformanceReviewsPage'
import CompetenciesPage from './CompetenciesPage'
// Manager Sections
import ManagerOverviewSection from './sections/ManagerOverviewSection'
import ManageTeamSection from './sections/ManageTeamSection'
import ManagerReviewsSection from './sections/ManagerReviewsSection'
import ManagerGoalApprovalsSection from './sections/ManagerGoalApprovalsSection'
import LearningSection from './sections/LearningSection'
import TalentIntelligenceSection from './sections/TalentIntelligenceSection'
import './DashboardPage.css'

const PROFILE_ITEM = { label: 'My Profile', icon: '👤', Section: MembersSection }

const EMPLOYEE_NAV_ITEMS = [
  { label: 'Dashboard', icon: '🏠', Section: OverviewSection },
  { label: 'My Team', icon: '👥', Section: TeamsSection },
  { label: 'Achievements', icon: '🏆', Section: AchievementsSection },
  { label: 'Development', icon: '📚', Section: LearningSection },
  { label: 'Competencies', icon: '🧠', Section: CompetenciesPage },
  { label: 'Performance Reviews', icon: '📊', Section: PerformanceReviewsPage },
]

const MANAGER_NAV_ITEMS = [
  { label: 'Manager Dashboard', icon: '🏠', Section: ManagerOverviewSection },
  { label: 'Manage Team', icon: '👥', Section: ManageTeamSection },
  { label: 'Achievements', icon: '🏆', Section: AchievementsSection },
  { label: 'Learning & Growth', icon: '🌱', Section: LearningSection },
  { label: 'Talent Intelligence', icon: '🔬', Section: TalentIntelligenceSection },
  { label: 'Review Center', icon: '⭐', Section: ManagerReviewsSection },
]
export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [serverDown, setServerDown] = useState(false)

  function handleLogout() { logout(); navigate('/login') }

  // Use the actual user role to determine which navigation items to show
  const currentNavItems = (user?.role === 'manager' || user?.role === 'admin') ? MANAGER_NAV_ITEMS : EMPLOYEE_NAV_ITEMS

  // Initialize active tab on mount
  // Initialize active tab on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveNav(currentNavItems[0].label)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/health')
        if (res.ok) setServerDown(false)
        else setServerDown(true)
      } catch {
        setServerDown(true)
      }
    }
    checkHealth()
    const id = setInterval(checkHealth, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws'
    const ws = new WebSocket(wsUrl)
    ws.onmessage = (event) => {
      if (event.data === 'update') {
        window.dispatchEvent(new Event('app-update'))
      }
    }
    return () => ws.close()
  }, [])

  function handleNavigate(label) {
    if (currentNavItems.find((n) => n.label === label) || label === PROFILE_ITEM.label) {
      setActiveNav(label)
    }
  }

  const allNavItems = [...currentNavItems, PROFILE_ITEM]
  const ActiveSection = allNavItems.find(n => n.label === activeNav)?.Section || currentNavItems[0].Section

  if (serverDown) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#fff', flexDirection: 'column', gap: '20px', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: '64px', margin: 0 }}>🚨</h1>
        <h2 style={{ fontSize: '32px', margin: 0 }}>Server Offline</h2>
        <p style={{ color: '#94a3b8', fontSize: '18px' }}>We are currently experiencing technical difficulties. Please hold tight.</p>
      </div>
    )
  }

  return (
    <div className={`dash-root ${(user?.role === 'manager' || user?.role === 'admin') ? 'manager-mode' : ''}`}>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* ── Sidebar ── */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Sidebar navigation">
        <div className="sidebar-brand">
          <span className="sidebar-logo-mark">A</span>
          <span className="sidebar-brand-name">ACME Talent Hub</span>
        </div>

        <nav className="sidebar-nav">
          {currentNavItems.map(({ label, icon }) => (
            <button
              key={label}
              className={`sidebar-nav-item ${activeNav === label ? 'active' : ''}`}
              onClick={() => { setActiveNav(label); setSidebarOpen(false) }}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className={`sidebar-user-info sidebar-profile-btn ${activeNav === PROFILE_ITEM.label ? 'active' : ''}`}
            onClick={() => { setActiveNav(PROFILE_ITEM.label); setSidebarOpen(false) }}
          >
            <div className="sidebar-avatar" aria-hidden="true">
              {user?.profile_pic_url ? (
                <img src={user.profile_pic_url} alt="" className="sidebar-avatar-img" />
              ) : (
                (user?.name?.[0] || 'U').toUpperCase()
              )}
            </div>
            <div className="sidebar-user-meta">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role || 'employee'}</div>
            </div>
          </button>
          <button id="sidebar-logout-btn" className="sidebar-logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="dash-main-area">
        <header className="dash-header">
          <button
            id="hamburger-btn"
            className="hamburger-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <span className="ham-icon" />
          </button>
          <div className="dash-header-logo">
            <span className="sidebar-logo-mark small" aria-hidden="true">A</span>
            <span>ACME Talent Hub</span>
          </div>
          <div className="dash-header-right">
            {/* Header info removed to avoid duplication with sidebar */}
          </div>
        </header>

        <main className="dash-content" id="main-content">
          <ActiveSection user={user} onNavigate={handleNavigate} />
        </main>
      </div>
    </div>
  )
}