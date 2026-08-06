import { useState, useEffect, FormEvent } from 'react'
import type { UserAccount } from '../types'
import ProjectDetailModal from '../components/ProjectDetailModal'
import ConfirmDialog from '../components/ConfirmDialog'
import DateInput from '../components/DateInput'
import type { ReportProject } from '../types'
import Portal from '../components/Portal'
import { fetchProjectsApi, createProjectApi, updateProjectApi, deleteProjectApi, normalizeProjectStatus, isProjectOngoing } from '../services/api'
import { formatCurrency } from '../utils/formatCurrency';

interface SKProjectsProps { user?: UserAccount | null }

const STATUS_OPTIONS = ['ongoing', 'upcoming', 'completed', 'cancelled'] as const
const CATEGORY_OPTIONS = ['Health & Wellness', 'Education', 'Sports & Recreation', 'Infrastructure', 'Environment', 'Livelihood', 'Capacity Building', 'Peace & Order', 'Other']

const CATEGORY_IMAGES: Record<string, string> = {
  'Education': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=640&q=75',
  'Health': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=640&q=75',
  'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&q=75',
  'Environment': 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=640&q=75',
  'Infrastructure': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=640&q=75',
  'Livelihood': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=640&q=75',
  'Capacity Building': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&q=75',
  'Peace & Order': 'https://images.unsplash.com/photo-1589994160839-163cd867cfe8?w=640&q=75',
  'Arts & Culture': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=75',
  'Disaster Preparedness': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=640&q=75',
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
  'Peace & Order': 'linear-gradient(135deg,#374151,#4b5563)',
  'default': 'linear-gradient(135deg,#760031,#9a0040)',
}

function getCover(cat?: string) { return CATEGORY_IMAGES[cat ?? 'Other'] ?? CATEGORY_IMAGES['Other'] }
function getGrad(cat?: string) { return CATEGORY_GRAD[cat ?? 'default'] ?? CATEGORY_GRAD['default'] }

// Merged in from the remote version — normalizes raw API status strings
// (which may say things like "For Approval" or "Posted") into the four
// statuses this UI actually renders, instead of just lowercasing blindly.
const STATUS_LEVELS: Record<string, number> = {
  'Incoming': 1, 'incoming': 1, 'upcoming': 1, 'drafted': 1, 'Drafted': 1,
  'In Progress': 2, 'in progress': 2, 'Ongoing': 2, 'ongoing': 2, 'active': 2,
  'Completed': 3, 'completed': 3, 'posted': 3, 'Posted': 3,
}

function getStatusLevel(st?: string): number {
  if (!st) return 1
  if (STATUS_LEVELS[st]) return STATUS_LEVELS[st]
  const norm = normalizeProjectStatus({ projectStatus: st })
  if (norm === 'Completed') return 3
  if (norm === 'Ongoing') return 2
  return 1
}

function mapApiProjectToReportProject(project: any, fallbackBarangay: string): ReportProject {
  const normStatus = normalizeProjectStatus(project)
  const status: ReportProject['status'] = normStatus === 'Completed' ? 'completed' : normStatus === 'Incoming' ? 'upcoming' : 'ongoing'

  const proposedBudget = Number(project?.projectBudget ?? project?.proposedBudget ?? 0)
  const spent = Number(project?.projectBreakdown ?? project?.spent ?? 0)
  const startDateValue = project?.projectStartTime || project?.startDate || ''
  const endDateValue = project?.projectEndTime || project?.endDate || ''

  return {
    id: String(project?.projectID || project?.id || ''),
    title: project?.projectName || project?.title || 'Untitled Project',
    barangay: project?.projectLocation || project?.barangay || fallbackBarangay,
    category: project?.projectCategory || project?.category || 'Education',
    status,
    proposedBudget,
    spent,
    remainingBudget: Math.max(0, proposedBudget - spent),
    progress: Number(project?.projectProgress ?? project?.progress ?? 0),
    progressPercent: Number(project?.projectProgress ?? project?.progress ?? 0),
    startDate: startDateValue ? new Date(startDateValue).toISOString().split('T')[0] : '',
    endDate: endDateValue ? new Date(endDateValue).toISOString().split('T')[0] : '',
    description: project?.projectDescription || project?.description || '',
    receipts: project?.receipts ?? [],
  }
}

type Feedback = { type: 'success' | 'info'; message: string }

export default function SKProjects({ user }: SKProjectsProps) {
  const barangay = user?.barangay || 'Balibago'
  const position = user?.skPosition || 'Chairperson'
  const canEdit = position === 'Chairperson' || position === 'Secretary'
  const canAttachReceipt = position === 'Chairperson' || position === 'Treasurer'
  const canShowActions = canEdit || canAttachReceipt

  const [filterStatus, setFilterStatus] = useState<'all' | 'ongoing' | 'upcoming' | 'completed' | 'cancelled'>('all')
  const [search, setSearch] = useState('')
  const [formMode, setFormMode] = useState<'new' | ReportProject | null>(null)
  const [selectedProject, setSelectedProject] = useState<ReportProject | null>(null)
  const [openReceiptDirect, setOpenReceiptDirect] = useState(false)
  const [openEditDirect, setOpenEditDirect] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<ReportProject | null>(null)
  const [localProjects, setLocalProjects] = useState<ReportProject[]>([])

  // Merged in from the remote version — surfaces loading/error state for
  // the project list instead of failing silently.
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [projectsError, setProjectsError] = useState('')

  // Merged in from the remote version — surfaces loading/error state for
  // the delete action instead of failing silently.
  const [isDeletingProject, setIsDeletingProject] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Feedback banner (glass-style, portal-rendered — success = green, info = maroon)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  // Discard-changes confirmation for the Add/Edit Project form
  const [confirmAction, setConfirmAction] = useState<'cancel' | null>(null)

  // Load live API projects
  useEffect(() => {
    async function loadProjects() {
      setIsLoadingProjects(true)
      setProjectsError('')
      try {
        const res = await fetchProjectsApi({ barangay, public_only: false })
        if (Array.isArray(res)) {
          const mapped: ReportProject[] = res.map((p: any) => mapApiProjectToReportProject(p, barangay))
          setLocalProjects(mapped)
        }
      } catch (err: any) {
        console.warn('API error fetching projects:', err)
        setProjectsError(err.message || 'Unable to load projects right now.')
      } finally {
        setIsLoadingProjects(false)
      }
    }
    loadProjects()
  }, [barangay])

  // Auto-dismiss feedback banner after 3 seconds
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

  // Project form (shared between Add and Edit)
  const [newTitle, setNewTitle] = useState('')
  const [newCat, setNewCat] = useState('Education')
  const [newDesc, setNewDesc] = useState('')
  const [newBudget, setNewBudget] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [newStatus, setNewStatus] = useState<string>('Incoming')
  const [pendingStatusConfirm, setPendingStatusConfirm] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  // Proposal file attachment state (create mode only)
  const [proposalFile, setProposalFile] = useState<File | null>(null)

  // Snapshot of the form's values right after opening — used to detect
  // whether the user actually changed anything before requesting a close.
  const [initialSnapshot, setInitialSnapshot] = useState({
    title: '', cat: 'Education', desc: '', budget: '', start: '', end: '', status: 'Incoming', hasFile: false,
  })

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
  const totalSpent = localProjects.reduce((s, p) => s + p.spent, 0)

  const openAddForm = () => {
    setNewTitle(''); setNewCat('Education'); setNewDesc('')
    setNewBudget(''); setNewStart(''); setNewEnd(''); setNewStatus('Incoming')
    setProposalFile(null); setFormError('')
    setInitialSnapshot({ title: '', cat: 'Education', desc: '', budget: '', start: '', end: '', status: 'Incoming', hasFile: false })
    setFormMode('new')
  }

  const openEditForm = (p: ReportProject) => {
    const currentSt = normalizeProjectStatus(p)
    setNewTitle(p.title)
    setNewCat(p.category || 'Education')
    setNewDesc(p.description)
    setNewBudget(String(p.proposedBudget))
    setNewStart(p.startDate)
    setNewEnd(p.endDate)
    setNewStatus(currentSt)
    setProposalFile(null)
    setFormError('')
    setInitialSnapshot({
      title: p.title, cat: p.category || 'Education', desc: p.description,
      budget: String(p.proposedBudget), start: p.startDate, end: p.endDate, status: currentSt, hasFile: false,
    })
    setFormMode(p)
  }

  const isFormDirty = () => {
    if (newTitle !== initialSnapshot.title) return true
    if (newCat !== initialSnapshot.cat) return true
    if (newDesc !== initialSnapshot.desc) return true
    if (newBudget !== initialSnapshot.budget) return true
    if (newStart !== initialSnapshot.start) return true
    if (newEnd !== initialSnapshot.end) return true
    if (newStatus !== initialSnapshot.status) return true
    if (!!proposalFile !== initialSnapshot.hasFile) return true
    return false
  }

  const hasChanges = isFormDirty();

  const requestCloseModal = () => {
    if (isFormDirty()) {
      setConfirmAction('cancel')
    } else {
      setFormMode(null)
    }
  }

  const handleSubmitProject = async (e: FormEvent) => {
    e.preventDefault()

    // ─ Validation ─────────────────────────────────────────────────────────────
    if (!newTitle.trim()) { setFormError('Project title is required.'); return }
    if (newTitle.trim().length < 3) { setFormError('Project title must be at least 3 characters.'); return }
    if (!newBudget || parseFloat(newBudget) <= 0) { setFormError('Budget must be a positive number.'); return }
    if (!newStart) { setFormError('Start date is required.'); return }
    if (!newEnd) { setFormError('End date is required.'); return }
    if (new Date(newEnd) <= new Date(newStart)) {
      setFormError('End date must be after the start date.')
      return
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (formMode === 'new') {
      try {
        const created = await createProjectApi({
          projectName: newTitle.trim(),
          projectDescription: newDesc.trim(),
          projectStartTime: new Date(newStart).toISOString(),
          projectEndTime: new Date(newEnd).toISOString(),
          projectLocation: barangay,
          projectBudget: parseFloat(newBudget),
          projectCategory: newCat,
        })
        const np: ReportProject = mapApiProjectToReportProject({
          ...created,
          projectName: (created as any).projectName || newTitle.trim(),
          projectLocation: (created as any).projectLocation || barangay,
          projectCategory: (created as any).projectCategory || newCat,
          projectBudget: (created as any).projectBudget || newBudget,
          projectDescription: (created as any).projectDescription || newDesc.trim(),
          projectStartTime: newStart,
          projectEndTime: newEnd,
        }, barangay)
        setLocalProjects(prev => [np, ...prev])
        setFormMode(null)
        setFormError('')
        setFeedback({ type: 'success', message: 'Project created successfully' })
      } catch (err: any) {
        setFormError(err.message || 'Failed to create project draft')
      }
    } else if (formMode) {
      // EDIT MODE
      const editingId = formMode.id
      try {
        const updated = await updateProjectApi(editingId, {
          projectName: newTitle.trim(),
          projectDescription: newDesc.trim(),
          projectStartTime: new Date(newStart).toISOString(),
          projectEndTime: new Date(newEnd).toISOString(),
          projectLocation: barangay,
          projectBudget: parseFloat(newBudget),
          projectCategory: newCat,
          projectStatus: newStatus,
        })
        const res: any = updated
        const mapped = mapApiProjectToReportProject(res, barangay)
        setLocalProjects(prev => prev.map(proj =>
          proj.id === editingId ? mapped : proj
        ))
        setFormMode(null)
        setFormError('')
        setFeedback({ type: 'success', message: 'Project updated successfully' })
      } catch (err: any) {
        setFormError(err.message || 'Failed to save changes')
      }
    }
  }

  const handleDeleteProject = (p: ReportProject) => setProjectToDelete(p)

  // Merged in from the remote version — loading/error state around delete,
  // and safer id resolution (falls back to .id if .projectId isn't set).
  const confirmDelete = async () => {
    if (!projectToDelete) return
    setIsDeletingProject(true)
    setDeleteError('')
    try {
      const projectId = (projectToDelete as any).projectId ?? projectToDelete.id
      await deleteProjectApi(projectId)
      setLocalProjects(prev => prev.filter(p => p.id !== projectToDelete.id))
      setFeedback({ type: 'success', message: 'Project deleted successfully' })
      setProjectToDelete(null)
    } catch (err: any) {
      setDeleteError(err.message || 'Unable to delete project right now.')
      setFeedback({ type: 'info', message: err.message || 'Failed to delete project' })
    } finally {
      setIsDeletingProject(false)
    }
  }

  // Handles a new receipt attached from ProjectDetailModal — updates the
  // project's receipts, spent, and remaining budget in local state so the
  // card, totals, and modal all stay in sync immediately.
  const handleAddReceipt = (projectId: string, receipt: any) => {
    setLocalProjects(prev => prev.map(p =>
      p.id === projectId
        ? {
          ...p,
          receipts: [...(p.receipts ?? []), receipt],
          spent: p.spent + receipt.amount,
          remainingBudget: Math.max(0, p.proposedBudget - (p.spent + receipt.amount)),
        }
        : p
    ))
  }

  // Merged in from the remote version — lets ProjectDetailModal push back
  // an updated project (e.g. if it ever handles edits internally too).
  const handleProjectUpdated = (updated: ReportProject) => {
    setSelectedProject(updated)
    setLocalProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)))
  }

  // Keep the modal's project prop live — selectedProject is a snapshot from
  // click-time, so after handleAddReceipt updates localProjects we re-derive
  // the current version here instead of holding a stale copy.
  const liveSelectedProject = selectedProject
    ? localProjects.find(p => p.id === selectedProject.id) ?? selectedProject
    : null

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
              {feedback.type === 'success' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-6" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v5" />
                  <path d="M12 16h.01" />
                </svg>
              )}
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
            <span className="page-kicker">Project Management · {barangay}</span>
            <h1 className="page-title" style={{ marginTop: '0.3rem' }}>{barangay} SK Projects</h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              Manage and track all Sangguniang Kabataan projects for Barangay {barangay}.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignSelf: 'flex-start', marginTop: '0.4rem' }}>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={openAddForm}>+ Add Project</button>
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
            <div className="stat-value">{formatCurrency(totalBudget)}</div>
            <div className="stat-label">Total Budget</div>
            <div className="stat-sub">All proposed allocations</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #b45309' }}>
            <div className="stat-value" style={{ color: '#b45309' }}>{formatCurrency(totalSpent)}</div>
            <div className="stat-label">Total Disbursed</div>
            <div className="stat-sub">{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% utilization</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #166534' }}>
            <div className="stat-value" style={{ color: '#166534' }}>{formatCurrency(totalBudget - totalSpent)}</div>
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
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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
        {isLoadingProjects && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', marginBottom: '1rem' }}>
            Loading projects…
          </div>
        )}
        {!isLoadingProjects && projectsError && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>{projectsError}</div>
        )}
        {filtered.length > 0 ? (
          <div className="card-grid card-grid-3">
            {filtered.map(p => (
              <div key={p.id} className="v-card" onClick={() => { setSelectedProject(p); setOpenReceiptDirect(false) }}>
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
                  <div className="v-card-badge-pin" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                    {p.proposedBudget > 0 && p.spent > p.proposedBudget && (
                      <span className="badge" style={{ background: '#760031', color: '#fef08a', fontWeight: 800, border: '1px solid #fef08a' }}>
                        ⚠️ OVER BUDGET (+₱{(p.spent - p.proposedBudget).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>

                <div className="v-card-body">
                  <div className="v-card-kicker">{p.category}</div>
                  <div className="v-card-title">{p.title}</div>
                  <div className="v-card-date">{p.startDate} — {p.endDate}</div>
                  <p className="v-card-desc">{p.description}</p>

                  <div style={{ marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Budget Used</span>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: p.proposedBudget > 0 && p.spent > p.proposedBudget ? '#dc2626' : 'var(--maroon)' }}>
                        {p.proposedBudget > 0 ? Math.round((p.spent / p.proposedBudget) * 100) : 0}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, p.proposedBudget > 0 ? (p.spent / p.proposedBudget) * 100 : 0)}%`, background: p.proposedBudget > 0 && p.spent > p.proposedBudget ? '#dc2626' : undefined }} />
                    </div>
                  </div>

                  <div className="v-card-footer">
                    <div>
                      <div className="v-card-budget">{formatCurrency(p.proposedBudget)}</div>
                      <div className="v-card-budget-label">Budget</div>
                    </div>
                    {/* SK actions — gated by role: Chairperson sees all three,
                        Secretary sees Edit + Delete only, Treasurer sees
                        Attach Receipt only. */}
                    {canShowActions && (
                      <div className="v-card-actions" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                        {canAttachReceipt && (
                          !['ongoing', 'in progress'].includes(String(p.projectStatus || p.status).toLowerCase()) ? (
                            <button className="btn btn-secondary btn-sm" disabled style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', opacity: 0.65, cursor: 'not-allowed' }} title="Receipt attachment allowed only when project is Ongoing">
                              🔒 Receipts Locked
                            </button>
                          ) : (
                            <button className="btn btn-gold btn-sm" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                              onClick={() => { setSelectedProject(p); setOpenReceiptDirect(true); setOpenEditDirect(false) }}>
                              Attach Receipt
                            </button>
                          )
                        )}
                        {canEdit && (
                          <>
                            <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', fontWeight: 700 }}
                              onClick={e => { e.stopPropagation(); setSelectedProject(p); setOpenReceiptDirect(false); setOpenEditDirect(true) }}>
                              ✏️ Edit
                            </button>
                            <button className="btn btn-danger btn-sm" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                              onClick={e => { e.stopPropagation(); handleDeleteProject(p) }}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoadingProjects && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.3rem' }}>No projects found</div>
              {canEdit && <div style={{ fontSize: '0.85rem' }}>Create a new project to get started.</div>}
            </div>
          )
        )}

        {/* ── Add / Edit Project Modal ── */}
        {formMode && canEdit && (
          <Portal>
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) requestCloseModal() }}>
              <div className="modal" style={{ width: 'min(560px, 100%)' }}>
                <div className="modal-header">
                  <div className="modal-title">{formMode === 'new' ? 'Add New Project' : 'Edit Project'}</div>
                  <button className="modal-close" onClick={requestCloseModal}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleSubmitProject}>
                  <div className="modal-body">
                    {formError && <div className="alert-error">{formError}</div>}

                    {/* Proposal File Attachment — create mode only */}
                    {formMode === 'new' && (
                      <div style={{ marginBottom: '1rem', border: '1.5px dashed var(--maroon)', padding: '0.9rem 1rem', background: 'rgba(118,0,49,0.02)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--maroon)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                          Attach Proposal Document (Optional)
                        </div>
                        {proposalFile ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-display)' }}>
                              <strong>{proposalFile.name}</strong> ({(proposalFile.size / 1024).toFixed(1)} KB)
                            </span>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setProposalFile(null)}>Remove</button>
                          </div>
                        ) : (
                          <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                              style={{ display: 'none' }}
                              onChange={e => { if (e.target.files?.[0]) setProposalFile(e.target.files[0]) }}
                            />
                            <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none' }}>Browse File</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>PDF, DOC, or Image</span>
                          </label>
                        )}
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Project Title *</label>
                      <input className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Youth Digital Literacy Workshop" />
                    </div>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label className="form-label">Category *</label>
                        <select
                          className="form-input"
                          value={newCat}
                          onChange={e => setNewCat(e.target.value)}
                          style={{
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23760031' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.85rem center',
                            paddingRight: '2.2rem',
                            cursor: 'pointer',
                          }}
                        >
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
                        <DateInput className="form-input" value={newStart} onChange={setNewStart} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Date *</label>
                        <DateInput className="form-input" value={newEnd} onChange={setNewEnd} min={newStart || undefined} />
                        {newEnd && newStart && new Date(newEnd) <= new Date(newStart) && (
                          <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: '0.25rem' }}>
                            End date must be after start date
                          </div>
                        )}
                      </div>
                    </div>
                    {/* ── Status Progression — edit mode only (creation defaults automatically to Incoming) ── */}
                    {formMode !== 'new' && (
                      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          Change Project Status
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                          {[
                            { key: 'Incoming', label: 'Incoming', level: 1, icon: '📌' },
                            { key: 'In Progress', label: 'In Progress', level: 2, icon: '⚡' },
                            { key: 'Completed', label: 'Completed', level: 3, icon: '✓' },
                          ].map(st => {
                            const rawCurrent = initialSnapshot.status || (formMode as ReportProject)?.projectStatus || (formMode as ReportProject)?.status
                            const normCurrent = normalizeProjectStatus({ projectStatus: rawCurrent })
                            const currentLevel = getStatusLevel(normCurrent)
                            const targetNorm = st.key === 'In Progress' ? 'Ongoing' : st.key
                            const isCurrent = normalizeProjectStatus({ projectStatus: newStatus }) === targetNorm
                            const isBackward = currentLevel > st.level
                            const isDisabled = isBackward

                            return (
                              <button
                                key={st.key}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => {
                                  if (!isCurrent && !isDisabled) {
                                    setPendingStatusConfirm(st.key)
                                  }
                                }}
                                style={{
                                  padding: '0.65rem 0.5rem',
                                  fontSize: '0.8rem',
                                  fontFamily: 'var(--font-display)',
                                  fontWeight: 800,
                                  borderRadius: '8px',
                                  border: isCurrent
                                    ? '2px solid var(--maroon)'
                                    : isDisabled
                                      ? '1px dashed #ccc'
                                      : '1.5px solid rgba(118,0,49,0.25)',
                                  background: isCurrent
                                    ? 'var(--maroon)'
                                    : isDisabled
                                      ? '#f5f5f5'
                                      : '#fff',
                                  color: isCurrent
                                    ? '#fff'
                                    : isDisabled
                                      ? '#aaa'
                                      : 'var(--maroon)',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: isDisabled ? 0.55 : 1,
                                  transition: 'all 150ms ease',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                }}
                                title={isDisabled ? 'Status cannot be moved backwards' : isCurrent ? 'Current Status' : `Advance status to ${st.label}`}
                              >
                                <span style={{ fontSize: '1rem' }}>{st.icon}</span>
                                <span>{st.label}</span>
                                {isCurrent && <span style={{ fontSize: '0.62rem', opacity: 0.9, textTransform: 'uppercase' }}>(Current)</span>}
                                {isDisabled && <span style={{ fontSize: '0.62rem', textTransform: 'uppercase' }}>(Locked)</span>}
                              </button>
                            )
                          })}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
                          ⚠️ Project status moves strictly forward (Incoming → In Progress → Completed). Past statuses cannot be reversed.
                        </div>
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-input" rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description of the project…" style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }} />
                    </div>
                  </div>
                  <div className="modal-footer" style={{ display: 'flex', alignItems: 'center' }}>
                    {formMode !== 'new' && !hasChanges && (
                      <span style={{
                        fontSize: '0.78rem',
                        color: 'var(--maroon)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        marginRight: 'auto',
                        lineHeight: 1,
                      }}>
                        Edit a field to enable saving
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={requestCloseModal}
                    >
                      Cancel
                    </button>

                    {formMode === 'new' ? (
                      <button type="submit" className="btn btn-primary">
                        Create Project
                      </button>
                    ) : (
                      hasChanges && (
                        <button type="submit" className="btn btn-primary">
                          Save Changes
                        </button>
                      )
                    )}
                  </div>
                </form>
              </div>
            </div>
          </Portal>
        )}

        {/* ── Project Detail Modal ── */}
        {liveSelectedProject && (
          <ProjectDetailModal
            key={`${liveSelectedProject.id}-${openReceiptDirect ? 'receipt' : openEditDirect ? 'edit' : 'view'}`}
            project={liveSelectedProject}
            user={user}
            initialTab={openReceiptDirect ? 'finance' : 'overview'}
            autoShowReceiptForm={openReceiptDirect}
            autoEdit={openEditDirect}
            onClose={() => { setSelectedProject(null); setOpenReceiptDirect(false); setOpenEditDirect(false) }}
            onAddReceipt={handleAddReceipt}
            onProjectUpdated={handleProjectUpdated}
          />
        )}

        {/* ── Delete Confirmation ── */}
        {deleteError && <div className="alert-error" style={{ marginBottom: '1rem' }}>{deleteError}</div>}
        <ConfirmDialog
          isOpen={!!projectToDelete}
          title="Delete Project"
          message={`Delete "${projectToDelete?.title}"? This action cannot be undone.`}
          confirmLabel={isDeletingProject ? 'Deleting…' : 'Delete'}
          cancelLabel="Cancel"
          danger={true}
          onConfirm={confirmDelete}
          onCancel={() => setProjectToDelete(null)}
        />

        {/* ── Discard Changes Confirmation ── */}
        <ConfirmDialog
          isOpen={confirmAction === 'cancel'}
          title="Discard Changes"
          message="Any unsaved changes will be lost. Are you sure you want to close this form?"
          confirmLabel="Discard"
          cancelLabel="Keep Editing"
          variant="danger"
          onConfirm={() => {
            setFormMode(null)
            setConfirmAction(null)
            setFeedback({ type: 'info', message: 'Changes discarded' })
          }}
          onCancel={() => setConfirmAction(null)}
        />

        {/* ── Status Progression Confirmation ── */}
        <ConfirmDialog
          isOpen={!!pendingStatusConfirm}
          title="Confirm Project Status Change"
          message={`Are you sure you want to advance the project status to "${pendingStatusConfirm}"? Status progression is permanent and cannot be reversed.`}
          confirmLabel="Yes, Advance Status"
          cancelLabel="Cancel"
          danger={false}
          onConfirm={() => {
            if (pendingStatusConfirm) {
              setNewStatus(pendingStatusConfirm)
            }
            setPendingStatusConfirm(null)
          }}
          onCancel={() => setPendingStatusConfirm(null)}
        />
      </div>
    </section>
  )
}
