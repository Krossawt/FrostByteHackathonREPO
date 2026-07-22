import { useState } from 'react'
import { barangaySummary, projects, news, activityLogs, BARANGAYS } from '../data/mockData'

interface SuperAdminHomeProps {
  selectedBarangay: string
  setSelectedBarangay: (b: string) => void
}

export default function SuperAdminHome({ selectedBarangay, setSelectedBarangay }: SuperAdminHomeProps) {
  const [view, setView] = useState<'city' | 'barangay'>(selectedBarangay ? 'barangay' : 'city')

  // Dynamic States for data updates
  const [barangayList, setBarangayList] = useState(barangaySummary)
  const [logs, setLogs] = useState(activityLogs)

  // Budget modal and form states
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [cityBudgetOverride, setCityBudgetOverride] = useState<number | null>(null)
  const [annualYear, setAnnualYear] = useState('2025')
  const [approvedBudget, setApprovedBudget] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const openBudgetModal = () => {
    setShowBudgetModal(true)
  }

  const handleCloseBudgetModal = () => {
    setShowBudgetModal(false)
    setAnnualYear('2025')
    setApprovedBudget('')
    setSelectedFile(null)
    setSuccessMessage('')
    setErrorMessage('')
  }

  const handleSubmitBudget = (e: React.FormEvent) => {
    e.preventDefault()
    if (!approvedBudget || parseFloat(approvedBudget) <= 0) {
      setErrorMessage('Please enter a valid approved budget.')
      return
    }
    if (!selectedFile) {
      setErrorMessage('Please upload a supporting document.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    // Simulate API submission delay
    setTimeout(() => {
      const budgetVal = parseFloat(approvedBudget)

      // Set city-wide budget override
      setCityBudgetOverride(budgetVal)

      // Create new activity log
      const newLog = {
        id: `log-${Date.now()}`,
        user: 'SCC Super Admin',
        actor: 'SCC Super Admin',
        barangay: 'City-Wide',
        action: `Approved Overall City SK Budget (FY ${annualYear}) - ₱${budgetVal.toLocaleString()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        when: 'Just now'
      }
      setLogs(prev => [newLog, ...prev])

      setIsSubmitting(false)
      setSuccessMessage(`Overall SK Annual Budget (FY ${annualYear}) has been successfully submitted!`)
    }, 1000)
  }

  const totalBudget  = cityBudgetOverride !== null ? cityBudgetOverride : barangayList.reduce((s, b) => s + b.annualBudget, 0)
  const totalSpent   = barangayList.reduce((s, b) => s + b.spent, 0)
  const totalProj    = projects.length
  const usagePct     = Math.round((totalSpent / totalBudget) * 100)

  const bSummary = selectedBarangay
    ? barangayList.find(b => b.barangay === selectedBarangay)
    : null
  const bProjects = selectedBarangay
    ? projects.filter(p => p.barangay === selectedBarangay)
    : []

  const recentLogs = logs.slice(0, 10)

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
            <button className="btn btn-primary btn-sm" onClick={openBudgetModal}>Submit Annual Budget</button>
            <button className="btn btn-secondary btn-sm">Export Report (PDF)</button>
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
                {barangayList.map(b => {
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

        {/* ── Submit Budget Modal ── */}
        {showBudgetModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) handleCloseBudgetModal() }}>
            <div className="modal" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <span className="modal-title">Submit Annual Budget</span>
                <button className="modal-close" onClick={handleCloseBudgetModal}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <form onSubmit={handleSubmitBudget}>
                <div className="modal-body">
                  {successMessage && (
                    <div className="notice success" style={{ marginBottom: '0.5rem' }}>
                      {successMessage}
                    </div>
                  )}
                  {errorMessage && (
                    <div className="notice error" style={{ marginBottom: '0.5rem' }}>
                      {errorMessage}
                    </div>
                  )}
                  
                  {!successMessage && (
                    <>
                      <div className="field-group">
                        <label className="field-label">Annual Year *</label>
                        <select 
                          className="input" 
                          value={annualYear} 
                          onChange={e => setAnnualYear(e.target.value)}
                          required
                        >
                          <option value="2023">2023</option>
                          <option value="2024">2024</option>
                          <option value="2025">2025</option>
                          <option value="2026">2026</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Approved SK Budget (₱) *</label>
                        <input 
                          type="number" 
                          className="input" 
                          placeholder="e.g. 2500000"
                          value={approvedBudget}
                          onChange={e => setApprovedBudget(e.target.value)}
                          min="1"
                          required
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label">Supporting Documents (Attachment Upload) *</label>
                        {selectedFile ? (
                          <div style={{
                            border: '1.5px dashed var(--maroon)',
                            background: 'rgba(118, 0, 49, 0.03)',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                              <div style={{ textAlign: 'left' }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink)' }}>{selectedFile.name}</div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>{(selectedFile.size / 1024).toFixed(1)} KB</div>
                              </div>
                            </div>
                            <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setSelectedFile(null)}>
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="upload-zone">
                            <input
                              type="file"
                              style={{ display: 'none' }}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                              onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                  setSelectedFile(e.target.files[0])
                                }
                              }}
                              required
                            />
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            <div>
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--maroon)' }}>Click to upload</span> or drag and drop
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>PDF, DOCX, XLSX, or Images up to 10MB</span>
                          </label>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  {successMessage ? (
                    <button type="button" className="btn btn-primary" onClick={handleCloseBudgetModal}>
                      Close
                    </button>
                  ) : (
                    <>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseBudgetModal} disabled={isSubmitting}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Budget'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
