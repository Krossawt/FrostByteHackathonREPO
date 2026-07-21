import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
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

  const handleLogin = (email: string, password: string, role: Role) => {
    const result = loginService(email, password, role)
    if (result) {
      setUser(result)
      const next = role === 'superadmin' ? '/superadmin/home' : role === 'sk' ? '/sk/home' : '/citizen/home'
      navigate(next)
    }
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
    <div className="page-shell" style={shellStyle}>
      <div className="page-glow" />
      <header className="site-header">
        <div className="container">
          <nav>
            <div className="brand-row">
              <div className="brand-sigil">E</div>
              <div>
                <p className="brand-title">eSKala</p>
                <small className="brand-subtitle">Santa Rosa City SK transparency portal</small>
              </div>
            </div>

            <div className="nav-links">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? 'nav-link active-link' : 'nav-link')}>
                  {item.title}
                </NavLink>
              ))}
              {user && roleMenu.map((item) => (
                <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? 'nav-link active-link' : 'nav-link')}>
                  {item.title}
                </NavLink>
              ))}
            </div>

            <div className="nav-links nav-actions">
              {!user ? (
                <>
                  <NavLink to="/login" className="nav-link">Login</NavLink>
                  <NavLink to="/register" className="nav-link">Create account</NavLink>
                </>
              ) : (
                <>
                  <span className="user-chip">{user.name}</span>
                  <button className="btn btn-secondary" type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

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

      <footer className="footer">
        <div className="container footer-content">
          <div>
            <p className="footer-title">eSKala</p>
            <small>Officially structured for Santa Rosa City, Laguna public engagement and SK accountability.</small>
          </div>
          <div>
            <p className="footer-title">Prepared for FastAPI + Supabase</p>
            <small>Frontend mockup ready for backend handoff, with role-aware views already in place.</small>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
