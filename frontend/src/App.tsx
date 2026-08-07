import './App.css'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { login as loginService, loginAsync, logout as logoutService, register as registerService, registerAsync, sendOtp, getStoredUser } from './services/auth'
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
import { User as UserIcon } from 'lucide-react'
import ProfileEditModal from './components/ProfileEditModal'
import { updateProfileApi, deleteAccountApi, resolveImageUrl } from './services/api'
import Portal from './components/Portal'
import PolicyModal from './components/PolicyModal'
import GlobalSearchBar from './components/GlobalSearchBar'


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

function ProtectedRoute({
  user,
  allowedRoles,
  children,
}: {
  user: UserAccount | null
  allowedRoles: Role[]
  children: React.ReactElement
}) {
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={userHomePath(user)} replace />
  }
  return children
}

function PublicAuthRoute({
  user,
  children,
}: {
  user: UserAccount | null
  children: React.ReactElement
}) {
  if (user) {
    return <Navigate to={userHomePath(user)} replace />
  }
  return children
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<UserAccount | null>(() => getStoredUser())
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 })
  const [scrollY, setScrollY] = useState(0)
  const [selectedBarangay, setSelectedBarangay] = useState<string>('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const isLanding = isLandingPath(location.pathname)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null)
  const [policyType, setPolicyType] = useState<'terms' | 'privacy' | null>(null)

  useEffect(() => {
    if (!profileFeedback) return
    const timer = setTimeout(() => setProfileFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [profileFeedback])

  useEffect(() => {
    const onMove = (e: MouseEvent) => setCursor({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('scroll', onScroll) }
  }, [])

  // Scroll to top on every route change (prevents mid-page starts after navigation)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

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
      // replace:true removes /login from history so the Back button won't return to the login page
      navigate(next, { replace: true })
      return true
    }
    return false
  }

  const handleRegister = async (name: string, email: string, password: string, barangay: string, isStaRosa: boolean, otp: string, username?: string): Promise<UserAccount> => {
    const result = await registerAsync(name, email, password, barangay, isStaRosa, otp, username)
    setUser(result)
    return result
  }

  const handleProfileSave = async (updates: { name: string; barangay: string; photoURL: string }) => {
    const updated = await updateProfileApi(updates)
    setUser(prev => prev ? { ...prev, ...updated } : prev)
    setProfileFeedback({ type: 'success', message: 'Profile updated successfully' })
  }

  const handleDiscardProfileEdit = () => {
    setShowProfileModal(false)
    setProfileFeedback({ type: 'info', message: 'Changes discarded' })
  }

  const handleDeleteAccount = async () => {
    await deleteAccountApi()
    logoutService()
    setUser(null)
    setShowProfileModal(false)
    navigate('/', { replace: true })
  }

  const handleLogout = () => { logoutService(); setUser(null); navigate('/', { replace: true }) }
  const confirmLogout = () => setShowLogoutConfirm(true)

  const posColor = user?.skPosition ? (positionColors[user.skPosition] ?? '#760031') : '#760031'

  return (
    <div className={isLanding ? 'landing-shell' : 'app-shell'} style={shellStyle}>
      {!isLanding && <div className="scroll-layer" />}

      {!isLanding && (
        <header className={`site-header${user?.role === 'superadmin' ? ' site-header--superadmin' : ''}`}>
          <style>{`
            @media (max-width: 1255px) {
              .site-header--superadmin .brand-logo-img {
                height: 26px !important;
              }
              .site-header--superadmin .brand-logo-img.logo-main {
                height: 30px !important;
              }
              .site-header--superadmin .brand-divider {
                height: 18px !important;
              }
              .site-header--superadmin .brand-logos {
                gap: 0.3rem !important;
              }
              .site-header--superadmin .brand-block {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 0.2rem !important;
              }
              .site-header--superadmin .brand-text {
                white-space: normal !important;
              }
              .site-header--superadmin .brand-name {
                font-size: 0.95rem !important;
              }
              .site-header--superadmin .brand-tagline {
                font-size: 0.6rem !important;
                white-space: normal !important;
              }
            }

            @media (max-width: 1125px) {
              .site-header--superadmin .desktop-only {
                display: none !important;
              }
              .site-header--superadmin .mobile-only {
                display: flex !important;
              }

              .site-header--superadmin .landing-menu-toggle {
                color: #7A0C2E;
                background: none;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem;
                transition: color var(--transition);
              }
              .site-header--superadmin .landing-menu-toggle:hover {
                color: #580820;
              }

              .site-header--superadmin .landing-mobile-dropdown {
                display: flex;
                flex-direction: column;
                gap: 1.2rem;
                background: var(--panel-strong);
                border: 1.5px solid rgba(118, 0, 49, 0.12);
                box-shadow: 0 10px 30px rgba(118, 0, 49, 0.1);
                padding: 1.5rem;
                margin-top: 0.5rem;
                width: 100%;
                box-sizing: border-box;
                max-height: 0;
                opacity: 0;
                overflow: hidden;
                transition: max-height 0.25s ease-out, opacity 0.25s ease-out,
                  padding 0.25s ease-out, border-color 0.25s ease-out;
                padding-top: 0;
                padding-bottom: 0;
                border-color: transparent;
              }
              .site-header--superadmin .landing-mobile-dropdown.open {
                max-height: 400px;
                opacity: 1;
                padding-top: 1.5rem;
                padding-bottom: 1.5rem;
                border-color: rgba(118, 0, 49, 0.12);
              }

              .site-header--superadmin .landing-mobile-nav-links {
                display: flex;
                flex-direction: column;
                gap: 1rem;
              }
              .site-header--superadmin .landing-mobile-nav-link {
                font-family: var(--font-display);
                font-weight: 800;
                font-size: 1rem;
                color: #7A0C2E;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                padding: 0.25rem 0;
              }
              .site-header--superadmin .landing-mobile-nav-link:hover {
                color: #580820;
              }
              .site-header--superadmin .barangay-select-header {
                font-family: var(--font-display);
                font-weight: 700;
                font-size: 0.8rem;
                color: var(--maroon);
                border: 1.5px solid rgba(118, 0, 49, 0.18);
                background-color: rgba(255, 255, 255, 0.9);
                padding: 0.42rem 1.8rem 0.42rem 0.75rem;
                cursor: pointer;
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23760031' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.5rem center;
                outline: none;
                max-width: 160px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          `}</style>
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
              {user && (
                <GlobalSearchBar role={user.role} skPosition={user.skPosition} />
              )}
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
                  {user.role === 'citizen' && (
                    <button
                      className="profile-icon-btn"
                      onClick={() => setShowProfileModal(true)}
                      aria-label="Edit Profile"
                      title="Edit Profile"
                    >
                      {user.photoURL ? (
                        <img src={resolveImageUrl(user.photoURL)} alt="Profile" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <UserIcon size={17} />
                      )}
                    </button>
                  )}
                  <div className="user-chip">
                    <span className="user-chip-dot" style={{ background: posColor }} />
                    <span>{user.role === 'superadmin' ? 'Super Admin' : user.name.split(' ')[0]}</span>
                    {user.skPosition && (
                      <span style={{ fontSize: '0.72rem', opacity: 0.75, fontWeight: 500 }}>· {user.skPosition}</span>
                    )}
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={confirmLogout}>Log Out</button>
                </>
              )}
            </div>

            {/* Mobile Actions + Hamburger */}
            <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              {user && (
                <GlobalSearchBar role={user.role} skPosition={user.skPosition} />
              )}
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

              {/* Profile icon — kept OUTSIDE the hamburger dropdown, always visible on mobile — citizens only */}
              {user?.role === 'citizen' && (
                <button
                  className="profile-icon-btn"
                  onClick={() => setShowProfileModal(true)}
                  aria-label="Edit Profile"
                  title="Edit Profile"
                >
                  {user.photoURL ? (
                    <img src={resolveImageUrl(user.photoURL)} alt="Profile" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <UserIcon size={16} />
                  )}
                </button>
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

          {/* Mobile Dropdown — nav links + logout, hidden unless hamburger is open */}
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
          <Route path="/login" element={<PublicAuthRoute user={user}><LoginPage onLogin={handleLogin} /></PublicAuthRoute>} />
          <Route path="/register" element={<PublicAuthRoute user={user}><RegisterPage onRegister={handleRegister} onSendOtp={sendOtp} /></PublicAuthRoute>} />
          <Route path="/home" element={<Navigate to={userHomePath(user)} replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/sks" element={<SKsPage />} />

          {/* Citizen Routes */}
          <Route path="/citizen/home" element={<ProtectedRoute user={user} allowedRoles={['citizen']}><CitizenHome user={user} /></ProtectedRoute>} />
          <Route path="/citizen/projects" element={<ProtectedRoute user={user} allowedRoles={['citizen']}><CitizenProjects user={user} /></ProtectedRoute>} />
          <Route path="/citizen/mysks" element={<ProtectedRoute user={user} allowedRoles={['citizen']}><CitizenMySKs user={user} /></ProtectedRoute>} />

          {/* SK Routes */}
          <Route path="/sk/home" element={<ProtectedRoute user={user} allowedRoles={['sk']}><SKHome user={user} /></ProtectedRoute>} />
          <Route path="/sk/projects" element={<ProtectedRoute user={user} allowedRoles={['sk']}><SKProjects user={user} /></ProtectedRoute>} />

          {/* Super Admin Routes */}
          <Route path="/superadmin/home" element={<ProtectedRoute user={user} allowedRoles={['superadmin']}><SuperAdminHome selectedBarangay={selectedBarangay} setSelectedBarangay={setSelectedBarangay} /></ProtectedRoute>} />
          <Route path="/superadmin/accounts" element={<ProtectedRoute user={user} allowedRoles={['superadmin']}><SuperAdminAccounts selectedBarangay={selectedBarangay} /></ProtectedRoute>} />
          <Route path="/superadmin/activity" element={<ProtectedRoute user={user} allowedRoles={['superadmin']}><SuperAdminActivity selectedBarangay={selectedBarangay} /></ProtectedRoute>} />
          <Route path="/superadmin/news" element={<ProtectedRoute user={user} allowedRoles={['superadmin']}><SuperAdminNews /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to={userHomePath(user)} replace />} />
        </Routes>
      </main>

      {showProfileModal && user && (
        <ProfileEditModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onDiscard={handleDiscardProfileEdit}
          onSave={handleProfileSave}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {profileFeedback && (
        <Portal>
          <div
            style={{
              position: 'fixed',
              top: 'calc(var(--header-height, 78px) + 1rem)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: profileFeedback.type === 'success' ? 'rgba(22, 101, 52, 0.22)' : 'rgba(118, 0, 49, 0.18)',
              backdropFilter: 'blur(16px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
              color: profileFeedback.type === 'success' ? '#0d3d20' : '#5c0026',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.9rem',
              padding: '0.9rem 1.4rem',
              borderRadius: '14px',
              border: '1.5px solid rgba(255, 255, 255, 0.35)',
              boxShadow: profileFeedback.type === 'success'
                ? '0 12px 32px rgba(22,101,52,0.25), inset 0 1px 0 rgba(255,255,255,0.4)'
                : '0 12px 32px rgba(118,0,49,0.18), inset 0 1px 0 rgba(255,255,255,0.4)',
              maxWidth: '90vw',
              animation: 'toastPop 220ms ease-out',
            }}
          >
            {profileFeedback.type === 'success' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-6" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v5" />
                <path d="M12 16h.01" />
              </svg>
            )}
            <span>{profileFeedback.message}</span>
          </div>
          <style>{`
            @keyframes toastPop {
              from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.96); }
              to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            }
          `}</style>
        </Portal>
      )}

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

      <PolicyModal isOpen={!!policyType} type={policyType} onClose={() => setPolicyType(null)} />

      {!isLanding && (
        <footer className="footer">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand-col">
                <div className="footer-brand-name">e<span>SK</span>ala</div>
                <p className="footer-brand-desc">
                  The official Sangguniang Kabataan financial transparency portal for the City of Santa Rosa, Laguna.
                  Powered by RA 10742 (SK Reform Act) as amended by RA 11768.
                </p>
              </div>
              <div className="footer-links-group">
                <div>
                  <div className="footer-col-title">Navigation</div>
                  <div className="footer-links">
                    <Link to="/about">About eSKala</Link>
                    <Link to="/sks">SK Officials</Link>
                    <Link to="/login">Citizen Login</Link>
                  </div>
                </div>
                <div>
                  <div className="footer-col-title">Contact</div>
                  <div className="footer-contact-item">
                    <span>City Youth Development Office (CYDO)</span>
                    <span>Santa Rosa City, Laguna</span>
                    <span>Tel: (049) 530-0015 loc. 5011</span>
                    <span>Email: cydo@santarosacity.gov.ph</span>
                  </div>
                </div>
                <div>
                  <div className="footer-col-title">Legal</div>
                  <div className="footer-links">
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); setPolicyType('terms') }}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                    >
                      Terms &amp; Conditions
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); setPolicyType('privacy') }}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                    >
                      Privacy Policy
                    </button>
                    <a href="https://www.officialgazette.gov.ph/2016/01/15/republic-act-no-10742/" target="_blank" rel="noreferrer">RA 10742 Full Text</a>
                    <a href="https://www.dilg.gov.ph" target="_blank" rel="noreferrer">Full Disclosure Policy</a>
                  </div>
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
