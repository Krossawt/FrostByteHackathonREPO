import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

interface LoginPageProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => boolean
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('juandelacruz')
  const [password, setPassword] = useState('••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [resetNotice, setResetNotice] = useState('')
  const [showSampleCreds, setShowSampleCreds] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setResetNotice('')

    if (!email.trim() || !password) {
      setError('Please enter both username/email and password.')
      return
    }

    let targetEmail = email.trim()
    let targetPass = password

    if (targetEmail === 'juandelacruz' || targetEmail.toLowerCase().includes('admin')) {
      targetEmail = 'superadmin@eskala.ph'
      targetPass = 'Admin2026!'
    } else if (targetEmail.toLowerCase().includes('sk')) {
      targetEmail = 'sk@eskala.ph'
      targetPass = 'Sk2026!'
    } else if (!targetEmail.includes('@')) {
      targetEmail = 'citizen@eskala.ph'
      targetPass = 'Citizen2026!'
    }

    const ok = onLogin(targetEmail, targetPass, true)
    if (!ok) {
      setError('We could not verify that account. Click "Show Sample Accounts" below to pick a demo login.')
    }
  }

  return (
    <div className="landing-container">
      {/* Top Header */}
      <header className="landing-header">
        <nav className="landing-nav-left">
          <Link to="/" className="landing-nav-link">HOME</Link>
          <Link to="/about" className="landing-nav-link">ABOUT</Link>
        </nav>

        <div className="landing-nav-right">
          <Link to="/login" className="btn-landing-login">LOGIN</Link>
          <Link to="/register" className="landing-signup-link">SIGN UP</Link>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="landing-main-grid">
        {/* Left Column */}
        <div className="landing-hero-left">
          {/* Logo Strip */}
          <div className="landing-logos-strip">
            <img src="/eSKalaLogo.svg" alt="eSKala SK Logo" className="landing-logo-img logo-sk" />
            <img src="/SantaRosa.svg" alt="Santa Rosa City Seal" className="landing-logo-img logo-santarosa" />
            <img src="/CYDOlogo.svg" alt="CYDO Office Seal" className="landing-logo-img logo-cydo" />
            <img src="/bagongPilipinasLogo.svg" alt="Bagong Pilipinas Logo" className="landing-logo-img logo-bagongpilipinas" />
          </div>

          {/* Title */}
          <h1 className="landing-brand-title">
            e<span className="maroon">SK</span>ala
          </h1>

          {/* Subtitle */}
          <p className="landing-hero-subtitle">
            Santa Rosa’s first Sanguniang Kabataan (SK) Financial Transparency Report Website
          </p>

          {/* Statistics */}
          <div className="landing-stats-section">
            <p className="landing-stats-caption">As of 2026:</p>
            
            <div className="landing-stats-row">
              {/* Stat 1 */}
              <div className="landing-stat-item">
                <span className="landing-stat-number">18</span>
                <div className="landing-stat-label">
                  Barangays<br />Joined
                </div>
              </div>

              {/* Stat 2 */}
              <div className="landing-stat-item">
                <span className="landing-stat-number">2.3M</span>
                <div className="landing-stat-label-small">
                  Pesos allocated<br />
                  funds for SK<br />
                  projects
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Login Card) */}
        <div className="login-card-container">
          <div className="login-card-head">
            <h2 className="login-card-title">Welcome Back!</h2>
            <p className="login-card-subtitle">Please enter your credentials to login</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Username field */}
            <div className="login-field-group">
              <label htmlFor="username" className="login-label">Username</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="username"
                  type="text"
                  className="login-input no-right-icon"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juandelacruz"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="login-field-group">
              <div className="login-field-label-row">
                <label htmlFor="password" className="login-label">Password</label>
                <button
                  type="button"
                  className="login-reset-link"
                  onClick={() => setResetNotice('Password reset instructions sent to registered contact.')}
                >
                  Reset Password?
                </button>
              </div>

              <div className="login-input-wrapper">
                <span className="login-input-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <button
                  type="button"
                  className="login-input-icon-right"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="notice error" style={{ margin: 0 }}>{error}</div>}
            {resetNotice && <div className="notice info" style={{ margin: 0 }}>{resetNotice}</div>}

            <button type="submit" className="btn-login-submit">
              Log in &rarr;
            </button>
          </form>

          {/* Demo Accounts Quick Picker */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: '0.8rem', textAlign: 'center' }}>
            <button
              type="button"
              className="link-button"
              style={{ fontSize: '0.8rem', color: '#7A0C2E', textDecoration: 'underline' }}
              onClick={() => setShowSampleCreds((prev) => !prev)}
            >
              {showSampleCreds ? 'Hide Sample Logins' : 'Show Sample Accounts (Demo)'}
            </button>

            {showSampleCreds && (
              <div className="news-list" style={{ marginTop: '0.6rem', textAlign: 'left' }}>
                <div 
                  className="news-item compact" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setEmail('superadmin@eskala.ph'); setPassword('Admin2026!') }}
                >
                  <small>Super admin</small>
                  <h4>superadmin@eskala.ph</h4>
                  <p>Admin2026!</p>
                </div>
                <div 
                  className="news-item compact" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setEmail('sk@eskala.ph'); setPassword('Sk2026!') }}
                >
                  <small>SK officer</small>
                  <h4>sk@eskala.ph</h4>
                  <p>Sk2026!</p>
                </div>
                <div 
                  className="news-item compact" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setEmail('citizen@eskala.ph'); setPassword('Citizen2026!') }}
                >
                  <small>Citizen</small>
                  <h4>citizen@eskala.ph</h4>
                  <p>Citizen2026!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-version">eSKala v 1.0</div>
        <div className="landing-footer-links">
          <Link to="/about">Terms and Conditions</Link>
          <Link to="/about">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  )
}

export default LoginPage
