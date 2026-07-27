import { useState, FormEvent } from 'react'
import { barangaySummary, projects, citizenComments, activityLogs } from '../data/mockData'
import type { UserAccount, ReportProject } from '../types'
import ProjectDetailModal from '../components/ProjectDetailModal'
import CameraCaptureModal from '../components/CameraCaptureModal'
import { DonutChart } from '../components/MiniChart'
import SingleNewsCarousel from '../components/SingleNewsCarousel'
import Portal from '../components/Portal'

interface SKHomeProps { user?: UserAccount | null }

const CATEGORY_OPTIONS = ['Health & Wellness', 'Education', 'Sports & Recreation', 'Infrastructure', 'Environment', 'Livelihood', 'Capacity Building', 'Peace & Order', 'Other']

const CATEGORY_IMAGES: Record<string, string> = {
  'Education':            'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=640&q=75',
  'Health':               'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=640&q=75',
  'Sports':               'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&q=75',
  'Environment':          'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=640&q=75',
  'Livelihood':           'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=640&q=75',
  'Arts & Culture':       'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=75',
  'Governance':           'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=640&q=75',
  'Other':                'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=640&q=75',
}
const CATEGORY_GRAD: Record<string, string> = {
  'Education': 'linear-gradient(135deg,#1d4ed8,#1e40af)',
  'Health': 'linear-gradient(135deg,#166534,#15803d)',
  'Sports': 'linear-gradient(135deg,#b45309,#d97706)',
  'Environment': 'linear-gradient(135deg,#166534,#4ade80)',
  'Livelihood': 'linear-gradient(135deg,#6d28d9,#7c3aed)',
  'Arts & Culture': 'linear-gradient(135deg,#be185d,#e11d48)',
  'default': 'linear-gradient(135deg,#760031,#9a0040)',
}
const getCover = (cat?: string) => CATEGORY_IMAGES[cat ?? 'Other'] ?? CATEGORY_IMAGES['Other']
const getGrad  = (cat?: string) => CATEGORY_GRAD[cat ?? 'default']  ?? CATEGORY_GRAD['default']

export default function SKHome({ user }: SKHomeProps) {
  const barangay = user?.barangay || 'Balibago'
  const position = user?.skPosition || 'Chairperson'
  const canAddProject = position === 'Chairperson' || position === 'Secretary'

  const summary    = barangaySummary.find(b => b.barangay === barangay)
  const myProjects = projects.filter(p => p.barangay === barangay)
  const myComments = citizenComments.filter(c => c.barangay === barangay)
  const myLogs     = activityLogs.filter(l => l.barangay === barangay).slice(0, 6)

  const spent  = summary?.spent ?? 0
  const budget = summary?.annualBudget ?? 1
  const remain = summary?.remaining ?? 0
  const usePct = Math.min(Math.round((spent / budget) * 100), 100)

  const [activeTab, setActiveTab] = useState<'overview' | 'comments'>('overview')
  const [selectedProject, setSelectedProject] = useState<ReportProject | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [localProjects, setLocalProjects] = useState(myProjects)

  // New project form state
  const [newTitle, setNewTitle] = useState('')
  const [newCat, setNewCat]     = useState('Education')
  const [newDesc, setNewDesc]   = useState('')
  const [newBudget, setNewBudget] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd]     = useState('')
  const [formError, setFormError] = useState('')

  // Proposal File Upload & OCR State
  const [proposalFile, setProposalFile] = useState<File | null>(null)
  const [scanningProposal, setScanningProposal] = useState(false)
  const [proposalOcrMsg, setProposalOcrMsg] = useState('')
  const [showCameraModal, setShowCameraModal] = useState(false)

  const handleScanProposal = () => {
    setScanningProposal(true)
    setProposalOcrMsg('Scanning proposal document via AI OCR...')
    setTimeout(() => {
      setNewTitle('Barangay Youth Sports & Leadership Summit 2025')
      setNewCat('Sports & Recreation')
      setNewBudget('175000')
      setNewStart(new Date().toISOString().slice(0, 10))
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      setNewEnd(nextMonth.toISOString().slice(0, 10))
      setNewDesc('Community-wide youth sports league, physical wellness workshops, and leadership development activities based on the official SK proposal.')
      setScanningProposal(false)
      setProposalOcrMsg('✓ Proposal Scanned! Extracted Title, Dates, Budget (₱175,000.00), and Description. All values below remain fully editable.')
    }, 1200)
  }

  const handleCameraSnap = () => {
    setShowCameraModal(false)
    handleScanProposal()
  }

  const handleAddProject = (e: FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newBudget || !newStart || !newEnd) { setFormError('Please fill in all required fields.'); return }
    const np: ReportProject = {
      id: `p-${Math.random().toString(36).slice(2, 8)}`,
      title: newTitle.trim(), barangay, category: newCat as any,
      status: 'upcoming', description: newDesc.trim(),
      proposedBudget: parseFloat(newBudget.replace(/,/g, '')) || 0,
      spent: 0, progress: 0, startDate: newStart, endDate: newEnd,
    }
    projects.unshift(np)
    setLocalProjects(prev => [np, ...prev])
    setNewTitle(''); setNewCat('Education'); setNewDesc(''); setNewBudget(''); setNewStart(''); setNewEnd(''); setFormError('')
    setProposalFile(null); setProposalOcrMsg('')
    setShowAddModal(false)
  }

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
          <div>
            <span className="page-kicker">SK Dashboard · Barangay {barangay}</span>
            <h1 className="page-title" style={{ marginTop: '0.3rem' }}>Welcome, {user?.name?.split(' ')[0] ?? 'SK Officer'}</h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              {position} · Barangay {barangay}, Santa Rosa City, Laguna
            </p>
          </div>
          {canAddProject && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)} style={{ alignSelf: 'flex-start', marginTop: '0.4rem' }}>
              + Add Project
            </button>
          )}
        </div>

        {/* ── Financial Stat Cards ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">{budget === 0 ? '₱0' : `₱${(budget / 1_000_000).toFixed(2)}M`}</div>
            <div className="stat-label">Annual Budget</div>
            <div className="stat-sub">FY 2025 allocation</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #b45309' }}>
            <div className="stat-value" style={{ color: '#b45309' }}>{spent === 0 ? '₱0' : `₱${(spent / 1_000_000).toFixed(2)}M`}</div>
            <div className="stat-label">Amount Disbursed</div>
            <div className="stat-sub">{usePct}% of budget used</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #166534' }}>
            <div className="stat-value" style={{ color: '#166534' }}>{remain === 0 ? '₱0' : `₱${(remain / 1_000_000).toFixed(2)}M`}</div>
            <div className="stat-label">Remaining</div>
            <div className="stat-sub">Available for projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{myProjects.length}</div>
            <div className="stat-label">Projects</div>
            <div className="stat-sub">{myProjects.filter(p => p.status === 'ongoing').length} ongoing</div>
          </div>
        </div>

        {/* ── Budget Utilization Chart ── */}
        <div className="chart-card" style={{ marginBottom: '1.5rem', flexDirection: 'row', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <DonutChart
            value={usePct} size={110} stroke={14}
            label={`${usePct}%`} sublabel="used"
          />
          <div style={{ flex: 1, minWidth: '160px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Budget Utilization — Brgy. {barangay}
            </div>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {[
                { label: 'Total Budget', val: `₱${budget.toLocaleString()}`, color: 'var(--maroon)' },
                { label: 'Disbursed', val: `₱${spent.toLocaleString()}`, color: '#b45309' },
                { label: 'Remaining', val: `₱${remain.toLocaleString()}`, color: '#166534' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontFamily: 'var(--font-display)' }}>
                  <span style={{ color: 'var(--muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="filter-tabs">
          <button className={`filter-tab${activeTab === 'overview' ? ' active' : ''}`} onClick={() => setActiveTab('overview')}>
            Projects &amp; Activity
          </button>
          <button className={`filter-tab${activeTab === 'comments' ? ' active' : ''}`} onClick={() => setActiveTab('comments')}>
            Citizen Feedback ({myComments.length})
          </button>
        </div>

        {/* ── Tab: Overview ── */}
        {activeTab === 'overview' && (
          <div className="page-cols page-cols-sidebar">

            {/* Projects — vertical cards */}
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div className="page-kicker">Project Management</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                  {barangay} SK Projects
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500, marginLeft: '0.5rem' }}>
                    (Click any card to view details &amp; manage receipts)
                  </span>
                </h2>
              </div>

              {myProjects.length > 0 ? (
                <div className="card-grid card-grid-2" style={{ gap: '1.1rem' }}>
                  {myProjects.map(p => (
                    <div key={p.id} className="v-card" onClick={() => setSelectedProject(p)}>
                      <div className="v-card-img-wrap" style={{ height: 140 }}>
                        <img
                          src={getCover(p.category)} alt={p.category} className="v-card-img"
                          onError={e => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=640&q=75'
                          }}
                        />
                        <div className="v-card-img-overlay" />
                        <div className="v-card-badge-pin">
                          <span className={`badge badge-${p.status}`}>{p.status}</span>
                        </div>
                      </div>

                      <div className="v-card-body" style={{ padding: '0.9rem 1rem 1rem' }}>
                        <div className="v-card-kicker">{p.category}</div>
                        <div className="v-card-title" style={{ fontSize: '0.9rem' }}>{p.title}</div>
                        <div className="v-card-date">{p.startDate} — {p.endDate}</div>

                        <div style={{ marginTop: '0.35rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Progress</span>
                            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)' }}>{p.progress}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                          </div>
                        </div>

                        <div className="v-card-footer" style={{ paddingTop: '0.6rem' }}>
                          <div>
                            <div className="v-card-budget" style={{ fontSize: '0.95rem' }}>₱{(p.proposedBudget / 1000).toFixed(0)}K</div>
                            <div className="v-card-budget-label">Budget</div>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                            View &amp; Finances
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No projects yet</div>
                  {canAddProject && <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Add your first SK project.</div>}
                </div>
              )}
            </div>

            {/* Right: Single Featured News Carousel + Activity Log */}
            <div style={{ display: 'grid', gap: '1.4rem', alignContent: 'start' }}>

              {/* Single News Carousel (Replaces vertical news list & SK Council list) */}
              <SingleNewsCarousel />

              {/* Activity log */}
              <div>
                <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>Recent Activity</div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {myLogs.map(log => (
                    <div key={log.id} className="card" style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink)' }}>{log.action}</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--muted-light)', fontFamily: 'var(--font-display)' }}>{log.date}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{log.actor}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Citizen Feedback ── */}
        {activeTab === 'comments' && (
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <div className="page-kicker">Community Feedback · {barangay}</div>
            {myComments.length > 0 ? myComments.map(c => (
              <div key={c.id} className="comment-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="comment-author">{c.author}</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {c.type && <span className={`badge ${c.type === 'suggestion' ? 'badge-upcoming' : 'badge-ongoing'}`}>{c.type}</span>}
                    {c.votes !== undefined && (
                      <span className="comment-votes">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        {c.votes} helpful
                      </span>
                    )}
                  </div>
                </div>
                <span className="comment-date">{c.date}</span>
                <p className="comment-text">{c.text}</p>
              </div>
            )) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No citizen feedback yet</div>
              </div>
            )}
          </div>
        )}

        {/* ── Add Project Modal (Secretary & Chairperson) ── */}
        {showAddModal && canAddProject && (
          <Portal>
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
            <div className="modal" style={{ width: 'min(560px, 100%)' }}>
              <div className="modal-header">
                <div className="modal-title">Add New SK Project</div>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <form onSubmit={handleAddProject}>
                <div className="modal-body">
                  {formError && <div className="alert-error">{formError}</div>}

                  {/* Proposal File Upload & OCR Scanner */}
                  <div style={{ marginBottom: '1rem', border: '1.5px dashed var(--maroon)', padding: '0.9rem 1rem', background: 'rgba(118,0,49,0.02)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--maroon)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload Proposal File or Capture Document (OCR Auto-Fill)
                    </div>
                    {proposalFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-display)' }}>
                          <strong>{proposalFile.name}</strong> ({(proposalFile.size / 1024).toFixed(1)} KB)
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCameraModal(true)}>
                            📷 Open Camera
                          </button>
                          <button type="button" className="btn btn-gold btn-sm" onClick={handleScanProposal} disabled={scanningProposal}>
                            {scanningProposal ? 'Scanning Proposal...' : '⚡ Auto-Scan Proposal (OCR)'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            style={{ display: 'none' }}
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                setProposalFile(e.target.files[0])
                              }
                            }}
                          />
                          <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none' }}>
                            Browse File
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                            Attach proposal file
                          </span>
                        </label>
                        <button type="button" className="btn btn-gold btn-sm" onClick={() => setShowCameraModal(true)}>
                          📷 Open Camera / Snap Photo
                        </button>
                      </div>
                    )}
                  </div>
                  {proposalOcrMsg && <div className="notice info" style={{ marginBottom: '0.85rem', fontSize: '0.78rem' }}>{proposalOcrMsg}</div>}

                  {showCameraModal && (
                    <CameraCaptureModal
                      title="Capture Project Proposal Document"
                      subtitle="Position official project proposal document inside reticle and snap photo"
                      onCapture={handleCameraSnap}
                      onClose={() => setShowCameraModal(false)}
                    />
                  )}

                  <div className="form-group">
                    <label className="form-label">Project Title *</label>
                    <input className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Youth Digital Literacy Workshop" />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select className="form-input" value={newCat} onChange={e => setNewCat(e.target.value)}>
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Proposed Budget (₱) *</label>
                      <input className="form-input" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="e.g. 250000" />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Start Date *</label>
                      <input className="form-input" type="date" value={newStart} onChange={e => setNewStart(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date *</label>
                      <input className="form-input" type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description of the project…" style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Project</button>
                </div>
              </form>
            </div>
          </div>
          </Portal>
        )}

        {/* ── Project Detail Modal ── */}
        {selectedProject && (
          <ProjectDetailModal project={selectedProject} user={user} onClose={() => setSelectedProject(null)} />
        )}

      </div>
    </section>
  )
}
