import { useState } from 'react'
import { barangaySummary, projects, news, activityLogs } from '../data/mockData'
import { DonutChart } from '../components/MiniChart'

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

  const displayBudget = selectedBarangay && bSummary ? bSummary.annualBudget : totalBudget
  const displaySpent  = selectedBarangay && bSummary ? bSummary.spent : totalSpent
  const displayProj   = selectedBarangay ? bProjects.length : totalProj
  const displayUsage  = Math.min(Math.round((displaySpent / (displayBudget || 1)) * 100), 100)

  const recentLogs = logs.slice(0, 10)

  return (
    <section className="section section-accent-flow" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
      <div className="container">

        {/* ── Page Intro Banner ── */}
        <div className="page-intro reveal section-glass-grid" style={{ padding: '1.5rem 1.8rem', borderRadius: '12px', marginBottom: '1.8rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,244,235,0.9) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="page-kicker">City Executive Command · Super Admin</span>
              <h1 className="page-title" style={{ marginTop: '0.3rem' }}>
                Santa Rosa City SK Executive Dashboard
                {selectedBarangay && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--maroon)', fontWeight: 700, marginLeft: '0.6rem' }}>
                    · Barangay {selectedBarangay} Mode
                  </span>
                )}
              </h1>
              <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
                {selectedBarangay
                  ? `Viewing official financial breakdown, projects, and transactions for Barangay ${selectedBarangay}.`
                  : 'Financial and operational oversight across all 18 barangays of Santa Rosa City, Laguna. Data updated for FY 2025.'}
              </p>
            </div>
            <button className="btn btn-gold btn-sm" onClick={openBudgetModal} style={{ alignSelf: 'flex-start', marginTop: '0.4rem' }}>
              + Post Approved Annual Budget
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="card-grid card-grid-4 reveal" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">₱{(displayBudget / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">{selectedBarangay ? `Barangay ${selectedBarangay} Budget` : 'Total SK Budget FY 2025'}</div>
            <div className="stat-sub">{selectedBarangay ? 'FY 2025 Allocation' : '18 Barangays combined'}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #b45309' }}>
            <div className="stat-value" style={{ color: '#b45309' }}>₱{(displaySpent / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Total Disbursed</div>
            <div className="stat-sub">{displayUsage}% utilization rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{displayProj}</div>
            <div className="stat-label">Total Projects</div>
            <div className="stat-sub">{(selectedBarangay ? bProjects : projects).filter(p => p.status === 'ongoing').length} ongoing</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #1d4ed8' }}>
            <div className="stat-value" style={{ color: '#1d4ed8' }}>{selectedBarangay ? '1' : '18'}</div>
            <div className="stat-label">{selectedBarangay ? 'Barangay Selected' : 'Active Barangays'}</div>
            <div className="stat-sub">{selectedBarangay ? `Unit: ${selectedBarangay}` : 'All units reporting'}</div>
          </div>
        </div>

        {/* ── City-wide utilization bar + chart ── */}
        <div className="card-grid card-grid-2 reveal" style={{ marginBottom: '1.5rem' }}>
          <div className="chart-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <DonutChart value={usagePct} size={110} stroke={14} label={`${usagePct}%`} sublabel="used" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem' }}>City-Wide SK Fund Utilization</div>
              {[
                { label: 'Total Budget', val: `₱${(totalBudget/1_000_000).toFixed(1)}M`, color: 'var(--maroon)' },
                { label: 'Disbursed',    val: `₱${(totalSpent/1_000_000).toFixed(1)}M`,  color: '#b45309' },
                { label: 'Remaining',   val: `₱${((totalBudget-totalSpent)/1_000_000).toFixed(1)}M`, color: '#166534' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.75rem' }}>Project Status Breakdown</div>
            {[
              { label: 'Ongoing',   count: projects.filter(p => p.status === 'ongoing').length,   color: 'var(--maroon)' },
              { label: 'Upcoming',  count: projects.filter(p => p.status === 'upcoming').length,  color: '#1d4ed8' },
              { label: 'Completed', count: projects.filter(p => p.status === 'completed').length, color: '#166534' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 900, color: s.color, lineHeight: 1, minWidth: '2rem' }}>{s.count}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>{s.label} projects</div>
              </div>
            ))}
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
            {bSummary ? (
              <>
                {/* Banner */}
                <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'linear-gradient(135deg, var(--maroon), var(--maroon-dark))', color: '#fff' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Barangay {selectedBarangay}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.1rem' }}>{bSummary.projects} projects · ₱{(bSummary.annualBudget/1_000_000).toFixed(2)}M allocated</div>
                </div>

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

                {/* Projects list */}
                <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>Projects · {selectedBarangay}</div>
                {bProjects.length > 0 ? (
                  <div className="card-grid card-grid-2">
                    {bProjects.map(p => (
                      <div key={p.id} className="project-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1 }}>
                            <span className={`badge badge-${p.status}`} style={{ marginBottom: '0.3rem', display: 'inline-flex' }}>{p.status}</span>
                            <div className="project-title">{p.title}</div>
                            <div className="project-meta">
                              <span className="project-meta-item">{p.category}</span>
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
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Select a barangay from the header dropdown to view its details</div>
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
