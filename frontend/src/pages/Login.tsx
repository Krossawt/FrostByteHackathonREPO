import { FormEvent, useState } from 'react'
import type { Role } from '../types'

interface LoginPageProps {
  onLogin: (email: string, password: string, role: Role) => void
}

const roles: Array<{ label: string; value: Role }> = [
  { label: 'Citizen', value: 'citizen' },
  { label: 'SK Officer', value: 'sk' },
  { label: 'Super Admin', value: 'superadmin' }
]

function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('superadmin')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onLogin(email.trim() || `${role}@eskala.ph`, password, role)
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-title">Secure sign-in</div>
        <p className="subtitle">The super admin account is pre-set for the initial launch. Citizens can create accounts after registration.</p>

        <div className="grid grid-2" style={{ marginTop: '2rem' }}>
          <div className="section-surface">
            <form onSubmit={handleSubmit} className="grid" style={{ gap: '1.25rem' }}>
              <div className="input-group">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="superadmin@eskala.ph" />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
              </div>

              <div className="input-group">
                <label htmlFor="role">Role</label>
                <select id="role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
                  {roles.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary">Continue</button>
            </form>
          </div>

          <div className="section-surface">
            <p className="overline">Example access</p>
            <div className="news-list">
              <div className="news-item">
                <small>Super admin</small>
                <h4>superadmin@eskala.ph</h4>
                <p>Admin2026!</p>
              </div>
              <div className="news-item">
                <small>SK officer</small>
                <h4>sk@eskala.ph</h4>
                <p>Sk2026!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
