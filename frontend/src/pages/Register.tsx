import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

interface RegisterPageProps {
  onRegister: (name: string, email: string, password: string, barangay: string, isStaRosa: boolean) => void
}

function RegisterPage({ onRegister }: RegisterPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [barangay, setBarangay] = useState('City Heights')
  const [isStaRosa, setIsStaRosa] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(true)
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please complete all fields before submitting your registration.')
      return
    }

    if (password !== confirmPassword) {
      setError('Your passwords do not match. Please re-enter them carefully.')
      return
    }

    if (!termsAccepted) {
      setError('You must agree to the terms and conditions to create an account.')
      return
    }

    onRegister(name.trim() || 'Citizen User', email.trim() || 'citizen@eskala.ph', password, barangay, isStaRosa)
  }

  return (
    <section className="section section-hero register-page">
      <div className="container">
        <div className="hero-grid register-grid">
          <div className="hero-copy-panel login-copy">
            <div className="hero-kicker">Register</div>
            <h1 className="hero-title">Create a citizen account for your barangay.</h1>
            <p className="hero-subline">Register once to receive barangay-specific updates, project summaries, and participation notices.</p>

            <Link to="/login" className="btn btn-secondary btn-pill">Already have an account?</Link>
          </div>

          <div className="hero-card auth-card">
            <div className="auth-card-head">
              <h2>Create a citizen profile</h2>
              <p>Your barangay selection determines the local dashboard and project feeds you will see.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid" style={{ gap: '1rem' }}>
              <div className="input-group">
                <label htmlFor="name">Full name</label>
                <input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Juan dela Cruz" />
              </div>
              <div className="input-group">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="citizen@example.com" />
              </div>
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a strong password" />
              </div>
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter password" />
              </div>
              <div className="input-group">
                <label htmlFor="barangay">Barangay</label>
                <select id="barangay" value={barangay} onChange={(event) => setBarangay(event.target.value)}>
                  <option>City Heights</option>
                  <option>Balibago</option>
                  <option>San Lorenzo</option>
                  <option>Dela Paz</option>
                  <option>Malitlit</option>
                  <option>Nuvali</option>
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="isStaRosa">Is Santa Rosa City Barangay?</label>
                <select id="isStaRosa" value={isStaRosa ? 'yes' : 'no'} onChange={(event) => setIsStaRosa(event.target.value === 'yes')}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <label className="checkbox-row checkbox-block">
                <input type="checkbox" checked={termsAccepted} onChange={() => setTermsAccepted((value) => !value)} />
                <span>I agree to the terms and conditions and data privacy notice.</span>
              </label>

              {error ? <div className="notice error">{error}</div> : null}

              <button type="submit" className="btn btn-primary btn-pill">Register account</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
