import { useState, FormEvent } from 'react'
import { projects } from '../data/mockData'
import type { UserAccount } from '../types'
import ProjectDetailModal from '../components/ProjectDetailModal'
import ConfirmDialog from '../components/ConfirmDialog'
import CameraCaptureModal from '../components/CameraCaptureModal'
import type { ReportProject } from '../types'

interface SKProjectsProps { user?: UserAccount | null }

const STATUS_OPTIONS = ['ongoing', 'upcoming', 'completed', 'cancelled'] as const
const CATEGORY_OPTIONS = ['Health & Wellness', 'Education', 'Sports & Recreation', 'Infrastructure', 'Environment', 'Livelihood', 'Capacity Building', 'Peace & Order', 'Other']

const CATEGORY_IMAGES: Record<string, string> = {
  'Education':            'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=640&q=75',
  'Health':               'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=640&q=75',
  'Sports':               'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&q=75',
  'Environment':          'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=640&q=75',
  'Infrastructure':       'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=640&q=75',
  'Livelihood':           'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=640&q=75',
  'Capacity Building':    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&q=75',
  'Peace & Order':        'https://images.unsplash.com/photo-1589994160839-163cd867cfe8?w=640&q=75',
  'Arts & Culture':       'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=75',
  'Disaster Preparedness':'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=640&q=75',
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
  'Peace & Order': 'linear-gradient(135deg,#374151,#4b5563)',
  'default': 'linear-gradient(135deg,#760031,#9a0040)',
}

function getCover(cat?: string) { return CATEGORY_IMAGES[cat ?? 'Other'] ?? CATEGORY_IMAGES['Other'] }
function getGrad(cat?: string)  { return CATEGORY_GRAD[cat ?? 'default']  ?? CATEGORY_GRAD['default'] }

export default function SKProjects({ user }: SKProjectsProps) {
  const barangay  = user?.barangay || 'Balibago'
  const position  = user?.skPosition || 'Chairperson'
  const canEdit   = position === 'Chairperson' || position === 'Secretary'

  const myProjects = projects.filter(p => p.barangay === barangay)
  const [filterStatus, setFilterStatus] = useState<'all' | 'ongoing' | 'upcoming' | 'completed' | 'cancelled'>('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ReportProject | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<ReportProject | null>(null)
  const [localProjects, setLocalProjects] = useState(myProjects)

  // New project form
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

  const filtered = localProjects.filter(p => {
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    const q = search.toLowerCase()
    const matchQ = !q || p.title.toLowerCase().includes(q) || (p.category?.toLowerCase() ?? '').includes(q)
    return matchStatus && matchQ
  })

  const counts = {
    all: localProjects.length,
    ongoing: localProjects.filter(p => p.status === 'ongoing').length,
    upcoming: localProjects.filter(p => p.status === 'upcoming').length,
    completed: localProjects.filter(p => p.status === 'completed').length,
    cancelled: localProjects.filter(p => p.status === 'cancelled').length,
  }

  const totalBudget = localProjects.reduce((s, p) => s + p.proposedBudget, 0)
  const totalSpent  = localProjects.reduce((s, p) => s + p.spent, 0)

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
    setShowModal(false)
  }

  const handleDeleteProject = (p: ReportProject) => setProjectToDelete(p)
  const confirmDelete = () => {
    if (!projectToDelete) return
    setLocalProjects(prev => prev.filter(p => p.id !== projectToDelete.id))
    setProjectToDelete(null)
  }

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
          <div>
            <span className="page-kicker">Project Management · {barangay}</span>
            <h1 className="page-title" style={{ marginTop: '0.3rem' }}>{barangay} SK Projects</h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              Manage and track all Sangguniang Kabataan projects for Barangay {barangay}.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignSelf: 'flex-start', marginTop: '0.4rem' }}>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ New Project</button>
            )}
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">{localProjects.length}</div>
            <div className="stat-label">Total Projects</div>
            <div className="stat-sub">{counts.ongoing} ongoing, {counts.completed} completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">₱{(totalBudget / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Total Budget</div>
            <div className="stat-sub">All proposed allocations</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #b45309' }}>
            <div className="stat-value" style={{ color: '#b45309' }}>₱{(totalSpent / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Total Disbursed</div>
            <div className="stat-sub">{Math.round((totalSpent / totalBudget) * 100)}% utilization</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #166534' }}>
            <div className="stat-value" style={{ color: '#166534' }}>₱{((totalBudget - totalSpent) / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Remaining</div>
            <div className="stat-sub">Available for disbursement</div>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="filter-tabs">
          {(['all', 'ongoing', 'upcoming', 'completed', 'cancelled'] as const).map(s => (
            <button key={s} className={`filter-tab${filterStatus === s ? ' active' : ''}`}
              onClick={() => setFilterStatus(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
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
              <input className="search-input" type="text" placeholder="Search title or category…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="toolbar-right">
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
              {filtered.length} project{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Project Grid ── */}
        {filtered.length > 0 ? (
          <div className="card-grid card-grid-3">
            {filtered.map(p => (
              <div key={p.id} className="v-card" onClick={() => setSelectedProject(p)}>
                <div className="v-card-img-wrap">
                  <img
                    src={getCover(p.category)}
                    alt={p.category}
                    className="v-card-img"
                    onError={e => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=640&q=75'
                    }}
                  />
                  <div className="v-card-img-overlay" />
                  <div className="v-card-badge-pin">
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </div>
                </div>

                <div className="v-card-body">
                  <div className="v-card-kicker">{p.category}</div>
                  <div className="v-card-title">{p.title}</div>
                  <div className="v-card-date">{p.startDate} — {p.endDate}</div>
                  <p className="v-card-desc">{p.description}</p>

                  <div style={{ marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Progress</span>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)' }}>{p.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>

                  <div className="v-card-footer">
                    <div>
                      <div className="v-card-budget">₱{(p.proposedBudget / 1000).toFixed(0)}K</div>
                      <div className="v-card-budget-label">Budget</div>
                    </div>
                    {/* SK actions */}
                    {canEdit && (
                      <div style={{ display: 'flex', gap: '0.35rem' }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                          onClick={e => { e.stopPropagation(); handleDeleteProject(p) }}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.3rem' }}>No projects found</div>
            {canEdit && <div style={{ fontSize: '0.85rem' }}>Create a new project to get started.</div>}
          </div>
        )}

        {/* ── Add Project Modal ── */}
        {showModal && canEdit && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="modal" style={{ width: 'min(560px, 100%)' }}>
              <div className="modal-header">
                <div className="modal-title">Add New Project</div>
                <button className="modal-close" onClick={() => setShowModal(false)}>
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
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Project</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Project Detail Modal ── */}
        {selectedProject && (
          <ProjectDetailModal project={selectedProject} user={user} onClose={() => setSelectedProject(null)} />
        )}

        {/* ── Delete Confirmation ── */}
        <ConfirmDialog
          isOpen={!!projectToDelete}
          title="Delete Project"
          message={`Delete "${projectToDelete?.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger={true}
          onConfirm={confirmDelete}
          onCancel={() => setProjectToDelete(null)}
        />
      </div>
    </section>
  )
}
