import { FormEvent, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { BARANGAYS } from '../data/mockData'
import type { UserAccount } from '../types'
import NewsTicker from '../components/NewsTicker'

interface RegisterPageProps {
  onRegister: (name: string, email: string, password: string, barangay: string, isStaRosa: boolean, username?: string) => UserAccount | void
}

export default function RegisterPage({ onRegister }: RegisterPageProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [barangay, setBarangay] = useState('Balibago')
  const [isStaRosa, setIsStaRosa] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdUser, setCreatedUser] = useState<UserAccount | null>(null)
  const [navOpen, setNavOpen] = useState(false)

  const pwStrength = password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : password.length >= 4 ? 'Weak' : ''
  const pwColor = pwStrength === 'Strong' ? '#166534' : pwStrength === 'Good' ? '#b45309' : '#b91c1c'

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault(); setError('')
    if (!name.trim() || !email.trim() || !password) { setError('Please complete all required fields.'); return }
    if (!isStaRosa) { setError('Registration is strictly restricted to Santa Rosa City, Laguna residents.'); return }
    if (password !== confirmPw) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (!agreed) { setError('You must agree to the Terms & Conditions and Privacy Policy.'); return }

    const result = onRegister(name.trim(), email.trim(), password, barangay, true, username.trim() || undefined)
    const storedUser: UserAccount = (result as UserAccount) || {
      id: `u-${Math.random().toString(36).slice(2, 10)}`,
      name: name.trim(),
      email: email.trim(),
      username: username.trim() || email.trim().split('@')[0],
      password,
      role: 'citizen',
      barangay,
      isStaRosa: true,
      isActive: true,
    }
    setCreatedUser(storedUser)
    setShowSuccessModal(true)
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
          <NavLink to="/login" className={({ isActive }) => `btn-landing-login btn-landing-login--hover${isActive ? ' is-active' : ''}`}>
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

      {/* ── Main Grid ── same two-column pattern as Login ── */}
      <main className="landing-main-grid">

        {/* LEFT — same hero panel */}
        <div className="landing-hero-left">
          <Link to="/" className="landing-logos-strip" style={{ cursor: 'pointer', textDecoration: 'none' }}>
            <img src="/eSKalaLogo.svg" alt="eSKala SK Logo" className="landing-logo-img logo-sk" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <img src="/SantaRosa.svg" alt="Santa Rosa City Seal" className="landing-logo-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <img src="/CYDOlogo.svg" alt="CYDO Office Seal" className="landing-logo-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <img src="/bagongPilipinasLogo.svg" alt="Bagong Pilipinas Logo" className="landing-logo-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </Link>

          <h1 className="landing-brand-title">
            Join e<span className="maroon">SK</span>ala
          </h1>

          <p className="landing-hero-subtitle">
            Create a citizen account and access your barangay's SK transparency data — projects, funds, and direct feedback channels.
          </p>

          {/* Benefits */}
          <div className="landing-stats-section">
            <p className="landing-stats-caption">What you can do as a citizen:</p>
            <div style={{ display: 'grid', gap: '0.65rem', marginTop: '0.3rem' }}>
              {[
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  ),
                  t: 'View Financial Reports',
                  d: 'Track barangay SK budget, spending, and project progress.'
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  ),
                  t: 'Comment & Suggest',
                  d: 'Submit feedback directly to your barangay SK council.'
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  t: 'Know Your SK Officials',
                  d: 'Access the full roster of elected SK officials.'
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2">
                      <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l5 5v11a2 2 0 0 1-2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
                    </svg>
                  ),
                  t: 'Stay Informed',
                  d: 'Read city-wide news and CYDO announcements.'
                },
              ].map(f => (
                <div key={f.t} style={{ display: 'flex', gap: '0.85rem', padding: '0.8rem 0.9rem', background: 'rgba(255,255,255,0.85)', border: '1.5px solid rgba(118,0,49,0.09)' }}>
                  <div style={{ width: '36px', height: '36px', background: 'rgba(118,0,49,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)', marginBottom: '0.1rem' }}>{f.t}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Privacy Notice */}
          <div style={{ padding: '0.9rem 1rem', background: 'rgba(254,236,65,0.12)', border: '1.5px solid rgba(254,236,65,0.3)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.72rem', color: '#7a5200', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Data Privacy Notice · RA 10173
            </div>
            <p style={{ fontSize: '0.8rem', color: '#7a5200', lineHeight: 1.65, margin: 0 }}>
              Your data is protected under the Data Privacy Act of 2012. Information is used solely for civic engagement and barangay transparency. You may request account deletion at any time.
            </p>
          </div>
        </div>

        {/* RIGHT — Register form in the same login-card-container style */}
        <div className="login-card-container">
          <div className="login-card-head">
            <h2 className="login-card-title">Create Account</h2>
            <p className="login-card-subtitle">Citizen registration · Santa Rosa City, Laguna</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Full Name */}
            <div className="login-field-group">
              <label htmlFor="reg-name" className="login-label">Full Name <span style={{ color: 'var(--maroon)' }}>*</span></label>
              <div className="login-input-wrapper">
                <span className="login-input-icon-left">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input id="reg-name" type="text" className="login-input no-right-icon" value={name} onChange={e => setName(e.target.value)} placeholder="Juan dela Cruz" required />
              </div>
            </div>

            {/* Username (optional) */}
            <div className="login-field-group">
              <label htmlFor="reg-username" className="login-label">Username <span style={{ color: 'var(--muted-light)', fontWeight: 400 }}>(optional)</span></label>
              <div className="login-input-wrapper">
                <span className="login-input-icon-left" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: '#aaa' }}>@</span>
                <input id="reg-username" type="text" className="login-input no-right-icon" value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))} placeholder="juandelacruz" />
              </div>
            </div>

            {/* Email */}
            <div className="login-field-group">
              <label htmlFor="reg-email" className="login-label">Email Address <span style={{ color: 'var(--maroon)' }}>*</span></label>
              <div className="login-input-wrapper">
                <span className="login-input-icon-left">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input id="reg-email" type="email" className="login-input no-right-icon" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@example.com" required />
              </div>
            </div>

            {/* Barangay */}
            <div className="login-field-group">
              <label htmlFor="reg-barangay" className="login-label">Barangay <span style={{ color: 'var(--maroon)' }}>*</span></label>
              <select id="reg-barangay" className="login-input no-right-icon" style={{ paddingLeft: '1rem', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23760031' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.85rem center', paddingRight: '2.2rem' }}
                value={barangay} onChange={e => setBarangay(e.target.value)}>
                {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Mandatory Santa Rosa Residency Verification */}
            <div className="login-field-group">
              <label className="login-label">City Residency Verification <span style={{ color: 'var(--maroon)' }}>*</span></label>
              <div style={{ padding: '0.75rem 0.9rem', background: 'rgba(118,0,49,0.04)', border: '1.5px solid rgba(118,0,49,0.14)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2.2" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink)' }}>
                    Santa Rosa City, Laguna Resident
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                    Registration is strictly restricted to Santa Rosa City residents under RA 10742 (SK Reform Act).
                  </div>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="login-field-group">
              <div className="login-field-label-row">
                <label htmlFor="reg-password" className="login-label">Password <span style={{ color: 'var(--maroon)' }}>*</span></label>
                {pwStrength && <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, color: pwColor }}>{pwStrength}</span>}
              </div>
              <div className="login-input-wrapper">
                <span className="login-input-icon-left">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input id="reg-password" type={showPw ? 'text' : 'password'} className="login-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" required />
                <button type="button" className="login-input-icon-right" onClick={() => setShowPw(p => !p)}>
                  {showPw
                    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="login-field-group">
              <label htmlFor="reg-confirm" className="login-label">Confirm Password <span style={{ color: 'var(--maroon)' }}>*</span></label>
              <div className="login-input-wrapper">
                <span className="login-input-icon-left">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input id="reg-confirm" type="password" className="login-input no-right-icon" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter your password" required />
              </div>
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={() => setAgreed(a => !a)} style={{ marginTop: '2px', accentColor: 'var(--maroon)', width: '15px', height: '15px', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.55 }}>
                I agree to the{' '}
                <a href="#" style={{ color: 'var(--maroon)', fontWeight: 700, textDecoration: 'underline' }}>Terms & Conditions</a>
                {' '}and{' '}
                <a href="#" style={{ color: 'var(--maroon)', fontWeight: 700, textDecoration: 'underline' }}>Privacy Policy</a>
                {' '}of eSKala and the City Government of Santa Rosa.
              </span>
            </label>

            {error && <div className="notice error">{error}</div>}

            <button type="submit" className="btn-login-submit">
              Create Citizen Account &rarr;
            </button>
          </form>

          <p style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.86rem', color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#7A0C2E', fontWeight: 700 }}>Sign In</Link>
          </p>
        </div>
      </main>

      {/* ── Account Created Successfully Modal ── */}
      {showSuccessModal && createdUser && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowSuccessModal(false) }}>
          <div className="modal" style={{ maxWidth: '520px', borderRadius: '4px' }}>
            <div className="modal-header" style={{ background: 'rgba(22, 101, 52, 0.06)', borderColor: 'rgba(22, 101, 52, 0.18)' }}>
              <div>
                <h3 className="modal-title" style={{ color: '#166534', fontSize: '1.1rem', margin: 0 }}>Account Created Successfully!</h3>
                <p style={{ fontSize: '0.8rem', color: '#15803d', margin: 0 }}>Your Citizen Account has been saved to the user database.</p>
              </div>
              <button className="modal-close" onClick={() => setShowSuccessModal(false)} title="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div className="alert-success">
                <strong>Registration Complete!</strong> You can now access your barangay's SK transparency portal and submit citizen feedback.
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.85)', border: '1.5px solid rgba(118,0,49,0.1)', padding: '1rem', display: 'grid', gap: '0.65rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--maroon)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                  Saved Citizen Account Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', fontSize: '0.85rem', gap: '0.35rem' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Full Name:</span>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{createdUser.name}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', fontSize: '0.85rem', gap: '0.35rem' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Username:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>@{createdUser.username}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', fontSize: '0.85rem', gap: '0.35rem' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Email Address:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{createdUser.email}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', fontSize: '0.85rem', gap: '0.35rem' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Barangay:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{createdUser.barangay}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', fontSize: '0.85rem', gap: '0.35rem' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Santa Rosa Resident:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{createdUser.isStaRosa ? 'Yes (Santa Rosa City)' : 'No'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', fontSize: '0.85rem', gap: '0.35rem' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Account Status:</span>
                  <span className="badge badge-active" style={{ width: 'fit-content' }}>Active Citizen</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#F0EEE6' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                Go to Login Page
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/citizen/home')}>
                Proceed to Dashboard &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

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
