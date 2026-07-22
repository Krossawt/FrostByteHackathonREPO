import { barangaySummary, news, projects, cityHighlights } from '../data/mockData'

export default function PublicHome() {
  const totalBudget  = barangaySummary.reduce((s, b) => s + b.annualBudget, 0)
  const totalSpent   = barangaySummary.reduce((s, b) => s + b.spent, 0)
  const totalRemain  = totalBudget - totalSpent
  const utilizationPct = Math.round((totalSpent / totalBudget) * 100)

  const activeProjects    = projects.filter(p => p.status === 'ongoing')
  const upcomingProjects  = projects.filter(p => p.status === 'upcoming')
  const completedProjects = projects.filter(p => p.status === 'completed')

  const fmt = (n: number) => `₱${(n / 1_000_000).toFixed(1)}M`

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div className="page-intro">
          <span className="page-kicker">City Overview · Public Dashboard</span>
          <h1 className="page-title">Santa Rosa City — SK Transparency Hub</h1>
          <p className="page-subtitle">
            Consolidated SK project and financial data for all 18 barangays of Santa Rosa City, Laguna. Data reflects the 2023–2025 BSKE term under RA 10742 as amended by RA 11768.
          </p>
        </div>

        {/* ── City-Wide Stat Cards ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '2rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">{fmt(totalBudget)}</div>
            <div className="stat-label">Total SK Budget</div>
            <div className="stat-sub">All 18 barangays · FY 2025</div>
          </div>
          <div className="stat-card" style={{ '--accent': '#b45309' } as any}>
            <div className="stat-value" style={{ color: '#b45309' }}>{fmt(totalSpent)}</div>
            <div className="stat-label">Total Funds Spent</div>
            <div className="stat-sub">{utilizationPct}% utilization rate</div>
          </div>
          <div className="stat-card" style={{ '--accent': '#166534' } as any}>
            <div className="stat-value" style={{ color: '#166534' }}>{fmt(totalRemain)}</div>
            <div className="stat-label">Remaining Budget</div>
            <div className="stat-sub">Available for disbursement</div>
          </div>
          {cityHighlights.map(h => (
            <div key={h.label} className="stat-card">
              <div className="stat-value">{h.value}</div>
              <div className="stat-label">{h.label}</div>
            </div>
          ))}
        </div>

        {/* ── Project Status Breakdown ── */}
        <div className="card-grid card-grid-3" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Ongoing Projects',   count: activeProjects.length,   color: 'var(--maroon)', badge: 'badge-ongoing'   },
            { label: 'Upcoming Projects',  count: upcomingProjects.length,  color: '#1d4ed8',       badge: 'badge-upcoming'  },
            { label: 'Completed Projects', count: completedProjects.length, color: '#166534',       badge: 'badge-completed' },
          ].map(s => (
            <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <div style={{ fontSize: '2.4rem', fontFamily: 'var(--font-display)', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.count}</div>
              <div>
                <div className={`badge ${s.badge}`} style={{ marginBottom: '0.4rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>Across all 18 barangays</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Content: Projects + News ── */}
        <div className="page-cols page-cols-sidebar">

          {/* Left — Projects */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div className="page-kicker">Current Activity</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>Active & Upcoming SK Projects</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.9rem' }}>
              {projects.filter(p => p.status !== 'completed').map(p => (
                <div key={p.id} className="project-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <span className={`badge badge-${p.status}`} style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>{p.status}</span>
                      <div className="project-title">{p.title}</div>
                      <div className="project-meta">
                        <span className="project-meta-item">📍 {p.barangay}</span>
                        <span className="project-meta-item">🏷 {p.category}</span>
                        <span className="project-meta-item">📅 {p.startDate} → {p.endDate}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--maroon)', lineHeight: 1 }}>{p.progress}%</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Complete</div>
                    </div>
                  </div>
                  <p className="project-desc">{p.description}</p>
                  <div className="progress-bar progress-thick" style={{ marginTop: '0.75rem' }}>
                    <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="project-budget-row">
                    <span>Proposed Budget: <span className="project-budget-val">₱{p.proposedBudget.toLocaleString()}</span></span>
                    <span>Spent: <span className="project-budget-val">₱{p.spent.toLocaleString()}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — News Sidebar */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <div className="page-kicker">City News</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>Latest Announcements</h2>
            </div>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {news.map(item => (
                <div key={item.id} className="news-card">
                  <span className="news-cat">{item.category}</span>
                  <div className="news-title">{item.title}</div>
                  <span className="news-date">{item.date}</span>
                  <p className="news-summary">{item.summary}</p>
                </div>
              ))}
            </div>

            {/* Barangay Budget Summary */}
            <div style={{ marginTop: '1.5rem' }}>
              <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>Budget Per Barangay</div>
              <div style={{ display: 'grid', gap: '0.55rem' }}>
                {barangaySummary.map(b => {
                  const pct = Math.round((b.spent / b.annualBudget) * 100)
                  return (
                    <div key={b.barangay} className="card" style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink)' }}>{b.barangay}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--maroon)' }}>{pct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.74rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                        <span>₱{b.spent.toLocaleString()} spent</span>
                        <span>of ₱{b.annualBudget.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
