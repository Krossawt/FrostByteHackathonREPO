import { useState, useEffect, FormEvent } from 'react'
import { BARANGAYS } from '../constants'
import type { Role, UserAccount } from '../types'
import ConfirmDialog from '../components/ConfirmDialog'
import Portal from '../components/Portal'
import { fetchUserAccountsApi, createUserAccountApi, toggleUserStatusApi, updateUserAccountApi } from '../services/api'

const ROLE_OPTIONS: (Role | 'all')[] = ['all', 'superadmin', 'sk', 'citizen']

type Feedback = { type: 'success' | 'info'; message: string }

interface SuperAdminAccountsProps {
  selectedBarangay?: string
}

export default function SuperAdminAccounts({ selectedBarangay }: SuperAdminAccountsProps) {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all')
  const [filterBrgy, setFilterBrgy] = useState('All')
  const [search, setSearch] = useState('')
  const [formMode, setFormMode] = useState<'new' | UserAccount | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<UserAccount | null>(null)
  const [confirmAction, setConfirmAction] = useState<'cancel' | null>(null)

  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newBrgy, setNewBrgy] = useState('Balibago')
  const [newPosition, setNewPosition] = useState('Chairperson')
  const [newPassword, setNewPassword] = useState('Sk2026!')
  const [confirmPassword, setConfirmPassword] = useState('Sk2026!')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newIsStaRosa, setNewIsStaRosa] = useState(true)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [initialSnapshot, setInitialSnapshot] = useState({
    name: '', email: '', brgy: 'Balibago', position: 'Chairperson', isStaRosa: true, password: 'Sk2026!',
  })

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetchUserAccountsApi()
        if (Array.isArray(res)) {
          const mapped: UserAccount[] = res.map((u: any) => {
            const roleStr = String(u.userRole || '').toLowerCase()
            const role: Role = roleStr.includes('admin') ? 'superadmin' : roleStr.includes('sk') ? 'sk' : 'citizen'
            return {
              id: String(u.userID),
              name: u.userName,
              email: u.userEmail,
              username: u.userName.toLowerCase().replace(/\s+/g, ''),
              role,
              barangay: u.userLocation !== 'Santa Rosa City' ? u.userLocation : undefined,
              skPosition: u.userRole.includes('Chairperson') ? 'Chairperson' : u.userRole.includes('Secretary') ? 'Secretary' : u.userRole.includes('Treasurer') ? 'Treasurer' : 'Kagawad',
              isStaRosa: u.userIsStaRosa,
              isActive: u.userIsActive,
            }
          })
          setUsers(mapped)
        }
      } catch (err) {
        console.warn('API error fetching user accounts:', err)
      }
    }
    loadAccounts()
  }, [])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

  const activeBrgy = selectedBarangay && selectedBarangay !== '' ? selectedBarangay : filterBrgy

  const filtered = users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchBrgy = activeBrgy === 'All' || u.barangay === activeBrgy
    const q = search.toLowerCase()
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.username?.toLowerCase() ?? '').includes(q)
    return matchRole && matchBrgy && matchQ
  })

  const counts = {
    all: users.length,
    superadmin: users.filter(u => u.role === 'superadmin').length,
    sk: users.filter(u => u.role === 'sk').length,
    citizen: users.filter(u => u.role === 'citizen').length,
  }

  const roleBadge: Record<string, string> = { superadmin: 'badge-superadmin', sk: 'badge-sk', citizen: 'badge-citizen' }
  const roleColor: Record<string, string> = { superadmin: '#760031', sk: '#b45309', citizen: '#7a6200' }

  const openNewForm = () => {
    setNewFullName('')
    setNewEmail('')
    setNewBrgy('Balibago')
    setNewPosition('Chairperson')
    setNewPassword('Sk2026!')
    setConfirmPassword('Sk2026!')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setFormError('')
    setInitialSnapshot({ name: '', email: '', brgy: 'Balibago', position: 'Chairperson', isStaRosa: true, password: 'Sk2026!' })
    setFormMode('new')
  }

  const openEditForm = (u: UserAccount) => {
    setNewFullName(u.name)
    setNewEmail(u.email)
    setNewBrgy(u.barangay || 'Balibago')
    setNewPosition(u.skPosition || 'Chairperson')
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setNewIsStaRosa(u.isStaRosa ?? true)
    setFormError('')
    setInitialSnapshot({
      name: u.name, email: u.email, brgy: u.barangay || 'Balibago',
      position: u.skPosition || 'Chairperson', isStaRosa: u.isStaRosa ?? true, password: '',
    })
    setFormMode(u)
  }

  const editingRole: Role | null = formMode && formMode !== 'new' ? formMode.role : null

  const isFormDirty = () => {
    if (newPassword !== initialSnapshot.password) return true
    if (newFullName !== initialSnapshot.name) return true
    if (newEmail !== initialSnapshot.email) return true
    if ((formMode === 'new' || editingRole === 'sk') && (newBrgy !== initialSnapshot.brgy || newPosition !== initialSnapshot.position)) return true
    if (editingRole === 'citizen' && (newBrgy !== initialSnapshot.brgy || newIsStaRosa !== initialSnapshot.isStaRosa)) return true
    return false
  }

  const requestCloseModal = () => {
    if (isFormDirty()) {
      setConfirmAction('cancel')
    } else {
      setFormMode(null)
    }
  }

  const executeSave = async () => {
    setIsSubmitting(true)
    setFormError('')

    if (formMode === 'new') {
      try {
        const roleStr = `SK ${newPosition}`
        const created = await createUserAccountApi({
          userName: newFullName.trim(),
          userEmail: newEmail.trim(),
          userPassword: newPassword,
          userRole: roleStr,
          userLocation: newBrgy,
          userIsSK: true,
        })

        const newAcc: UserAccount = {
          id: String(created.userID || Date.now()),
          name: created.userName || newFullName.trim(),
          email: created.userEmail || newEmail.trim(),
          username: newFullName.trim().toLowerCase().replace(/\s+/g, ''),
          role: 'sk',
          barangay: newBrgy,
          skPosition: newPosition as any,
          isStaRosa: true,
          isActive: true,
        }

        setUsers(prev => [newAcc, ...prev])
        setFormMode(null)
        setNewFullName('')
        setNewEmail('')
        setFormError('')
        setFeedback({ type: 'success', message: 'Account created successfully' })
      } catch (err: any) {
        setFormError(err.message || 'Failed to create SK account')
      } finally {
        setIsSubmitting(false)
      }
    } else if (formMode) {
      const editingId = formMode.id
      const role = formMode.role
      try {
        const payload: any = {
          userName: newFullName.trim(),
          userEmail: newEmail.trim(),
          ...(newPassword ? { userPassword: newPassword } : {}),
        }
        if (role === 'sk') {
          payload.userRole = `SK ${newPosition}`
          payload.userLocation = newBrgy
        } else if (role === 'citizen') {
          payload.userLocation = newBrgy
          payload.userIsStaRosa = newIsStaRosa
        }

        const updated = await updateUserAccountApi(Number(editingId), payload)
        const res: any = updated

        setUsers(prev => prev.map(u => {
          if (u.id !== editingId) return u
          const base = { ...u, name: res.userName || newFullName.trim(), email: res.userEmail || newEmail.trim() }
          if (role === 'sk') return { ...base, barangay: newBrgy, skPosition: newPosition as any }
          if (role === 'citizen') return { ...base, barangay: newBrgy, isStaRosa: newIsStaRosa }
          return base
        }))
        setFormMode(null)
        setFormError('')
        setFeedback({ type: 'success', message: 'Account updated successfully' })
      } catch (err: any) {
        setFormError(err.message || 'Failed to save changes')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <section className="section section-accent-flow" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
      <div className="container">

        {feedback && (
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
                background: feedback.type === 'success' ? 'rgba(22, 101, 52, 0.22)' : 'rgba(118, 0, 49, 0.18)',
                backdropFilter: 'blur(16px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
                color: feedback.type === 'success' ? '#0d3d20' : '#5c0026',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '0.9rem 1.4rem',
                borderRadius: '14px',
                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                boxShadow: feedback.type === 'success'
                  ? '0 12px 32px rgba(22,101,52,0.25), inset 0 1px 0 rgba(255,255,255,0.4)'
                  : '0 12px 32px rgba(118,0,49,0.18), inset 0 1px 0 rgba(255,255,255,0.4)',
                maxWidth: '90vw',
                animation: 'toastPop 220ms ease-out',
              }}
            >
              {feedback.type === 'success' ? (
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
              <span>{feedback.message}</span>
            </div>
            <style>{`
              @keyframes toastPop {
                from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.96); }
                to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
              }
            `}</style>
          </Portal>
        )}

        <div className="page-intro reveal section-glass-grid" style={{ padding: '1.5rem 1.8rem', borderRadius: '12px', marginBottom: '1.8rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,244,235,0.9) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="page-kicker">Account Management · Super Admin</span>
              <h1 className="page-title" style={{ marginTop: '0.3rem' }}>
                User Accounts Directory
                {selectedBarangay && selectedBarangay !== '' && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--maroon)', fontWeight: 700, marginLeft: '0.6rem' }}>
                    · Barangay {selectedBarangay} Filter Active
                  </span>
                )}
              </h1>
              <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
                Manage all Super Admin, SK Officer, and Citizen accounts across Santa Rosa City's 18 barangays.
              </p>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.4rem' }} onClick={openNewForm}>
              + Create SK Account
            </button>
          </div>
        </div>

        <div className="card-grid card-grid-4 reveal" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">{counts.all}</div>
            <div className="stat-label">Total Accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#760031' }}>{counts.superadmin}</div>
            <div className="stat-label">Super Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#b45309' }}>{counts.sk}</div>
            <div className="stat-label">SK Officers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#7a6200' }}>{counts.citizen}</div>
            <div className="stat-label">Citizens</div>
          </div>
        </div>

        <div className="filter-tabs">
          {ROLE_OPTIONS.map(r => (
            <button key={r} className={`filter-tab${filterRole === r ? ' active' : ''}`} onClick={() => setFilterRole(r)}>
              {r === 'all' ? 'All' : r === 'superadmin' ? 'Super Admin' : r === 'sk' ? 'SK Officers' : 'Citizens'} ({counts[r as keyof typeof counts] ?? counts.all})
            </button>
          ))}
        </div>

        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-wrap">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input className="search-input" type="text" placeholder="Search by name, email, or username…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="search-input" style={{ width: 'auto', paddingLeft: '0.85rem', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23760031' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.6rem center', paddingRight: '1.8rem' }}
              value={filterBrgy} onChange={e => setFilterBrgy(e.target.value)}>
              <option value="All">All Barangays</option>
              {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
            {filtered.length} account{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length > 0 ? (
          <div className="card-grid card-grid-3">
            {filtered.map(u => (
              <div key={u.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '44px', height: '44px', flexShrink: 0,
                    background: `${roleColor[u.role]}18`,
                    border: `2px solid ${roleColor[u.role]}28`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: roleColor[u.role],
                  }}>
                    {u.name.split(' ').filter(w => w.length > 1 && !/^(Jr|Sr)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`badge ${roleBadge[u.role]}`}>{u.role === 'superadmin' ? 'Super Admin' : u.role === 'sk' ? 'SK Officer' : 'Citizen'}</span>
                      {u.skPosition && <span className={`badge badge-${u.skPosition.toLowerCase()}`}>{u.skPosition}</span>}
                      <span className={`badge ${u.isActive ? 'badge-active' : 'badge-inactive'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '0.28rem', fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>
                  {u.username && <div>@{u.username}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                    {u.email}
                  </div>
                  {u.barangay && <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    Brgy. {u.barangay}
                  </div>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(118,0,49,0.08)', paddingTop: '0.65rem' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEditForm(u)}>Edit</button>
                  <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`} style={{ flex: 1 }}
                    onClick={() => setSuspendTarget(u)}>
                    {u.isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No accounts match your filter</div>
          </div>
        )}

        {formMode && (
          <Portal>
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) requestCloseModal() }}>
              <div className="modal">
                <div className="modal-header">
                  <span className="modal-title">
                    {formMode === 'new' ? 'Create SK Account' :
                      editingRole === 'superadmin' ? 'Edit Super Admin Account' :
                        editingRole === 'citizen' ? 'Edit Citizen Account' : 'Edit SK Account'}
                  </span>
                  <button className="modal-close" onClick={requestCloseModal}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <form noValidate onSubmit={(e) => {
                  e.preventDefault()
                  if (!newFullName.trim()) {
                    setFormError('Please enter the full name.')
                    return
                  }
                  if (!newEmail.trim()) {
                    setFormError('Please enter an email address.')
                    return
                  }
                  if (formMode === 'new' && !newPassword) {
                    setFormError('Please enter a temporary password.')
                    return
                  }
                  if (newPassword && newPassword !== confirmPassword) {
                    setFormError('Passwords do not match. Please enter the same password in both fields.')
                    return
                  }
                  setFormError('')
                  executeSave()
                }}>
                  <div className="modal-body">
                    {formError && <div className="notice error">{formError}</div>}

                    <div className="field-group">
                      <label className="field-label">Full Name *</label>
                      <input className="input" type="text" value={newFullName} onChange={e => setNewFullName(e.target.value)} placeholder="Maria Santos" required />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Email Address *</label>
                      <input className="input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="msantos.balibago@sk.gov.ph" required />
                    </div>

                    {/* New Password field with eye toggle */}
                    <div className="field-group">
                      <label className="field-label">
                        {formMode === 'new' ? 'Temporary Password *' : 'New Password (optional)'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="input"
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder={formMode === 'new' ? '' : 'Leave blank to keep current password'}
                          required={formMode === 'new'}
                          style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          style={{
                            position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem'
                          }}
                          title={showPassword ? 'Hide Password' : 'Show Password'}
                        >
                          {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password field with eye toggle */}
                    {(formMode === 'new' || newPassword) && (
                      <div className="field-group">
                        <label className="field-label">
                          {formMode === 'new' ? 'Confirm Temporary Password *' : 'Confirm New Password *'}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            className="input"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder={formMode === 'new' ? 'Re-enter temporary password' : 'Re-enter new password'}
                            required={formMode === 'new' || !!newPassword}
                            style={{ paddingRight: '2.5rem' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(v => !v)}
                            style={{
                              position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)',
                              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem'
                            }}
                            title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                          >
                            {showConfirmPassword ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {(formMode === 'new' || editingRole === 'sk') && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                        <div className="field-group">
                          <label className="field-label">Barangay *</label>
                          <select className="input" value={newBrgy} onChange={e => setNewBrgy(e.target.value)}>
                            {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div className="field-group">
                          <label className="field-label">Position *</label>
                          <select className="input" value={newPosition} onChange={e => setNewPosition(e.target.value)}>
                            {['Chairperson', 'Secretary', 'Treasurer', 'Kagawad'].map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {editingRole === 'citizen' && (
                      <>
                        <div className="field-group">
                          <label className="field-label">Barangay *</label>
                          <select className="input" value={newBrgy} onChange={e => setNewBrgy(e.target.value)}>
                            {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div className="checkbox-row">
                          <input type="checkbox" checked={newIsStaRosa} onChange={() => setNewIsStaRosa(v => !v)} />
                          Santa Rosa City Resident
                        </div>
                      </>
                    )}

                    {editingRole === 'superadmin' && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                        Super Admin accounts have city-wide access and no barangay assignment.
                      </p>
                    )}
                  </div>
                  <div className="modal-footer" style={{ display: 'flex', alignItems: 'center' }}>
                    {formMode !== 'new' && !isFormDirty() && (
                      <span style={{
                        fontSize: '0.78rem',
                        color: 'var(--maroon)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        marginRight: 'auto',
                        lineHeight: 1,
                      }}>
                        Edit a field to enable saving
                      </span>
                    )}
                    <button type="button" className="btn btn-secondary" onClick={requestCloseModal}>Cancel</button>
                    {(formMode === 'new' || isFormDirty()) && (
                      <button type="submit" className={`btn ${formMode === 'new' ? 'btn-primary' : 'btn-save'}`} disabled={isSubmitting}>
                        {isSubmitting ? (formMode === 'new' ? 'Creating...' : 'Saving...') : (formMode === 'new' ? 'Create Account' : 'Save Changes')}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </Portal>
        )}

        <ConfirmDialog
          isOpen={!!suspendTarget}
          title={suspendTarget?.isActive ? 'Suspend Account' : 'Reactivate Account'}
          message={suspendTarget?.isActive
            ? `Are you sure you want to suspend ${suspendTarget?.name}? They will not be able to log in.`
            : `Reactivate ${suspendTarget?.name}'s account? They will regain access to eSKala.`}
          confirmLabel={suspendTarget?.isActive ? 'Suspend' : 'Reactivate'}
          cancelLabel="Cancel"
          variant={suspendTarget?.isActive ? 'danger' : 'success'}
          onConfirm={async () => {
            if (!suspendTarget) return
            const newActive = !suspendTarget.isActive
            try {
              await toggleUserStatusApi(Number(suspendTarget.id), newActive)
            } catch (err) {
              console.warn('API error toggling user status:', err)
            }
            setUsers(prev => prev.map(u => u.id === suspendTarget.id ? { ...u, isActive: newActive } : u))
            setSuspendTarget(null)
            setFeedback({
              type: newActive ? 'success' : 'info',
              message: newActive ? 'Account reactivated successfully' : 'Account suspended successfully'
            })
          }}
          onCancel={() => setSuspendTarget(null)}
        />

        <ConfirmDialog
          isOpen={confirmAction === 'cancel'}
          title="Discard Changes"
          message="Any unsaved changes will be lost. Are you sure you want to close this form?"
          confirmLabel="Discard"
          cancelLabel="Keep Editing"
          variant="danger"
          onConfirm={() => {
            setFormMode(null)
            setConfirmAction(null)
            setFeedback({ type: 'info', message: 'Changes discarded' })
          }}
          onCancel={() => setConfirmAction(null)}
        />

      </div>
    </section>
  )
}
