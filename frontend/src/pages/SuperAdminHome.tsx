import { useState } from 'react'
import { barangaySummary, projects, news, activityLogs, BARANGAYS } from '../data/mockData'

interface SuperAdminHomeProps {
  selectedBarangay: string
  setSelectedBarangay: (b: string) => void
}

export default function SuperAdminHome({ selectedBarangay, setSelectedBarangay }: SuperAdminHomeProps) {
  const [view, setView] = useState<'city' | 'barangay'>(selectedBarangay ? 'barangay' : 'city')

  const totalBudget  = barangaySummary.reduce((s, b) => s + b.annualBudget, 0)
  const totalSpent   = barangaySummary.reduce((s, b) => s + b.spent, 0)
  const totalProj    = projects.length
  const usagePct     = Math.round((totalSpent / totalBudget) * 100)

  const bSummary = selectedBarangay
    ? barangaySummary.find(b => b.barangay === selectedBarangay)
    : null
  const bProjects = selectedBarangay
    ? projects.filter(p => p.barangay === selectedBarangay)
    : []

  const recentLogs = activityLogs.slice(0, 10)

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
          <div>
            <span className="page-kicker">Super Admin · City-Wide Command</span>
            <h1 className="page-title" style={{ marginTop: '0.3rem' }}>eSKala Admin Dashboard</h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              City of Santa Rosa, Laguna · All 18 Barangay SK Units · BSKE 2023–2025 Term
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignSelf: 'flex-start', marginTop: '0.4rem' }}>
            <button className="btn btn-primary btn-sm">Export Report (PDF)</button>
            <button className="btn btn-secondary btn-sm">+ Add News</button>
          </div>
        </div>

        {/* ── City-Wide Stat Cards ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">₱{(totalBudget / 1_000_000).toFixed(1)}M</div>
            <div className="stat-label">City-Wide SK Budget</div>
            <div className="stat-sub">All 18 barangays · FY 2025</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #b45309' }}>
            <div className="stat-value" style={{ color: '#b45309' }}>₱{(totalSpent / 1_000_000).toFixed(1)}M</div>
            <div className="stat-label">Total Disbursed</div>
            <div className="stat-sub">{usagePct}% utilization rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalProj}</div>
            <div className="stat-label">Total Projects</div>
            <div className="stat-sub">{projects.filter(p => p.status === 'ongoing').length} ongoing</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #1d4ed8' }}>
            <div className="stat-value" style={{ color: '#1d4ed8' }}>18</div>
            <div className="stat-label">Active Barangays</div>
            <div className="stat-sub">All units reporting</div>
          </div>
        </div>

        {/* ── City-wide utilization bar ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem' }}>City-Wide SK Fund Utilization</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)', fontSize: '1.05rem' }}>{usagePct}%</span>
          </div>
          <div className="progress-bar progress-thick">
            <div className="progress-fill" style={{ width: `${usagePct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.45rem', fontSize: '0.76rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
            <span>₱{totalSpent.toLocaleString()} disbursed</span>
            <span>of ₱{totalBudget.toLocaleString()} total city SK budget</span>
          </div>
        </div>

        {/* ── View Tabs ── */}
        <div className="filter-tabs">
          <button className={`filter-tab${view === 'city' ? ' active' : ''}`} onClick={() => setView('city')}>City Overview</button>
          <button className={`filter-tab${view === 'barangay' ? ' active' : ''}`} onClick={() => setView('barangay')}>Barangay Detail</button>
        </div>

        {/* ── VIEW: City Overview ── */}
        {view === 'city' && (
          <div className="page-cols page-cols-sidebar">

            {/* Left — Barangay Budget Cards */}
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div className="page-kicker">Barangay Breakdown</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>Budget Utilization by Barangay</h2>
              </div>
              <div className="card-grid card-grid-2">
                {barangaySummary.map(b => {
                  const pct = Math.round((b.spent / b.annualBudget) * 100)
                  return (
                    <div key={b.barangay} className="card" style={{ padding: '1rem 1.1rem', cursor: 'pointer' }}
                      onClick={() => { setSelectedBarangay(b.barangay); setView('barangay') }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)', marginBottom: '0.15rem' }}>{b.barangay}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>{b.projects} Projects</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.1rem', color: pct >= 70 ? '#b45309' : 'var(--maroon)', letterSpacing: '-0.02em' }}>
                          {pct}%
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 70 ? 'linear-gradient(90deg, #b45309, #f59e0b)' : undefined }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                        <span>₱{(b.spent / 1_000_000).toFixed(2)}M</span>
                        <span>₱{(b.annualBudget / 1_000_000).toFixed(2)}M</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right — Recent News + Activity */}
            <div style={{ display: 'grid', gap: '1.5rem', alignContent: 'start' }}>
              <div>
                <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>City News</div>
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {news.slice(0, 5).map(n => (
                    <div key={n.id} className="news-card">
                      <span className="news-cat">{n.category}</span>
                      <div className="news-title" style={{ fontSize: '0.88rem' }}>{n.title}</div>
                      <span className="news-date">{n.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>System Activity</div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {recentLogs.map(log => (
                    <div key={log.id} className="card" style={{ padding: '0.72rem 0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink)' }}>{log.action}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{log.actor} · {log.barangay}</div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--muted-light)', flexShrink: 0 }}>{log.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW: Barangay Detail ── */}
        {view === 'barangay' && (
          <div>
            {/* Barangay selector */}
            <div className="card" style={{ marginBottom: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.2rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)', flexShrink: 0 }}>View Barangay:</span>
              <select
                className="search-input" style={{ width: 'auto', paddingLeft: '0.85rem', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23760031' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.6rem center', paddingRight: '1.8rem' }}
                value={selectedBarangay} onChange={e => setSelectedBarangay(e.target.value)}>
                {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {bSummary ? (
              <>
                {/* Barangay Stats */}
                <div className="card-grid card-grid-4" style={{ marginBottom: '1.2rem' }}>
                  <div className="stat-card card-accent">
                    <div className="stat-value">₱{(bSummary.annualBudget / 1_000_000).toFixed(2)}M</div>
                    <div className="stat-label">Annual Budget</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '3px solid #b45309' }}>
                    <div className="stat-value" style={{ color: '#b45309' }}>₱{(bSummary.spent / 1_000_000).toFixed(2)}M</div>
                    <div className="stat-label">Disbursed</div>
                    <div className="stat-sub">{Math.round((bSummary.spent / bSummary.annualBudget) * 100)}% utilized</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '3px solid #166534' }}>
                    <div className="stat-value" style={{ color: '#166534' }}>₱{(bSummary.remaining / 1_000_000).toFixed(2)}M</div>
                    <div className="stat-label">Remaining</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{bSummary.projects}</div>
                    <div className="stat-label">Projects</div>
                  </div>
                </div>

                {/* Barangay Projects Grid */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div className="page-kicker">Projects · {selectedBarangay}</div>
                </div>
                {bProjects.length > 0 ? (
                  <div className="card-grid card-grid-2">
                    {bProjects.map(p => (
                      <div key={p.id} className="project-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1 }}>
                            <span className={`badge badge-${p.status}`} style={{ marginBottom: '0.3rem', display: 'inline-flex' }}>{p.status}</span>
                            <div className="project-title">{p.title}</div>
                            <div className="project-meta">
                              <span className="project-meta-item">🏷 {p.category}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--maroon)', lineHeight: 1 }}>{p.progress}%</div>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                        </div>
                        <div className="project-budget-row">
                          <span>Budget: <span className="project-budget-val">₱{p.proposedBudget.toLocaleString()}</span></span>
                          <span>Spent: <span className="project-budget-val">₱{p.spent.toLocaleString()}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No projects found for {selectedBarangay}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏘</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Select a barangay to view details</div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  )
}
