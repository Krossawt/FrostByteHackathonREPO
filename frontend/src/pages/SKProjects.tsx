import { useState, FormEvent } from 'react'
import { projects } from '../data/mockData'
import type { UserAccount } from '../types'

interface SKProjectsProps { user?: UserAccount | null }

const STATUS_OPTIONS = ['ongoing', 'upcoming', 'completed', 'cancelled'] as const
const CATEGORY_OPTIONS = ['Health & Wellness', 'Education', 'Sports & Recreation', 'Infrastructure', 'Environment', 'Livelihood', 'Capacity Building', 'Peace & Order', 'Other']

export default function SKProjects({ user }: SKProjectsProps) {
  const barangay   = user?.barangay || 'Balibago'
  const position   = user?.skPosition || 'Chairperson'
  const canEdit    = position === 'Chairperson' || position === 'Secretary'

  const myProjects  = projects.filter(p => p.barangay === barangay)
  const [filterStatus, setFilterStatus] = useState<'all' | 'ongoing' | 'upcoming' | 'completed' | 'cancelled'>('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  // New project form
  const [newTitle, setNewTitle] = useState('')
  const [newCat, setNewCat]     = useState('Education')
  const [newDesc, setNewDesc]   = useState('')
  const [newBudget, setNewBudget]= useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd]     = useState('')
  const [formError, setFormError]= useState('')
  const [localProjects, setLocalProjects] = useState(myProjects)

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

  const handleAddProject = (e: FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newBudget || !newStart || !newEnd) { setFormError('Please fill in all required fields.'); return }
    const np = {
      id: `p-${Math.random().toString(36).slice(2, 8)}`,
      title: newTitle.trim(), barangay, category: newCat as any,
      status: 'upcoming' as const, description: newDesc.trim(),
      proposedBudget: parseFloat(newBudget.replace(/,/g, '')) || 0,
      spent: 0, progress: 0, startDate: newStart, endDate: newEnd,
    }
    setLocalProjects(prev => [np, ...prev])
    setNewTitle(''); setNewCat('Education'); setNewDesc(''); setNewBudget(''); setNewStart(''); setNewEnd(''); setFormError('')
    setShowModal(false)
  }

  const totalBudget = localProjects.reduce((s, p) => s + p.proposedBudget, 0)
  const totalSpent  = localProjects.reduce((s, p) => s + p.spent, 0)

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
          <div>
            <span className="page-kicker">Project Management · {barangay}</span>
            <h1 className="page-title" style={{ marginTop: '0.3rem' }}>SK Projects — Brgy. {barangay}</h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              Manage, track, and report on all SK-funded projects for Barangay {barangay}.
              {position === 'Treasurer' && ' Treasurer access: view only. Project edits require Chairperson or Secretary.'}
            </p>
          </div>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ alignSelf: 'flex-start', marginTop: '0.4rem' }}>
              + Add New Project
            </button>
          )}
        </div>

        {/* ── Summary strip ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">{localProjects.length}</div>
            <div className="stat-label">Total Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#b45309' }}>₱{(totalBudget / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Proposed Budget</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#166534' }}>₱{(totalSpent / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Total Disbursed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{counts.ongoing}</div>
            <div className="stat-label">Currently Active</div>
            <div className="stat-sub">{counts.upcoming} upcoming</div>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="filter-tabs">
          {(['all', 'ongoing', 'upcoming', 'completed', 'cancelled'] as const).map(s => (
            <button key={s} className={`filter-tab${filterStatus === s ? ' active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="search-input" type="text" placeholder="Search by title or category…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </span>
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
                      <span className="project-meta-item">🏷 {p.category}</span>
                      <span className="project-meta-item">📅 {p.startDate} → {p.endDate}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--maroon)', lineHeight: 1 }}>{p.progress}%</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Done</div>
                  </div>
                </div>
                {p.description && <p className="project-desc">{p.description}</p>}
                <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                  <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="project-budget-row">
                  <span>Budget: <span className="project-budget-val">₱{p.proposedBudget.toLocaleString()}</span></span>
                  <span>Spent: <span className="project-budget-val">₱{p.spent.toLocaleString()}</span></span>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(118,0,49,0.08)' }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Edit Project</button>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Update Progress</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No projects match your filter</div>
            {canEdit && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
                Add First Project
              </button>
            )}
          </div>
        )}

        {/* ── Add Project Modal ── */}
        {showModal && canEdit && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="modal">
              <div className="modal-header">
                <span className="modal-title">Add New SK Project</span>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <form onSubmit={handleAddProject}>
                <div className="modal-body">
                  {formError && <div className="notice error">{formError}</div>}

                  <div className="field-group">
                    <label className="field-label">Project Title *</label>
                    <input className="input" type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Barangay Youth Health Camp 2025" required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div className="field-group">
                      <label className="field-label">Category *</label>
                      <select className="input" value={newCat} onChange={e => setNewCat(e.target.value)}>
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="field-group">
                      <label className="field-label">Proposed Budget (₱) *</label>
                      <input className="input" type="number" min="0" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="e.g., 50000" required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div className="field-group">
                      <label className="field-label">Start Date *</label>
                      <input className="input" type="date" value={newStart} onChange={e => setNewStart(e.target.value)} required />
                    </div>
                    <div className="field-group">
                      <label className="field-label">End Date *</label>
                      <input className="input" type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)} required />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Description</label>
                    <textarea className="input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description of the project's objectives and beneficiaries…" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Project</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
