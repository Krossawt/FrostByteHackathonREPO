import { useState, useEffect, FormEvent } from 'react'
import type { UserAccount, ReportProject } from '../types'
import ProjectDetailModal from '../components/ProjectDetailModal'
import CameraCaptureModal from '../components/CameraCaptureModal'
import { DonutChart } from '../components/MiniChart'
import SingleNewsCarousel from '../components/SingleNewsCarousel'
import Portal from '../components/Portal'
import { fetchBarangayReportApi, createProjectApi, fetchNewsApi } from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'

interface SKHomeProps { user?: UserAccount | null }

const CATEGORY_OPTIONS = ['Health & Wellness', 'Education', 'Sports & Recreation', 'Infrastructure', 'Environment', 'Livelihood', 'Capacity Building', 'Peace & Order', 'Other']

const CATEGORY_IMAGES: Record<string, string> = {
  'Education': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=640&q=75',
  'Health': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=640&q=75',
  'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&q=75',
  'Environment': 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=640&q=75',
  'Livelihood': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=640&q=75',
  'Arts & Culture': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=75',
  'Governance': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=640&q=75',
  'Other': 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=640&q=75',
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
const getGrad = (cat?: string) => CATEGORY_GRAD[cat ?? 'default'] ?? CATEGORY_GRAD['default']

type Feedback = {
  type: 'success' | 'info'
  message: string
}

export default function SKHome({ user }: SKHomeProps) {
  const barangay = user?.barangay || 'Balibago'
  const position = user?.skPosition || 'Chairperson'
  const canAddProject = position === 'Chairperson' || position === 'Secretary'

  const [summary, setSummary] = useState({ spent: 0, annualBudget: 0, remaining: 0 })
  const [localProjects, setLocalProjects] = useState<ReportProject[]>([])
  const [news, setNews] = useState<any[]>([])
  const [myComments, setMyComments] = useState<any[]>([])
  const [myLogs, setMyLogs] = useState<any[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    async function loadSKHomeData() {
      try {
        const rep = await fetchBarangayReportApi(barangay)
        if (rep) {
          setSummary({
            spent: Number(rep.spent || 0),
            annualBudget: Number(rep.annualBudget || 0),
            remaining: Number(rep.remaining || 0),
          })
          if (Array.isArray(rep.projects)) {
            setLocalProjects(rep.projects.map((p: any) => {
              const proposedBudget = Number(p.projectBudget || 0)
              const spent = Number(p.projectBreakdown || 0)
              return {
                id: String(p.projectID || p.id),
                title: p.projectName || p.title,
                barangay,
                category: p.projectCategory || 'Education',
                status: p.projectStatus ? p.projectStatus.toLowerCase() as any : 'ongoing',
                proposedBudget,
                spent,
                remainingBudget: Math.max(0, proposedBudget - spent),
                progress: p.projectProgress || 0,
                progressPercent: p.projectProgress || 0,
                startDate: p.projectStartTime ? new Date(p.projectStartTime).toISOString().split('T')[0] : '',
                endDate: p.projectEndTime ? new Date(p.projectEndTime).toISOString().split('T')[0] : '',
                description: p.projectDescription || '',
                receipts: Array.isArray(p.receipts) ? p.receipts : [],
              }
            }))
          }
        }

        const newsRes = await fetchNewsApi()
        if (Array.isArray(newsRes)) {
          setNews(newsRes.map((n: any) => ({
            id: String(n.newsletterID || n.id),
            title: n.title,
            category: n.category || 'City News',
            summary: n.summary || n.fullContent || '',
            date: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : 'Today',
            image: n.imageURL || undefined,
          })))
        }
      } catch (err) {
        console.warn('API fetch warning in SKHome:', err)
      }
    }
    loadSKHomeData()
  }, [barangay])

  // Auto-dismiss feedback banner after 3 seconds
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

  const spent = summary.spent
  const budget = summary.annualBudget || 1
  const remain = summary.remaining
  const usePct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0

  const [activeTab, setActiveTab] = useState<'overview' | 'comments'>('overview')
  const [selectedProject, setSelectedProject] = useState<ReportProject | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Keeps the dashboard's project list, budget stat cards, and donut chart
  // in sync with edits/receipts made inside the modal — same pattern as
  // SKProjects, so nothing here goes stale until a manual refresh.
  const handleProjectUpdated = (updated: ReportProject) => {
    setLocalProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)))
  }

  const handleAddReceipt = (projectId: string, receipt: any) => {
    setLocalProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      const newSpent = p.spent + receipt.amount
      return {
        ...p,
        spent: newSpent,
        remainingBudget: Math.max(0, p.proposedBudget - newSpent),
        receipts: [receipt, ...(p.receipts ?? [])],
      }
    }))
    // Keep the top summary cards + donut chart in step too, since they're
    // driven by a separate `summary` object rather than derived from
    // localProjects.
    setSummary(prev => ({
      ...prev,
      spent: prev.spent + receipt.amount,
      remaining: Math.max(0, prev.remaining - receipt.amount),
    }))
  }

  // selectedProject is a snapshot from click-time — re-derive the current
  // version from localProjects after edits/receipts so the open modal
  // never shows stale data.
  const liveSelectedProject = selectedProject
    ? localProjects.find(p => p.id === selectedProject.id) ?? selectedProject
    : null

  // New project form state
  const [newTitle, setNewTitle] = useState('')
  const [newCat, setNewCat] = useState('Education')
  const [newDesc, setNewDesc] = useState('')
  const [newBudget, setNewBudget] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [formError, setFormError] = useState('')

  // Proposal File Upload & OCR State
  const [proposalFile, setProposalFile] = useState<File | null>(null)
  const [scanningProposal, setScanningProposal] = useState(false)
  const [proposalOcrMsg, setProposalOcrMsg] = useState('')
  const [showCameraModal, setShowCameraModal] = useState(false)

  // Discard-changes confirmation for the Add Project form
  const [confirmAction, setConfirmAction] = useState<'cancel' | null>(null)

  // Snapshot of the form's values right after opening — used to detect
  // whether the user actually changed anything before requesting a close.
  const [initialSnapshot, setInitialSnapshot] = useState({
    title: '',
    cat: 'Education',
    desc: '',
    budget: '',
    start: '',
    end: '',
    hasFile: false,
  })

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

  const isFormDirty = () => {
    if (newTitle !== initialSnapshot.title) return true
    if (newCat !== initialSnapshot.cat) return true
    if (newDesc !== initialSnapshot.desc) return true
    if (newBudget !== initialSnapshot.budget) return true
    if (newStart !== initialSnapshot.start) return true
    if (newEnd !== initialSnapshot.end) return true
    if (!!proposalFile !== initialSnapshot.hasFile) return true
    return false
  }

  // Only opens the Discard Changes confirmation when the form actually has
  // unsaved edits — otherwise it closes immediately, no confirmation needed.
  const requestCloseModal = () => {
    if (isFormDirty()) {
      setConfirmAction('cancel')
    } else {
      setShowAddModal(false)
    }
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
    setLocalProjects((prev: any[]) => [np, ...prev])
    setNewTitle(''); setNewCat('Education'); setNewDesc(''); setNewBudget(''); setNewStart(''); setNewEnd(''); setFormError('')
    setProposalFile(null); setProposalOcrMsg('')
    setShowAddModal(false)
    setFeedback({ type: 'success', message: 'Project created successfully' })
  }

  return (
    <section className="section">
      <div className="container">

        {/* ── Feedback Banner ── */}
        {feedback && (
          <Portal>
            <div
              style={{
                position: 'fixed',
                top: 'calc(var(--header-height, 78px) + 1rem)',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: feedback.type === 'success' ? 'rgba(22, 101, 52, 0.22)' : 'rgba(118, 0, 49, 0.18)',
                backdropFilter: 'blur(16px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
                color: feedback.type === 'success' ? '#0d3d20' : '#5c0026',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '0.9rem 1.4rem',
                borderRadius: '14px',
                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                boxShadow: feedback.type === 'success'
                  ? '0 12px 32px rgba(22,101,52,0.25), inset 0 1px 0 rgba(255,255,255,0.4)'
                  : '0 12px 32px rgba(118,0,49,0.18), inset 0 1px 0 rgba(255,255,255,0.4)',
                maxWidth: '90vw',
                animation: 'toastPop 220ms ease-out',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-6" />
              </svg>
              <span>{feedback.message}</span>
            </div>
            <style>{`
              @keyframes toastPop {
                from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.96); }
                to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
              }
            `}</style>
          </Portal>
        )}

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
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setNewTitle('')
                setNewCat('Education')
                setNewDesc('')
                setNewBudget('')
                setNewStart('')
                setNewEnd('')
                setProposalFile(null)
                setProposalOcrMsg('')
                setFormError('')
                setInitialSnapshot({
                  title: '',
                  cat: 'Education',
                  desc: '',
                  budget: '',
                  start: '',
                  end: '',
                  hasFile: false,
                })
                setShowAddModal(true)
              }}
              style={{ alignSelf: 'flex-start', marginTop: '0.4rem' }}>
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
            <div className="stat-value">{localProjects.length}</div>
            <div className="stat-label">Projects</div>
            <div className="stat-sub">{localProjects.filter((p: any) => p.status === 'ongoing').length} ongoing</div>
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

              {localProjects.length > 0 ? (
                <div className="card-grid card-grid-2" style={{ gap: '1.1rem' }}>
                  {localProjects.map((p: any) => (
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
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
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
              <SingleNewsCarousel items={news} />

              {/* Activity log */}
              <div>
                <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>Recent Activity</div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {myLogs.map((log: any) => (
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
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
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
            <div className="modal-overlay" onClick={e => {
              if (e.target === e.currentTarget)
                requestCloseModal()
            }}>
              <div className="modal" style={{ width: 'min(560px, 100%)' }}>
                <div className="modal-header">
                  <div className="modal-title">Add New SK Project</div>
                  <button className="modal-close" onClick={requestCloseModal}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleAddProject}>
                  <div className="modal-body">
                    {formError && <div className="alert-error">{formError}</div>}

                    {/* Proposal File Upload & OCR Scanner */}
                    <div style={{ marginBottom: '1rem', border: '1.5px dashed var(--maroon)', padding: '0.9rem 1rem', background: 'rgba(118,0,49,0.02)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--maroon)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
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
                    <button type="button" className="btn btn-secondary" onClick={requestCloseModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Create Project</button>
                  </div>
                </form>
              </div>
            </div>
          </Portal>
        )}

        {/* ── Project Detail Modal ── */}
        {liveSelectedProject && (
          <ProjectDetailModal
            project={liveSelectedProject}
            user={user}
            onClose={() => setSelectedProject(null)}
            onProjectUpdated={handleProjectUpdated}
            onAddReceipt={handleAddReceipt}
          />
        )}

        {/* ── Discard Changes Confirmation ── */}
        <ConfirmDialog
          isOpen={confirmAction === 'cancel'}
          title="Discard Changes"
          message="Any unsaved changes will be lost. Are you sure you want to close this form?"
          confirmLabel="Discard"
          cancelLabel="Keep Editing"
          variant="danger"
          onConfirm={() => {
            setShowAddModal(false)
            setConfirmAction(null)
            setFeedback({ type: 'info', message: 'Changes discarded' })
          }}
          onCancel={() => setConfirmAction(null)}
        />
      </div>
    </section>
  )
}
