import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { login as loginService, logout as logoutService, register as registerService, getStoredUser } from './services/auth'
import type { Role } from './types'
import Landing from './pages/Landing'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import About from './pages/About'
import SKs from './pages/SKs'
import CitizenHome from './pages/CitizenHome'
import CitizenProjects from './pages/CitizenProjects'
import CitizenMySKs from './pages/CitizenMySKs'
import SuperAdminHome from './pages/SuperAdminHome'
import SuperAdminAccounts from './pages/SuperAdminAccounts'
import SuperAdminActivity from './pages/SuperAdminActivity'
import SuperAdminNews from './pages/SuperAdminNews'
import SKHome from './pages/SKHome'
import SKProjects from './pages/SKProjects'
import './App.css'

const navItems = [
  { title: 'Home', path: '/' },
  { title: 'About', path: '/about' },
  { title: 'SKs', path: '/sks' }
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const isGraphPage = location.pathname === '/' || location.pathname === '/login'
  const [user, setUser] = useState(() => getStoredUser())
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 })
  const [scrollShift, setScrollShift] = useState(0)

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      setCursor({ x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight })
    }
    const handleScroll = () => setScrollShift(window.scrollY)

    handleScroll()
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const shellStyle = useMemo<CSSProperties>(() => ({
    ['--cursor-x' as string]: `${cursor.x * 100}%`,
    ['--cursor-y' as string]: `${cursor.y * 100}%`,
    ['--scroll-y' as string]: `${scrollShift * 0.04}px`
  }), [cursor, scrollShift])

  const roleMenu = useMemo(() => {
    if (!user) return []
    if (user.role === 'superadmin') {
      return [
        { title: 'Home', path: '/superadmin/home' },
        { title: 'Accounts', path: '/superadmin/accounts' },
        { title: 'Activity Logs', path: '/superadmin/activity' },
        { title: 'News', path: '/superadmin/news' }
      ]
    }
    if (user.role === 'sk') {
      return [
        { title: 'Home', path: '/sk/home' },
        { title: 'Projects', path: '/sk/projects' }
      ]
    }
    return [
      { title: 'Home', path: '/citizen/home' },
      { title: 'Projects', path: '/citizen/projects' },
      { title: 'My SKs', path: '/citizen/mysks' }
    ]
  }, [user])

  const handleLogin = (email: string, password: string, rememberMe: boolean) => {
    const result = loginService(email, password, rememberMe)
    if (result) {
      setUser(result)
      const next = result.role === 'superadmin' ? '/superadmin/home' : result.role === 'sk' ? '/sk/home' : '/citizen/home'
      navigate(next)
      return true
    }
    return false
  }

  const handleRegister = (name: string, email: string, password: string, barangay: string, isStaRosa: boolean) => {
    const result = registerService(name, email, password, barangay, isStaRosa)
    setUser(result)
    navigate('/citizen/home')
  }

  const handleLogout = () => {
    logoutService()
    setUser(null)
    navigate('/')
  }

  return (
    <div className={isGraphPage ? 'landing-shell' : 'page-shell'} style={shellStyle}>
      {!isGraphPage && <div className="page-glow" />}
      {!isGraphPage && (
        <header className="site-header">
          <div className="container header-grid">
            <div className="brand-block">
              <div className="brand-sigil">E</div>
              <div>
                <p className="brand-title">eSKala</p>
                <small className="brand-subtitle">Santa Rosa City SK transparency portal</small>
              </div>
            </div>

            <div className="main-nav">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? 'nav-link active-link' : 'nav-link')}>
                  {item.title}
                </NavLink>
              ))}
            </div>

            <div className="nav-actions">
              {!user ? (
                <>
                  <Link to="/login" className="btn btn-pill btn-primary">Login</Link>
                  <Link to="/register" className="btn btn-pill btn-secondary">Sign up</Link>
                </>
              ) : (
                <>
                  <span className="user-chip">{user.name}</span>
                  <button className="btn btn-pill btn-secondary" type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/sks" element={<SKs />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />
          <Route path="/citizen/home" element={<CitizenHome user={user} />} />
          <Route path="/citizen/projects" element={<CitizenProjects />} />
          <Route path="/citizen/mysks" element={<CitizenMySKs />} />
          <Route path="/sk/home" element={<SKHome user={user} />} />
          <Route path="/sk/projects" element={<SKProjects />} />
          <Route path="/superadmin/home" element={<SuperAdminHome />} />
          <Route path="/superadmin/accounts" element={<SuperAdminAccounts />} />
          <Route path="/superadmin/activity" element={<SuperAdminActivity />} />
          <Route path="/superadmin/news" element={<SuperAdminNews />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>

      {!isGraphPage && (
        <footer className="footer">
          <div className="container footer-content">
            <div className="footer-section">
              <p className="footer-title">About eSKala</p>
              <small>A government-facing public portal for Santa Rosa City barangay SK projects, budgets, and civic participation.</small>
            </div>
            <div className="footer-section">
              <p className="footer-title">Contact</p>
              <small>SK Oversight Office<br />Email: skoversight@rosacity.gov.ph<br />Phone: (049) 508-1234</small>
            </div>
            <div className="footer-section">
              <p className="footer-title">Policies</p>
              <div className="footer-links">
                <NavLink to="/about">About us</NavLink>
                <a href="mailto:skoversight@rosacity.gov.ph">Contact</a>
                <a href="/login">Terms and conditions</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
