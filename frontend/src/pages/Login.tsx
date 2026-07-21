import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

interface LoginPageProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => boolean
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('superadmin@eskala.ph')
  const [password, setPassword] = useState('Admin2026!')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(true)
  const [error, setError] = useState('')
  const [resetNotice, setResetNotice] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setResetNotice('')

    if (!email.trim() || !password) {
      setError('Enter your email address and password to continue.')
      return
    }

    if (!termsAccepted) {
      setError('Please accept the terms and conditions before signing in.')
      return
    }

    const ok = onLogin(email.trim(), password, rememberMe)
    if (!ok) {
      setError('We could not verify that account. Use the sample credentials below or create a new citizen account.')
    }
  }

  return (
    <section className="section section-hero login-page">
      <div className="container">
        <div className="hero-grid login-grid">
          <div className="hero-copy-panel login-copy">
            <div className="hero-kicker">Welcome Back</div>
            <h1 className="hero-title">Please enter your credentials to access the portal.</h1>
            <p className="hero-subline">The platform determines your role from your account and opens the correct dashboard.</p>

            <div className="hero-stat-grid">
              <div className="hero-stat">
                <span className="hero-stat-value">18</span>
                <span className="hero-stat-label">Barangays onboarded</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">2.3M</span>
                <span className="hero-stat-label">Funds tracked</span>
              </div>
            </div>

            <Link to="/register" className="btn btn-secondary btn-pill">Create a citizen account</Link>
          </div>

          <div className="hero-card auth-card">
            <div className="auth-card-head">
              <h2>Sign in to your account</h2>
              <p>Role lookup is automatic, with no manual selection required.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid" style={{ gap: '1rem' }}>
              <div className="input-group">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@eskala.ph" />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="password-shell">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
                  <button type="button" className="icon-button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label className="checkbox-row">
                  <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe((current) => !current)} />
                  <span>Remember me</span>
                </label>
                <button type="button" className="link-button" onClick={() => setResetNotice('Password reset currently unavailable. Please use sample credentials or contact support.')}>Forgot password?</button>
              </div>

              <label className="checkbox-row checkbox-block">
                <input type="checkbox" checked={termsAccepted} onChange={() => setTermsAccepted((current) => !current)} />
                <span>I agree to the terms and conditions.</span>
              </label>

              {error ? <div className="notice error">{error}</div> : null}
              {resetNotice ? <div className="notice info">{resetNotice}</div> : null}

              <button type="submit" className="btn btn-primary btn-pill">Log in</button>
            </form>

            <div className="login-sample">
              <p className="overline">Sample credentials</p>
              <div className="news-list">
                <div className="news-item compact">
                  <small>Super admin</small>
                  <h4>superadmin@eskala.ph</h4>
                  <p>Admin2026!</p>
                </div>
                <div className="news-item compact">
                  <small>SK officer</small>
                  <h4>sk@eskala.ph</h4>
                  <p>Sk2026!</p>
                </div>
                <div className="news-item compact">
                  <small>Citizen</small>
                  <h4>citizen@eskala.ph</h4>
                  <p>Citizen2026!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
