import { FormEvent, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import NewsTicker from '../components/NewsTicker'

interface LoginPageProps {
  onLogin: (emailOrUsername: string, password: string, rememberMe: boolean) => boolean
}

const DEMO_ACCOUNTS = [
  { role: 'Super Admin', sub: 'City-wide oversight', email: 'superadmin@eskala.ph', password: 'Admin2026!', color: '#760031' },
  { role: 'SK Chairperson', sub: 'Balibago · Manage & Approve', email: 'padizon.balibago@sk.gov.ph', password: 'Sk2026!', color: '#b45309' },
  { role: 'SK Secretary', sub: 'Balibago · Add Projects (Proposal Upload & OCR)', email: 'mvillanueva.balibago@sk.gov.ph', password: 'Sk2026!', color: '#7c3aed' },
  { role: 'SK Treasurer', sub: 'Balibago · Add Receipts (Upload & OCR)', email: 'klim.balibago@sk.gov.ph', password: 'Sk2026!', color: '#1d4ed8' },
  { role: 'Citizen', sub: 'Balibago resident', email: 'citizen@eskala.ph', password: 'Citizen2026!', color: '#166534' },
]

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [resetNotice, setResetNotice] = useState('')
  const [showDemo, setShowDemo] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setResetNotice('')
    if (!credential.trim() || !password) { setError('Please enter your username/email and password.'); return }
    const ok = onLogin(credential.trim(), password, true)
    if (!ok) setError('Invalid credentials. Use "Show Demo Accounts" below to test the portal.')
  }

  return (
    <div className="landing-container">
      {/* Full-width continuous News Ticker */}
      <NewsTicker />

      {/* ── Header ── */}
      <header className="landing-header">
        {/* Desktop Navigation */}
        <nav className="landing-nav-left desktop-only">
          <Link to="/" className="landing-nav-link">HOME</Link>
          <Link to="/about" className="landing-nav-link">ABOUT</Link>
          <Link to="/sks" className="landing-nav-link">SK OFFICIALS</Link>
        </nav>
        <div className="landing-nav-right desktop-only">
          <NavLink to="/login" className={({ isActive }) => `btn-landing-login${isActive ? ' is-active' : ''}`}>
            LOGIN
          </NavLink>
          <NavLink to="/register" className={({ isActive }) => `landing-signup-link${isActive ? ' is-active' : ''}`}>
            SIGN UP
          </NavLink>
        </div>

        {/* Mobile Header Bar */}
        <div className="landing-header-mobile-bar mobile-only">
          <Link to="/" className="landing-mobile-brand">
            e<span className="maroon">SK</span>ala
          </Link>
          <div className="landing-mobile-bar-actions">
            <NavLink to="/login" className={({ isActive }) => `btn-landing-login-mobile${isActive ? ' is-active' : ''}`}>
              LOGIN
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => `landing-signup-link-mobile${isActive ? ' is-active' : ''}`}>
              SIGN UP
            </NavLink>
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

        {/* Mobile Dropdown Menu — nav links only */}
        <div className={`landing-mobile-dropdown mobile-only ${navOpen ? 'open' : ''}`}>
          <div className="landing-mobile-nav-links">
            <Link to="/" className="landing-mobile-nav-link" onClick={() => setNavOpen(false)}>HOME</Link>
            <Link to="/about" className="landing-mobile-nav-link" onClick={() => setNavOpen(false)}>ABOUT</Link>
            <Link to="/sks" className="landing-mobile-nav-link" onClick={() => setNavOpen(false)}>SK OFFICIALS</Link>
          </div>
        </div>
      </header>

      {/* ── Main Grid ── */}
      <main className="landing-main-grid">

        {/* LEFT — same hero as landing */}
        <div className="landing-hero-left">
          <Link to="/" className="landing-logos-strip" style={{ cursor: 'default', textDecoration: 'none' }}>
            <img src="/eSKalaLogo.svg" alt="eSKala SK Logo" className="landing-logo-img logo-sk"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <img src="/SantaRosa.svg" alt="Santa Rosa City Seal" className="landing-logo-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <img src="/CYDOlogo.svg" alt="CYDO Office Seal" className="landing-logo-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <img src="/bagongPilipinasLogo.svg" alt="Bagong Pilipinas Logo" className="landing-logo-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </Link>

          <h1 className="landing-brand-title">
            e<span className="maroon">SK</span>ala
          </h1>

          <p className="landing-hero-subtitle">
            Santa Rosa City's official Sangguniang Kabataan Financial Transparency Portal.
          </p>

          <div className="landing-stats-section">
            <p className="landing-stats-caption">As of 2025:</p>
            <div className="landing-stats-row">
              <div className="landing-stat-item">
                <span className="landing-stat-number">18</span>
                <div className="landing-stat-label">Barangays<br />Joined</div>
              </div>
              <div className="landing-stat-item">
                <span className="landing-stat-number">₱39M</span>
                <div className="landing-stat-label-small">
                  Total SK Funds<br />
                  Released for<br />
                  Youth Programs
                </div>
              </div>
              <div className="landing-stat-item">
                <span className="landing-stat-number">141</span>
                <div className="landing-stat-label-small">
                  SK Projects<br />
                  Active &amp;<br />
                  Completed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Login Card */}
        <div className="login-card-container">
          <div className="login-card-head">
            <h2 className="login-card-title">Welcome Back!</h2>
            <p className="login-card-subtitle">Sign in with your username or email address</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Username / Email */}
            <div className="login-field-group">
              <label htmlFor="credential" className="login-label">Username or Email</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="credential" type="text" className="login-input no-right-icon"
                  value={credential} onChange={e => setCredential(e.target.value)}
                  placeholder="username or user@email.com" required
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field-group">
              <div className="login-field-label-row">
                <label htmlFor="password" className="login-label">Password</label>
                <button type="button" className="login-reset-link"
                  onClick={() => setResetNotice('Password reset instructions sent to your registered email.')}>
                  Forgot Password?
                </button>
              </div>
              <div className="login-input-wrapper">
                <span className="login-input-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password" type={showPw ? 'text' : 'password'} className="login-input"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                />
                <button type="button" className="login-input-icon-right" onClick={() => setShowPw(p => !p)}
                  title={showPw ? 'Hide password' : 'Show password'}>
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
            </div>

            {error && <div className="notice error">{error}</div>}
            {resetNotice && <div className="notice info">{resetNotice}</div>}

            <button type="submit" className="btn-login-submit">
              Sign In to Portal &rarr;
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ borderTop: '1px solid rgba(118,0,49,0.1)', paddingTop: '1rem' }}>
            <button type="button" className="link-button"
              style={{ width: '100%', textAlign: 'center', fontSize: '0.8rem', color: '#7A0C2E', textDecoration: 'underline', marginBottom: '0.6rem', display: 'block' }}
              onClick={() => setShowDemo(d => !d)}>
              {showDemo ? 'Hide Demo Accounts' : 'Show Sample Accounts (Demo)'}
            </button>

            {showDemo && (
              <div style={{ display: 'grid', gap: '0.45rem' }}>
                {DEMO_ACCOUNTS.map(d => (
                  <button key={d.email} type="button"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', border: '1.5px solid rgba(118,0,49,0.1)', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s', textAlign: 'left', gap: '0.75rem' }}
                    onMouseEnter={e => { (e.currentTarget).style.borderColor = d.color; (e.currentTarget).style.background = `${d.color}10` }}
                    onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(118,0,49,0.1)'; (e.currentTarget).style.background = 'rgba(255,255,255,0.9)' }}
                    onClick={() => { setCredential(d.email); setPassword(d.password); setShowDemo(false) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: d.color }}>{d.role}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{d.sub}</div>
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.72rem', color: 'var(--muted-light)', letterSpacing: '0.06em' }}>USE →</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--muted)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#7A0C2E', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              Register as a Citizen
            </Link>
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-version">eSKala v1.0 · City of Santa Rosa, Laguna · CYDO</div>
        <div className="landing-footer-links">
          <Link to="/about">Terms and Conditions</Link>
          <Link to="/about">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  )
}
