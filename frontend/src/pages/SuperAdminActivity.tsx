import { useState } from 'react'
import { activityLogs, BARANGAYS } from '../data/mockData'

const ACTION_TYPES = ['All', 'Project Created', 'Receipt Uploaded', 'Account Created', 'News Published', 'Login', 'Project Updated', 'Comment Submitted']

export default function SuperAdminActivity() {
  const [search, setSearch]     = useState('')
  const [barangay, setBarangay] = useState('All')
  const [actionType, setActionType] = useState('All')

  const filtered = activityLogs.filter(l => {
    const matchBrgy   = barangay === 'All'     || l.barangay === barangay
    const matchAction = actionType === 'All'   || l.action.includes(actionType)
    const q = search.toLowerCase()
    const matchQ = !q || l.actor.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.barangay?.toLowerCase().includes(q)
    return matchBrgy && matchAction && matchQ
  })

  const actionIcon: Record<string, string> = {
    'Created': '➕',
    'Uploaded': '📤',
    'Updated': '✏️',
    'Published': '📰',
    'Login': '🔐',
    'Submitted': '💬',
    'Deleted': '🗑️',
  }

  function getIcon(action: string) {
    for (const [k, v] of Object.entries(actionIcon)) {
      if (action.includes(k)) return v
    }
    return '📋'
  }

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
          <div>
            <span className="page-kicker">Audit Trail · Super Admin</span>
            <h1 className="page-title" style={{ marginTop: '0.3rem' }}>System Activity Logs</h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              Full audit trail of all actions taken by SK officers, citizens, and admins across all 18 barangays. Compliant with RA 10742 audit requirements.
            </p>
          </div>
          <button className="btn btn-secondary" style={{ alignSelf: 'flex-start', marginTop: '0.4rem' }}>
            Export to CSV
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">{activityLogs.length}</div>
            <div className="stat-label">Total Log Entries</div>
            <div className="stat-sub">All-time system activity</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activityLogs.filter(l => l.action.includes('Created') || l.action.includes('Uploaded')).length}</div>
            <div className="stat-label">Creation Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activityLogs.filter(l => l.action.includes('Login')).length}</div>
            <div className="stat-label">Login Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{new Set(activityLogs.map(l => l.actor)).size}</div>
            <div className="stat-label">Unique Actors</div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="toolbar" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="toolbar-left" style={{ flexWrap: 'wrap' }}>
            <div className="search-wrap">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="search-input" type="text" placeholder="Search by actor, action, or barangay…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="search-input" style={{ width: 'auto', paddingLeft: '0.85rem', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23760031' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.6rem center', paddingRight: '1.8rem' }}
              value={barangay} onChange={e => setBarangay(e.target.value)}>
              <option value="All">All Barangays</option>
              {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="search-input" style={{ width: 'auto', paddingLeft: '0.85rem', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23760031' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.6rem center', paddingRight: '1.8rem' }}
              value={actionType} onChange={e => setActionType(e.target.value)}>
              {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600, alignSelf: 'center' }}>
            {filtered.length} log{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Logs as Cards ── */}
        {filtered.length > 0 ? (
          <div className="card-grid card-grid-2">
            {filtered.map(log => (
              <div key={log.id} className="card" style={{ padding: '1rem 1.1rem' }}>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <div style={{ width: '36px', height: '36px', flexShrink: 0, background: 'rgba(118,0,49,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    {getIcon(log.action)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)' }}>{log.action}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--muted-light)', flexShrink: 0 }}>{log.date}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.15rem' }}>
                      By: <strong style={{ color: 'var(--ink-2)' }}>{log.actor}</strong>
                    </div>
                    {log.barangay && (
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.76rem', color: 'var(--maroon)', fontWeight: 600 }}>
                        📍 Brgy. {log.barangay}
                      </div>
                    )}
                    {log.description && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.35rem', lineHeight: 1.55 }}>{log.description}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No activity logs match your filter</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Try adjusting your search or filter criteria.</div>
          </div>
        )}

      </div>
    </section>
  )
}
