import { FormEvent, useState } from 'react'

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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      return
    }
    onRegister(name.trim() || 'Citizen User', email.trim() || 'citizen@eskala.ph', password, barangay, isStaRosa)
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-title">Create citizen account</div>
        <p className="subtitle">Only citizens create accounts in this phase. SK accounts and super admin access are pre-provisioned.</p>

        <div className="section-surface" style={{ maxWidth: '780px', marginTop: '2rem' }}>
          <form onSubmit={handleSubmit} className="grid" style={{ gap: '1.25rem' }}>
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
            <button type="submit" className="btn btn-primary">Register</button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
