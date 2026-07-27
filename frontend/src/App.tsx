import './App.css'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { login as loginService, loginAsync, logout as logoutService, register as registerService, registerAsync, getStoredUser } from './services/auth'
import type { Role, UserAccount } from './types'
import Landing from './pages/Landing'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import About from './pages/About'
import SKsPage from './pages/SKs'
import CitizenHome from './pages/CitizenHome'
import CitizenProjects from './pages/CitizenProjects'
import CitizenMySKs from './pages/CitizenMySKs'
import SuperAdminHome from './pages/SuperAdminHome'
import SuperAdminAccounts from './pages/SuperAdminAccounts'
import SuperAdminActivity from './pages/SuperAdminActivity'
import SuperAdminNews from './pages/SuperAdminNews'
import SKHome from './pages/SKHome'
import SKProjects from './pages/SKProjects'
import { BARANGAYS } from './constants'
import ConfirmDialog from './components/ConfirmDialog'


const PUBLIC_NAV = [
  { title: 'Home', path: '/' },
  { title: 'About', path: '/about' },
  { title: 'SK Officials', path: '/sks' },
]

function userHomePath(user: UserAccount | null): string {
  if (!user) return '/'
  if (user.role === 'superadmin') return '/superadmin/home'
  if (user.role === 'sk') return '/sk/home'
  if (user.role === 'citizen') return '/citizen/home'
  return '/'
}

function getRoleNav(user: UserAccount | null) {
  if (!user) return PUBLIC_NAV
  if (user.role === 'superadmin') return [
    { title: 'Dashboard', path: '/superadmin/home' },
    { title: 'Accounts', path: '/superadmin/accounts' },
    { title: 'Activity Logs', path: '/superadmin/activity' },
    { title: 'News', path: '/superadmin/news' },
  ]
  if (user.role === 'sk') return [
    { title: 'Dashboard', path: '/sk/home' },
    { title: 'Projects', path: '/sk/projects' },
  ]
  return [
    { title: 'Dashboard', path: '/citizen/home' },
    { title: 'Projects', path: '/citizen/projects' },
    { title: 'My SKs', path: '/citizen/mysks' },
  ]
}

const LANDING_PATHS = ['/', '/login', '/register']
const isLandingPath = (p: string) => LANDING_PATHS.includes(p)

const positionColors: Record<string, string> = {
  Chairperson: '#760031',
  Treasurer: '#b45309',
  Secretary: '#1d4ed8',
  Kagawad: '#374151',
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<UserAccount | null>(() => getStoredUser())
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 })
  const [scrollY, setScrollY] = useState(0)
  const [selectedBarangay, setSelectedBarangay] = useState<string>('Balibago')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const isLanding = isLandingPath(location.pathname)

  useEffect(() => {
    const onMove = (e: MouseEvent) => setCursor({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('scroll', onScroll) }
  }, [])

  // Global repeating scroll reveal: fades in on enter, resets on exit so scrolling up/down re-animates smoothly
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed')
          } else {
            e.target.classList.remove('revealed')
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    const els = document.querySelectorAll('.reveal')
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [location.pathname])

  // Close mobile menu whenever the route changes
  useEffect(() => { setNavOpen(false) }, [location.pathname])

  const shellStyle = useMemo<CSSProperties>(() => ({
    '--cursor-x': `${cursor.x * 100}%`,
    '--cursor-y': `${cursor.y * 100}%`,
    '--cursor-x-raw': cursor.x,
    '--scroll-y': scrollY,
  } as CSSProperties), [cursor, scrollY])

  const nav = useMemo(() => getRoleNav(user), [user])

  const handleLogin = async (emailOrUsername: string, password: string, rememberMe: boolean) => {
    const result = await loginAsync(emailOrUsername, password, rememberMe)
    if (result) {
      setUser(result)
      const next = result.role === 'superadmin' ? '/superadmin/home' : result.role === 'sk' ? '/sk/home' : '/citizen/home'
      navigate(next)
      return true
    }
    return false
  }

  const handleRegister = async (name: string, email: string, password: string, barangay: string, isStaRosa: boolean, username?: string): Promise<UserAccount> => {
    const result = await registerAsync(name, email, password, barangay, isStaRosa, username)
    setUser(result)
    return result
  }

  const handleLogout = () => { logoutService(); setUser(null); navigate('/') }
  const confirmLogout = () => setShowLogoutConfirm(true)

  const posColor = user?.skPosition ? (positionColors[user.skPosition] ?? '#760031') : '#760031'

  return (
    <div className={isLanding ? 'landing-shell' : 'app-shell'} style={shellStyle}>
      {!isLanding && <div className="scroll-layer" />}

      {!isLanding && (
        <header className="site-header">
          <div className="container header-inner">
            {/* Brand (Clicking logo redirects to active session home) */}
            <Link to={userHomePath(user)} className="brand-block" style={{ textDecoration: 'none', cursor: 'default' }}>
              <div className="brand-logos">
                <img src="/eSKalaLogo.svg" alt="eSKala" className="brand-logo-img logo-main"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className="brand-divider" />
                <img src="/SantaRosa.svg" alt="Santa Rosa City" className="brand-logo-img"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <img src="/CYDOlogo.svg" alt="CYDO" className="brand-logo-img"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <img src="/bagongPilipinasLogo.svg" alt="Bagong Pilipinas" className="brand-logo-img"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
              <div className="brand-text">
                <span className="brand-name">e<span>SK</span>ala</span>
                <span className="brand-tagline">Santa Rosa City · SK Transparency Portal</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="main-nav desktop-only">
              {nav.map(item => (
                <NavLink key={item.path} to={item.path}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                  {item.title}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="header-actions desktop-only">
              {user?.role === 'superadmin' && (
                <select
                  className="barangay-select-header"
                  value={selectedBarangay}
                  onChange={e => setSelectedBarangay(e.target.value)}
                  title="Select barangay to manage"
                >
                  <option value="">All Barangays</option>
                  {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
              {!user ? (
                <>
                  <Link to="/login" className="btn btn-primary btn-sm">Log In</Link>
                  <Link to="/register" className="btn btn-secondary btn-sm">Sign Up</Link>
                </>
              ) : (
                <>
                  <div className="user-chip">
                    <span className="user-chip-dot" style={{ background: posColor }} />
                    <span>{user.name.split(' ')[0]}</span>
                    {user.skPosition && (
                      <span style={{ fontSize: '0.72rem', opacity: 0.75, fontWeight: 500 }}>· {user.skPosition}</span>
                    )}
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={confirmLogout}>Log Out</button>
                </>
              )}
            </div>

            {/* Mobile Actions + Hamburger */}
            <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {user?.role === 'superadmin' && (
                <select
                  className="barangay-select-header"
                  value={selectedBarangay}
                  onChange={e => setSelectedBarangay(e.target.value)}
                  title="Select barangay to manage"
                  style={{ maxWidth: '110px', fontSize: '0.72rem' }}
                >
                  <option value="">All Brgy</option>
                  {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}

              {!user && (
                <>
                  <Link to="/login" className="btn btn-primary btn-sm">Log In</Link>
                  <Link to="/register" className="btn btn-secondary btn-sm">Sign Up</Link>
                </>
              )}

              <button
                className="landing-menu-toggle"
                onClick={() => setNavOpen(!navOpen)}
                aria-label="Toggle Navigation Menu"
                aria-expanded={navOpen}
              >
                {navOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown — nav links + logout */}
          <div className={`landing-mobile-dropdown mobile-only ${navOpen ? 'open' : ''}`}>
            <div className="landing-mobile-nav-links">
              {nav.map(item => (
                <NavLink key={item.path} to={item.path}
                  className={({ isActive }) => `landing-mobile-nav-link${isActive ? ' active' : ''}`}
                  onClick={() => setNavOpen(false)}>
                  {item.title}
                </NavLink>
              ))}
            </div>

            {user && (
              <div style={{ padding: '0 1.25rem 1.25rem' }}>
                <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}
                  onClick={() => { setNavOpen(false); confirmLogout() }}>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      <main style={{ position: 'relative', zIndex: 1, minHeight: isLanding ? undefined : 'calc(100vh - 140px)' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/sks" element={<SKsPage />} />
          <Route path="/citizen/home" element={<CitizenHome user={user} />} />
          <Route path="/citizen/projects" element={<CitizenProjects user={user} />} />
          <Route path="/citizen/mysks" element={<CitizenMySKs user={user} />} />
          <Route path="/sk/home" element={<SKHome user={user} />} />
          <Route path="/sk/projects" element={<SKProjects user={user} />} />
          <Route path="/superadmin/home" element={<SuperAdminHome selectedBarangay={selectedBarangay} setSelectedBarangay={setSelectedBarangay} />} />
          <Route path="/superadmin/accounts" element={<SuperAdminAccounts selectedBarangay={selectedBarangay} />} />
          <Route path="/superadmin/activity" element={<SuperAdminActivity selectedBarangay={selectedBarangay} />} />
          <Route path="/superadmin/news" element={<SuperAdminNews />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>

      {/* Logout confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log Out"
        message="Are you sure you want to log out of eSKala?"
        confirmLabel="Log Out"
        cancelLabel="Stay"
        danger={false}
        onConfirm={() => { setShowLogoutConfirm(false); handleLogout() }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {!isLanding && (
        <footer className="footer">
          <div className="container">
            <div className="footer-grid">
              <div>
                <div className="footer-brand-name">e<span>SK</span>ala</div>
                <p className="footer-brand-desc">
                  The official Sangguniang Kabataan financial transparency portal for the City of Santa Rosa, Laguna.
                  Powered by RA 10742 (SK Reform Act) as amended by RA 11768.
                </p>
              </div>
              <div>
                <div className="footer-col-title">Navigation</div>
                <div className="footer-links">
                  <Link to="/about">About eSKala</Link>
                  <Link to="/about">About eSKala</Link>
                  <Link to="/sks">SK Officials</Link>
                  <Link to="/login">Citizen Login</Link>
                </div>
              </div>
              <div>
                <div className="footer-col-title">Contact</div>
                <div className="footer-contact-item">
                  City Youth Development Office (CYDO)<br />
                  Santa Rosa City, Laguna<br />
                  Tel: (049) 530-0015 loc. 5011<br />
                  Email: cydo@santarosacity.gov.ph
                </div>
              </div>
              <div>
                <div className="footer-col-title">Legal</div>
                <div className="footer-links">
                  <a href="#">Terms & Conditions</a>
                  <a href="#">Privacy Policy</a>
                  <a href="#">RA 10742 Full Text</a>
                  <a href="#">Full Disclosure Policy</a>
                </div>
              </div>
            </div>
            <div className="footer-bottom">
              <span className="footer-copyright">© 2025 City Government of Santa Rosa, Laguna. All rights reserved.</span>
              <div className="footer-badges">
                <span className="footer-badge">RA 10742</span>
                <span className="footer-badge">BSKE 2023</span>
                <span className="footer-badge">DILG Compliant</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
