import { useState } from 'react'
import { projects } from '../data/mockData'
import type { UserAccount } from '../types'

interface CitizenProjectsProps { user?: UserAccount | null }

export default function CitizenProjects({ user }: CitizenProjectsProps) {
  const barangay = user?.barangay || 'Balibago'
  const [status, setStatus] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all')
  const [search, setSearch] = useState('')

  const filtered = projects.filter(p => {
    const matchStatus = status === 'all' || p.status === status
    const q = search.toLowerCase()
    const matchQ = !q || p.title.toLowerCase().includes(q) || p.barangay.toLowerCase().includes(q) || (p.category?.toLowerCase() ?? '').includes(q)
    return matchStatus && matchQ
  })

  const counts = {
    all: projects.length,
    ongoing: projects.filter(p => p.status === 'ongoing').length,
    upcoming: projects.filter(p => p.status === 'upcoming').length,
    completed: projects.filter(p => p.status === 'completed').length,
  }

  const totalBudget  = projects.reduce((s, p) => s + p.proposedBudget, 0)
  const totalSpent   = projects.reduce((s, p) => s + p.spent, 0)

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div className="page-intro">
          <span className="page-kicker">Projects · All 18 Barangays</span>
          <h1 className="page-title">SK Projects — Santa Rosa City</h1>
          <p className="page-subtitle">
            Full city-wide view of SK-funded projects across all 18 barangays. As a citizen of Brgy. {barangay}, you can track your SK's projects and those across the city for transparency comparison.
          </p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">{counts.all}</div>
            <div className="stat-label">Total Projects</div>
            <div className="stat-sub">All 18 barangays</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #1d4ed8' }}>
            <div className="stat-value" style={{ color: '#1d4ed8' }}>{counts.upcoming}</div>
            <div className="stat-label">Upcoming</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{counts.ongoing}</div>
            <div className="stat-label">Ongoing</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #166534' }}>
            <div className="stat-value" style={{ color: '#166534' }}>{counts.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        {/* ── Budget summary strip ── */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '2.5rem', alignItems: 'center', padding: '1rem 1.3rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--maroon)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Proposed Budget</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--maroon)', letterSpacing: '-0.03em' }}>₱{totalBudget.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Disbursed</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.4rem', color: '#b45309', letterSpacing: '-0.03em' }}>₱{totalSpent.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Utilization</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.4rem', color: '#166534', letterSpacing: '-0.03em' }}>{Math.round((totalSpent / totalBudget) * 100)}%</div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className="progress-bar progress-thick" style={{ marginTop: '0.4rem' }}>
              <div className="progress-fill" style={{ width: `${Math.round((totalSpent / totalBudget) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* ── Status Filter Tabs ── */}
        <div className="filter-tabs">
          {(['all', 'ongoing', 'upcoming', 'completed'] as const).map(s => (
            <button key={s} className={`filter-tab${status === s ? ' active' : ''}`} onClick={() => setStatus(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)} <span style={{ opacity: 0.65, fontWeight: 400, marginLeft: '0.25rem' }}>({counts[s]})</span>
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-wrap">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="search-input" type="text" placeholder="Search projects by title, barangay, or category…"
                value={search} onChange={e => setSearch(e.target.value)} style={{ width: '320px' }} />
            </div>
          </div>
          <div className="toolbar-right">
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
              {filtered.length} project{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Projects Grid ── */}
        {filtered.length > 0 ? (
          <div className="card-grid card-grid-2">
            {filtered.map(p => (
              <div key={p.id} className="project-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <span className={`badge badge-${p.status}`} style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>{p.status}</span>
                    <div className="project-title">{p.title}</div>
                    <div className="project-meta">
                      <span className="project-meta-item">📍 {p.barangay}</span>
                      <span className="project-meta-item">🏷 {p.category}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--maroon)', lineHeight: 1 }}>{p.progress}%</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Done</div>
                  </div>
                </div>
                <p className="project-desc">{p.description}</p>
                <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                  <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="project-budget-row">
                  <span>Proposed: <span className="project-budget-val">₱{p.proposedBudget.toLocaleString()}</span></span>
                  <span>Spent: <span className="project-budget-val">₱{p.spent.toLocaleString()}</span></span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.76rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
                  📅 {p.startDate} — {p.endDate}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No projects match your filter</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Try changing the status tab or search term.</div>
          </div>
        )}

      </div>
    </section>
  )
}
