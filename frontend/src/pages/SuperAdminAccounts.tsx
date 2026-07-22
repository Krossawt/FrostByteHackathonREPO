import { useState } from 'react'
import { initialUsers } from '../services/auth'
import { BARANGAYS } from '../data/mockData'
import type { Role } from '../types'

const ROLE_OPTIONS: (Role | 'all')[] = ['all', 'superadmin', 'sk', 'citizen']

export default function SuperAdminAccounts() {
  const [users, setUsers] = useState(initialUsers)
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all')
  const [filterBrgy, setFilterBrgy] = useState('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchBrgy = filterBrgy === 'All' || u.barangay === filterBrgy
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

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
          <div>
            <span className="page-kicker">Account Management · Super Admin</span>
            <h1 className="page-title" style={{ marginTop: '0.3rem' }}>User Accounts</h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              Manage all Super Admin, SK Officer, and Citizen accounts across all 18 barangays.
            </p>
          </div>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.4rem' }} onClick={() => setShowModal(true)}>
            + Create SK Account
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
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

        {/* ── Filter Tabs ── */}
        <div className="filter-tabs">
          {ROLE_OPTIONS.map(r => (
            <button key={r} className={`filter-tab${filterRole === r ? ' active' : ''}`} onClick={() => setFilterRole(r)}>
              {r === 'all' ? 'All' : r === 'superadmin' ? 'Super Admin' : r === 'sk' ? 'SK Officers' : 'Citizens'} ({counts[r as keyof typeof counts] ?? counts.all})
            </button>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-wrap">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
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

        {/* ── Account Cards Grid ── */}
        {filtered.length > 0 ? (
          <div className="card-grid card-grid-3">
            {filtered.map(u => (
              <div key={u.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.75rem' }}>
                  {/* Avatar */}
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
                  <div>📧 {u.email}</div>
                  {u.barangay && <div>📍 Brgy. {u.barangay}</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(118,0,49,0.08)', paddingTop: '0.65rem' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Edit</button>
                  <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`} style={{ flex: 1 }}
                    onClick={() => setUsers(prev => prev.map(uu => uu.id === u.id ? { ...uu, isActive: !uu.isActive } : uu))}>
                    {u.isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No accounts match your filter</div>
          </div>
        )}

        {/* ── Create SK Account Modal (placeholder) ── */}
        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="modal">
              <div className="modal-header">
                <span className="modal-title">Create SK Account</span>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="notice info">
                  ℹ This form will provision an SK officer account. The system will auto-generate a username and temporary password, and send credentials to the provided email.
                </div>
                {(['Full Name', 'Email Address'] as const).map(f => (
                  <div className="field-group" key={f}>
                    <label className="field-label">{f} *</label>
                    <input className="input" type={f === 'Email Address' ? 'email' : 'text'} placeholder={f === 'Full Name' ? 'Maria Santos' : 'msantos@sk.gov.ph'} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="field-group">
                    <label className="field-label">Barangay *</label>
                    <select className="input">
                      {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Position *</label>
                    <select className="input">
                      {['Chairperson','Secretary','Treasurer','Kagawad'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => setShowModal(false)}>Create Account</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
