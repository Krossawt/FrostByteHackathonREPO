import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { UserAccount, ReportProject } from '../types'
import ProjectDetailModal from '../components/ProjectDetailModal'
import BarangayTransactionsModal from '../components/BarangayTransactionsModal'
import { DonutChart } from '../components/MiniChart'
import SingleNewsCarousel from '../components/SingleNewsCarousel'
import ConfirmDialog from '../components/ConfirmDialog'
import { fetchProjectsApi, fetchBarangayReportApi, fetchNewsApi, fetchSuggestionsApi, voteSuggestionApi, replySuggestionApi, normalizeProjectStatus } from '../services/api'
import type { SuggestionItem } from '../services/api'
import Portal from '../components/Portal'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { formatCurrency } from '../utils/formatCurrency';

function formatPeso(amount: number) {
  return `₱${Math.round(amount || 0).toLocaleString('en-PH')}`
}
interface CitizenHomeProps { user?: UserAccount | null }

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
const STATUS_LEVELS: Record<string, number> = {
  'Incoming': 1, 'incoming': 1, 'upcoming': 1,
  'In Progress': 2, 'in progress': 2, 'ongoing': 2,
  'Completed': 3, 'completed': 3, 'posted': 3,
}
function getStatusLevel(st?: string): number {
  if (!st) return 1
  return STATUS_LEVELS[st] || 1
}

export default function CitizenHome({ user }: CitizenHomeProps) {
  const barangay = user?.barangay || 'Balibago'
  const skPosition = user?.skPosition
  const canEditProjectCard = skPosition === 'Chairperson' || skPosition === 'Secretary'
  const canAttachReceiptCard = skPosition === 'Chairperson' || skPosition === 'Treasurer'

  const [pendingAction, setPendingAction] = useState<'edit' | 'receipt' | null>(null)
  const [summary, setSummary] = useState({ spent: 0, annualBudget: 0, remaining: 0 })
  const [localProjects, setLocalProjects] = useState<ReportProject[]>([])
  const [news, setNews] = useState<any[]>([])
  const [localComments, setLocalComments] = useState<SuggestionItem[]>([])
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    async function loadCitizenData() {
      try {
        const [projRes, repRes, newsRes, suggRes] = await Promise.all([
          fetchProjectsApi({ barangay }).catch(() => []),
          fetchBarangayReportApi(barangay).catch(() => null),
          fetchNewsApi().catch(() => []),
          fetchSuggestionsApi(barangay).catch(() => []),
        ])

        const rawNews = Array.isArray(newsRes)
          ? newsRes
          : Array.isArray((newsRes as any)?.items)
            ? (newsRes as any).items
            : Array.isArray((newsRes as any)?.data)
              ? (newsRes as any).data
              : []

        let mappedNews: any[] = []

        if (rawNews.length > 0) {
          mappedNews = rawNews.map((n: any) => ({
            id: String(n.newsletterID || n.id),
            title: n.title,
            category: n.category || 'City News',
            summary: n.summary || n.fullContent || '',
            date: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : 'Today',
            image: n.image || n.imageURL || undefined,
          }))
        } else if (Array.isArray(projRes) && projRes.length > 0) {
          mappedNews = projRes.map((p: any) => ({
            id: String(p.projectID || p.id),
            title: p.projectName || p.title,
            category: p.projectCategory || 'SK Update',
            summary: p.projectDescription || `Official SK project for Barangay ${p.projectLocation || barangay}. Proposed Budget: ₱${Number(p.projectBudget || 0).toLocaleString()}`,
            date: p.projectStartTime ? new Date(p.projectStartTime).toLocaleDateString() : 'Active',
            image: p.imageURL || undefined,
          }))
        } else {
          mappedNews = [
            {
              id: 'N-01',
              title: `SK Q1 Financial Transparency Report — Barangay ${barangay}`,
              category: 'Transparency',
              summary: `Official SK financial and project reports for Barangay ${barangay} are now live and accessible to all citizens.`,
              date: 'Today',
              image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&q=80',
            },
            {
              id: 'N-02',
              title: 'Santa Rosa City Youth Leadership & Empowerment Summit',
              category: 'Youth Programs',
              summary: 'Youth representatives across all 18 barangays gathered in Santa Rosa for community governance training.',
              date: 'Yesterday',
              image: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=700&q=80',
            },
            {
              id: 'N-03',
              title: 'Citizen Engagement & SK Transparency Portal Active',
              category: 'City News',
              summary: 'Track SK project progress, inspect approved budgets, and submit suggestions directly to your local SK officials.',
              date: 'Recently',
              image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=700&q=80',
            },
          ]
        }

        setNews(mappedNews)

        if (Array.isArray(projRes)) {
          setLocalProjects(projRes.map((p: any) => {
            const normSt = normalizeProjectStatus(p)
            const mappedStatus: 'ongoing' | 'upcoming' | 'completed' = normSt === 'Completed' ? 'completed' : normSt === 'Incoming' ? 'upcoming' : 'ongoing'

            return {
              id: String(p.projectID || p.id),
              title: p.projectName || p.title,
              barangay: p.projectLocation || barangay,
              category: p.projectCategory || 'Education',
              status: mappedStatus,
              proposedBudget: Number(p.projectBudget || 0),
              spent: Number(p.projectBreakdown || 0),
              remainingBudget: Math.max(0, Number(p.projectBudget || 0) - Number(p.projectBreakdown || 0)),
              progress: p.projectProgress || 0,
              progressPercent: p.projectProgress || 0,
              startDate: p.projectStartTime ? new Date(p.projectStartTime).toISOString().split('T')[0] : '',
              endDate: p.projectEndTime ? new Date(p.projectEndTime).toISOString().split('T')[0] : '',
              description: p.projectDescription || '',
            }
          }))
        }

        if (repRes) {
          setSummary({
            spent: Number(repRes.spent || 0),
            annualBudget: Number(repRes.annualBudget || 0),
            remaining: Number(repRes.remaining || 0),
          })
        }

        // Load citizen suggestions for this barangay
        if (Array.isArray(suggRes)) {
          setLocalComments(suggRes)
          setVotedIds(new Set(suggRes.filter((c: any) => c.hasVoted).map((c: any) => c.suggestionID)))
        }
      } catch (err) {
        console.warn('API load warning:', err)
      }
    }
    loadCitizenData()
  }, [barangay])



  const [selectedProject, setSelectedProject] = useState<ReportProject | null>(null)
  const [showTxnModal, setShowTxnModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  // Print dialog — opens browser print preview
  const handlePrintReport = () => {
    window.print()
  }

  // Direct client-side PDF export without opening print dialog
  const handleDownloadPDF = async () => {
    const element = document.getElementById('sk-report-printable')
    if (!element) return
    try {
      setIsDownloadingPdf(true)
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= 297
      }

      pdf.save(`SK-Report-${barangay.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const reportGeneratedAt = new Date().toLocaleString('en-PH', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const spent = summary.spent
  const budget = summary.annualBudget || 1
  const remain = summary.remaining
  const usagePct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0

  const [activeReplyId, setActiveReplyId] = useState<number | null>(null)
  const [replyInputText, setReplyInputText] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [confirmDiscardReply, setConfirmDiscardReply] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

 const handleVote = async (id: number) => {
    try {
      const updated = await voteSuggestionApi(id)
      setLocalComments((prev) => prev.map((c) => c.suggestionID === id ? updated : c))
      setVotedIds(prev => {
        const next = new Set(prev)
        if (updated.hasVoted) next.add(id)
        else next.delete(id)
        return next
      })
      setFeedback({ type: 'success', message: updated.hasVoted ? 'Suggestion acknowledged' : 'Acknowledgement removed' })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update acknowledgment' })
    }
  }

  const handleSendReply = async (suggestionId: number) => {
    if (!replyInputText.trim()) return
    setIsSubmittingReply(true)
    try {
      const updated = await replySuggestionApi(suggestionId, replyInputText.trim())
      setLocalComments((prev) => prev.map((c) => c.suggestionID === suggestionId ? updated : c))
      setReplyInputText('')
      setActiveReplyId(null)
      setFeedback({ type: 'success', message: 'Response posted successfully' })
    } catch (err: any) {
      const msg = err?.message || 'Failed to post reply. Please try again.'
      setFeedback({ type: 'error', message: msg })
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleCancelReply = () => {
    if (replyInputText.trim()) {
      setConfirmDiscardReply(true)
    } else {
      setActiveReplyId(null)
    }
  }

  const confirmDiscardReplyAction = () => {
    setConfirmDiscardReply(false)
    setReplyInputText('')
    setActiveReplyId(null)
    setFeedback({ type: 'info', message: 'Response discarded' })
  }

  // Editing/deleting an SK Council reply attached to a citizen suggestion
  const [editingReply, setEditingReply] = useState<{ suggestionId: number; replyId: any } | null>(null)
  const [editReplyText, setEditReplyText] = useState('')
  const [initialEditReplyText, setInitialEditReplyText] = useState('')
  const [confirmDiscardEditReply, setConfirmDiscardEditReply] = useState(false)
  const [deleteReplyTarget, setDeleteReplyTarget] = useState<{ suggestionId: number; replyId: any } | null>(null)

  const handleStartEditReply = (suggestionId: number, r: any) => {
    setEditingReply({ suggestionId, replyId: r.replyID })
    setEditReplyText(r.replyText)
    setInitialEditReplyText(r.replyText)
  }

  const handleCancelEditReply = () => {
    if (editReplyText.trim() !== initialEditReplyText.trim()) {
      setConfirmDiscardEditReply(true)
    } else {
      setEditingReply(null)
    }
  }

  const confirmDiscardEditReplyAction = () => {
    setConfirmDiscardEditReply(false)
    setEditingReply(null)
    setEditReplyText('')
    setFeedback({ type: 'info', message: 'Changes discarded' })
  }

  const handleSaveEditReply = () => {
    if (!editingReply || !editReplyText.trim()) return
    const { suggestionId, replyId } = editingReply
    setLocalComments(prev => prev.map(c => {
      if (c.suggestionID !== suggestionId) return c
      return {
        ...c,
        replies: (c.replies ?? []).map((r: any) => r.replyID === replyId ? { ...r, replyText: editReplyText.trim() } : r),
      }
    }))
    setEditingReply(null)
    setFeedback({ type: 'success', message: 'Response updated' })
  }

  const handleDeleteReply = (suggestionId: number, replyId: any) => {
    setDeleteReplyTarget({ suggestionId, replyId })
  }

  const confirmDeleteReplyAction = () => {
    if (!deleteReplyTarget) return
    const { suggestionId, replyId } = deleteReplyTarget
    setLocalComments(prev => prev.map(c => {
      if (c.suggestionID !== suggestionId) return c
      return { ...c, replies: (c.replies ?? []).filter((r: any) => r.replyID !== replyId) }
    }))
    setDeleteReplyTarget(null)
    setFeedback({ type: 'info', message: 'Response deleted' })
  }

  return (
    <section className="section">
      <div className="container">

        {/* Always-rendered so the header's View Report button is styled
            immediately, even before the report modal has ever been opened. */}
        <style>{`
          .view-report-btn {
            background: rgba(220, 38, 38, 0.12);
            color: #b91c1c;
            border: 1.5px solid rgba(220, 38, 38, 0.28);
            transition: background 180ms ease, border-color 180ms ease, backdrop-filter 180ms ease, box-shadow 180ms ease;
          }
          .view-report-btn:hover {
            background: rgba(220, 38, 38, 0.2);
            border-color: rgba(220, 38, 38, 0.42);
            backdrop-filter: blur(16px) saturate(1.6);
            -webkit-backdrop-filter: blur(16px) saturate(1.6);
            box-shadow: 0 8px 20px rgba(220, 38, 38, 0.18), inset 0 1px 0 rgba(255,255,255,0.3);
          }

          /* Print doesn't make sense as a tap target on tablet/mobile —
             hide it there and keep Download as the primary export action. */
          @media (max-width: 1024px) {
            .report-print-btn {
              display: none !important;
            }
          }

          .header-action-cluster {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
            align-self: flex-start;
            margin-top: 0.4rem;
            align-items: flex-end;
          }
          .btn-community-feed {
            width: 100%;
            justify-content: center;
            display: inline-flex;
            align-items: center;
          }
          .header-action-row {
            display: flex;
            gap: 0.6rem;
            width: 100%;
            justify-content: flex-end;
          }

          @media (max-width: 480px) {
            .header-action-cluster {
              width: 100%;
              align-items: stretch;
            }
            .header-action-row {
              gap: 0.4rem;
            }
            .header-action-row .btn {
              min-width: 0;
              justify-content: center;
              padding-left: 0.4rem;
              padding-right: 0.4rem;
              font-size: 0.68rem;
              white-space: nowrap;
              gap: 0.25rem !important;
            }
            .header-action-row .btn svg {
              width: 12px;
              height: 12px;
              flex-shrink: 0;
            }
            .header-action-row .view-report-btn {
              flex: 0.85 1 0;
            }
            .header-action-row .btn-gold {
              flex: 1.15 1 0;
            }
          }

          @media (max-width: 360px) {
            .header-action-row .btn {
              font-size: 0.62rem;
              padding-left: 0.3rem;
              padding-right: 0.3rem;
            }
          }

          /* Suggestion card — category badge */
          .comment-category-badge {
            margin-left: 0.4rem;
            font-size: 0.72rem;
            color: var(--muted);
            background: rgba(118,0,49,0.07);
            padding: 0.1rem 0.5rem;
            border-radius: 12px;
            font-family: var(--font-display);
            font-weight: 600;
            display: inline-block;
          }

          /* Suggestion card — footer actions */
          .comment-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid rgba(118,0,49,0.06);
            padding-top: 0.5rem;
            margin-top: 0.4rem;
          }
          .comment-actions {
            display: flex;
            gap: 0.8rem;
            align-items: center;
          }
          .comment-submission-meta {
            font-size: 0.72rem;
            color: var(--muted);
            font-family: var(--font-display);
            text-align: right;
          }

          @media (max-width: 640px) {
          .comment-category-badge {
            display: inline-block;
            width: fit-content;
            margin-left: 0;
            margin-top: 0.25rem;
          }
          .comment-footer {
            flex-wrap: wrap;
          }
          .comment-actions {
            width: 100%;
              justify-content: space-between;
            }
            .comment-submission-meta {
              width: 100%;
              margin-top: 0.35rem;
            }
          }

          @keyframes toastPop {
            from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.96); }
            to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
        `}</style>

        {/* ── Page Intro ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
          <div>
            <span className="page-kicker">Citizen Portal · Barangay {barangay}</span>
            <h1 className="page-title" style={{ marginTop: '0.3rem' }}>Your Barangay's SK Transparency Dashboard</h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              Track Barangay {barangay}'s SK budget utilization, active projects, and community engagement. Click any project card to inspect financial details and leave feedback.
            </p>
          </div>
          <div className="header-action-cluster">
            <a
              href="#community-feed"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault()
                document.getElementById('community-feed')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="btn btn-secondary btn-sm btn-community-feed"
            >
              View Community Feed ↓
            </a>
            <div className="header-action-row">
              <button
                className="btn btn-sm view-report-btn"
                onClick={() => setShowReportModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 13h6M9 17h6M9 9h1" strokeWidth="1.6" />
                </svg>
                View Report
              </button>
              <button
                className="btn btn-gold btn-sm"
                onClick={() => setShowTxnModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Track Funds &amp; Receipts
              </button>
            </div>
          </div>
        </div>

        {/* ── Financial Stat Cards ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">{formatCurrency(budget)}</div>
            <div className="stat-label">Annual Budget</div>
            <div className="stat-sub">FY 2025 · SK Allocation</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #b45309' }}>
            <div className="stat-value" style={{ color: '#b45309' }}>{formatCurrency(spent)}</div>
            <div className="stat-label">Amount Disbursed</div>
            <div className="stat-sub">{usagePct}% of annual budget</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #166534' }}>
            <div className="stat-value" style={{ color: '#166534' }}>{formatCurrency(remain)}</div>
            <div className="stat-label">Remaining</div>
            <div className="stat-sub">Available for projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{localProjects.length}</div>
            <div className="stat-label">Total Projects</div>
            <div className="stat-sub">{localProjects.filter(p => p.status === 'ongoing').length} currently active</div>
          </div>
        </div>

        {/* ── Budget Utilization Chart Card ── */}
        <div className="chart-card" style={{ marginBottom: '2rem', flexDirection: 'row', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <DonutChart value={usagePct} size={110} stroke={14} label={`${usagePct}%`} sublabel="used" />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.5rem' }}>
              Budget Utilization Breakdown — Barangay {barangay}
            </div>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              {[
                { label: 'Total Allocation', val: `₱${budget.toLocaleString()}`, color: 'var(--maroon)' },
                { label: 'Total Disbursed', val: `₱${spent.toLocaleString()}`, color: '#b45309' },
                { label: 'Remaining Balance', val: `₱${remain.toLocaleString()}`, color: '#166534' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontFamily: 'var(--font-display)' }}>
                  <span style={{ color: 'var(--muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Two columns: Projects + Right Sidebar (Latest News) ── */}
        <div className="page-cols page-cols-sidebar">

          {/* Left Column — Projects & Facebook-Style Community Suggestion Feed */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <div className="page-kicker">Local Projects</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                {barangay} SK Projects
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500, marginLeft: '0.5rem' }}>
                  (Click for details &amp; receipts)
                </span>
              </h2>
            </div>

            {localProjects.length > 0 ? (
              <div className="card-grid card-grid-2" style={{ marginBottom: '2.5rem' }}>
                {localProjects.map(p => (
                  <div key={p.id} className="v-card" onClick={() => setSelectedProject(p)}>
                    <div className="v-card-img-wrap" style={{ height: 150 }}>
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

                    <div className="v-card-body" style={{ padding: '0.9rem 1rem 1rem' }}>
                      <div className="v-card-kicker">{p.category}</div>
                      <div className="v-card-title" style={{ fontSize: '0.92rem' }}>{p.title}</div>
                      <div className="v-card-date">{p.startDate} — {p.endDate}</div>

                      <div style={{ marginTop: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Budget Used</span>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: p.proposedBudget > 0 && p.spent > p.proposedBudget ? '#dc2626' : 'var(--maroon)' }}>
                            {p.proposedBudget > 0 ? Math.round((p.spent / p.proposedBudget) * 100) : 0}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(100, p.proposedBudget > 0 ? (p.spent / p.proposedBudget) * 100 : 0)}%`, background: p.proposedBudget > 0 && p.spent > p.proposedBudget ? '#dc2626' : undefined }} />
                        </div>
                      </div>

                      <div className="v-card-footer" style={{ paddingTop: '0.65rem' }}>
                        <div>
                          <div className="v-card-budget" style={{ fontSize: '0.95rem' }}>{formatCurrency(p.proposedBudget)}</div>
                          <div className="v-card-budget-label">Budget</div>
                        </div>
                        <div className="v-card-actions" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                          {canAttachReceiptCard && (
                            !['ongoing', 'in progress'].includes(String(p.projectStatus || p.status).toLowerCase()) ? (
                              <button className="btn btn-secondary btn-sm" disabled style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', opacity: 0.65, cursor: 'not-allowed' }} title="Receipt attachment allowed only when project is Ongoing">
                                🔒 Receipts Locked
                              </button>
                            ) : (
                              <button className="btn btn-gold btn-sm" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                                onClick={() => { setSelectedProject(p); setPendingAction('receipt') }}>
                                Attach Receipt
                              </button>
                            )
                          )}
                          {canEditProjectCard && (
                            <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', fontWeight: 700 }}
                              onClick={() => { setSelectedProject(p); setPendingAction('edit') }}>
                              ✏️ Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', marginBottom: '2.5rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No projects listed yet</div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>SK {barangay} projects will appear here once registered.</div>
              </div>
            )}

            {/* ── Citizen Suggestions Feed (Read-Only for SK Officials) ── */}
            <div id="community-feed" style={{ background: '#fff', border: '1.5px solid rgba(118,0,49,0.14)', boxShadow: '0 8px 24px rgba(118,0,49,0.06)', padding: '1.5rem', scrollMarginTop: 'calc(var(--header-height, 78px) + 1rem)' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '1.2rem', borderBottom: '1px solid rgba(118,0,49,0.08)', paddingBottom: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', background: 'rgba(118,0,49,0.1)', color: 'var(--maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '1.2rem', flexShrink: 0 }}>
                  💡
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.96rem', color: 'var(--ink)' }}>
                    Citizen Suggestions — Barangay {barangay}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    These are public suggestions submitted directly by citizens of Barangay {barangay}. Review and upvote to show which concerns need priority attention.
                  </div>
                </div>
              </div>


              {/* Feed of Citizen Suggestions */}
              <div style={{ display: 'grid', gap: '0.9rem' }}>
                <div className="page-kicker">Barangay {barangay} Citizen Feed ({localComments.length} suggestion{localComments.length !== 1 ? 's' : ''})</div>
                {localComments.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', background: 'rgba(118,0,49,0.03)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🗳️</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.3rem' }}>No citizen suggestions yet</div>
                    <div>Citizens of Barangay {barangay} can post their suggestions and ideas on their dashboard. They'll appear here for your review.</div>
                  </div>
                ) : localComments.map((c) => (
                  <div key={c.suggestionID} className="comment-card" style={{ background: 'rgba(255,255,255,0.95)', border: '1.5px solid rgba(118,0,49,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div style={{ width: '30px', height: '30px', background: 'rgba(118,0,49,0.1)', color: 'var(--maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                          {c.authorName?.charAt(0) ?? 'C'}
                        </div>
                        <div>
                          <span className="comment-author">{c.authorName}</span>
                          <span className="comment-category-badge">{c.category}</span>
                        </div>
                      </div>
                      <span className="comment-date">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}</span>
                    </div>

                    <p className="comment-text" style={{ margin: '0.6rem 0', fontSize: '0.88rem', color: 'var(--ink)' }}>
                      {c.suggestionText}
                    </p>

                    <div className="comment-footer">
                      <div className="comment-actions">
                        <button
                          type="button"
                          onClick={() => handleVote(c.suggestionID)}
                          className="link-button"
                          title={votedIds.has(c.suggestionID) ? 'Remove your agreement' : 'Agree with this suggestion'}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.76rem',
                            color: votedIds.has(c.suggestionID) ? 'var(--maroon-dark)' : 'var(--maroon)',
                            fontWeight: 500,
                            fontFamily: 'var(--font-display)',
                            lineHeight: 1,
                            opacity: 1,
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          <svg
                            width="16" height="16" viewBox="0 0 24 24"
                            fill={votedIds.has(c.suggestionID) ? 'var(--maroon)' : 'none'}
                            stroke={votedIds.has(c.suggestionID) ? 'var(--maroon-dark)' : 'var(--maroon)'}
                            strokeWidth="2"
                            strokeLinejoin="round"
                            style={{ display: 'block', flexShrink: 0 }}
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span style={{ lineHeight: 1 }}>{votedIds.has(c.suggestionID) ? '✓ Agreed / Helpful' : 'Agree / Helpful'} ({c.votesCount ?? 0})</span>
                        </button>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => {
                            setActiveReplyId(activeReplyId === c.suggestionID ? null : c.suggestionID)
                            setReplyInputText('')
                          }}
                          style={{
                            fontSize: '0.76rem',
                            color: 'var(--maroon)',
                            fontWeight: 700,
                            fontFamily: 'var(--font-display)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          💬 Reply ({c.replies?.length ?? 0})
                        </button>
                      </div>

                      <span className="comment-submission-meta">
                        Barangay {barangay} · Citizen Submission
                      </span>
                    </div>

                    {/* Official SK Replies List */}
                    {c.replies && c.replies.length > 0 && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px dashed rgba(118,0,49,0.12)', display: 'grid', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)', textTransform: 'uppercase' }}>
                          Official SK Council Responses ({c.replies.length})
                        </div>
                        {c.replies.map((r: any) => {
                          const isMyReply = !!user?.id && String(r.authorID ?? '') === String(user.id)
                          const isEditingThisReply = editingReply?.suggestionId === c.suggestionID && editingReply?.replyId === r.replyID
                          return (
                            <div key={r.replyID} style={{ background: 'rgba(118,0,49,0.04)', borderLeft: '3px solid var(--maroon)', padding: '0.6rem 0.85rem', borderRadius: '0 6px 6px 0' }}>
                              {isMyReply && (
                                <div style={{
                                  fontSize: '0.66rem',
                                  fontWeight: 800,
                                  color: 'var(--maroon)',
                                  fontFamily: 'var(--font-display)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  marginBottom: '0.35rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                  This is your response
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.8rem', color: 'var(--ink)' }}>
                                  {r.authorName} <span style={{ fontSize: '0.72rem', color: 'var(--maroon)', fontWeight: 600 }}>({r.authorRole})</span>
                                  {isMyReply && <span style={{ marginLeft: '0.35rem', fontSize: '0.68rem', fontWeight: 800, color: '#fff', background: 'var(--maroon)', padding: '0.08rem 0.4rem', borderRadius: '4px' }}>YOU</span>}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Today'}
                                  </span>
                                  {isMyReply && !isEditingThisReply && (
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditReply(c.suggestionID, r)}
                                        title="Edit response"
                                        style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600, color: '#3b82f6' }}
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteReply(c.suggestionID, r.replyID)}
                                        title="Delete response"
                                        style={{ background: 'none', border: '1px solid rgba(220,38,38,0.2)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}
                                      >
                                        🗑️ Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isEditingThisReply ? (
                                <div style={{ marginTop: '0.4rem' }}>
                                  <textarea
                                    className="form-input"
                                    rows={2}
                                    value={editReplyText}
                                    onChange={e => setEditReplyText(e.target.value)}
                                    style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}
                                  />
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    {editReplyText.trim() === initialEditReplyText.trim() && (
                                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontStyle: 'italic', marginRight: 'auto' }}>
                                        Edit the text to save changes
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      onClick={handleCancelEditReply}
                                      style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
                                    >
                                      Cancel
                                    </button>
                                    {editReplyText.trim() !== initialEditReplyText.trim() && (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={handleSaveEditReply}
                                        style={{ padding: '0.3rem 0.9rem', fontSize: '0.75rem' }}
                                      >
                                        Save Changes
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                                  {r.replyText}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Inline Reply Form for SK Official */}
                    {activeReplyId === c.suggestionID && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(118,0,49,0.1)', background: 'rgba(118,0,49,0.02)', padding: '0.75rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)', marginBottom: '0.4rem' }}>
                          Post Official SK Council Response
                        </div>
                        <textarea
                          className="form-input"
                          rows={2}
                          value={replyInputText}
                          onChange={e => setReplyInputText(e.target.value)}
                          placeholder="Type official response to this suggestion…"
                          style={{ resize: 'vertical', fontSize: '0.84rem' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          {!replyInputText.trim() && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--maroon)', fontStyle: 'italic' }}>
                              Type a response to submit
                            </span>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={handleCancelReply}
                              disabled={isSubmittingReply}
                            >
                              Cancel
                            </button>
                            {replyInputText.trim() && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled={isSubmittingReply}
                                onClick={() => handleSendReply(c.suggestionID)}
                              >
                                {isSubmittingReply ? 'Posting...' : 'Submit Response'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column — Latest News Sidebar */}
          <div style={{ display: 'grid', gap: '1.5rem', alignContent: 'start' }}>
            <SingleNewsCarousel items={news} />
          </div>

        </div>

        <ConfirmDialog
          isOpen={confirmDiscardReply}
          title="Discard Response"
          message="Your response hasn't been posted yet. Discard it?"
          confirmLabel="Discard"
          cancelLabel="Keep Writing"
          variant="danger"
          onConfirm={confirmDiscardReplyAction}
          onCancel={() => setConfirmDiscardReply(false)}
        />

        <ConfirmDialog
          isOpen={confirmDiscardEditReply}
          title="Discard Changes"
          message="Any unsaved edits to your response will be lost. Discard them?"
          confirmLabel="Discard"
          cancelLabel="Keep Editing"
          variant="danger"
          onConfirm={confirmDiscardEditReplyAction}
          onCancel={() => setConfirmDiscardEditReply(false)}
        />

        <ConfirmDialog
          isOpen={deleteReplyTarget !== null}
          title="Delete Response"
          message="This will permanently delete this official response. Are you sure?"
          confirmLabel="Delete"
          cancelLabel="Keep It"
          variant="danger"
          onConfirm={confirmDeleteReplyAction}
          onCancel={() => setDeleteReplyTarget(null)}
        />

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
                background: feedback.type === 'success'
                  ? 'rgba(22, 101, 52, 0.22)'
                  : feedback.type === 'error'
                    ? 'rgba(185, 28, 28, 0.18)'
                    : 'rgba(118, 0, 49, 0.18)',
                backdropFilter: 'blur(16px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
                color: feedback.type === 'success'
                  ? '#0d3d20'
                  : feedback.type === 'error'
                    ? '#7f1d1d'
                    : '#5c0026',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '0.9rem 1.4rem',
                borderRadius: '14px',
                border: feedback.type === 'error'
                  ? '1.5px solid rgba(185,28,28,0.4)'
                  : '1.5px solid rgba(255, 255, 255, 0.35)',
                boxShadow: feedback.type === 'success'
                  ? '0 12px 32px rgba(22,101,52,0.25), inset 0 1px 0 rgba(255,255,255,0.4)'
                  : feedback.type === 'error'
                    ? '0 12px 32px rgba(185,28,28,0.25), inset 0 1px 0 rgba(255,255,255,0.4)'
                    : '0 12px 32px rgba(118,0,49,0.18), inset 0 1px 0 rgba(255,255,255,0.4)',
                maxWidth: '90vw',
                animation: 'toastPop 220ms ease-out',
              }}
            >
              <span>{feedback.message}</span>
            </div>
          </Portal>
        )}

        {/* ── Modals ── */}
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            user={user}
            initialTab={pendingAction === 'receipt' ? 'finance' : 'overview'}
            autoShowReceiptForm={pendingAction === 'receipt'}
            autoEdit={pendingAction === 'edit'}
            onClose={() => { setSelectedProject(null); setPendingAction(null) }}
          />
        )}

        {showTxnModal && (
          <BarangayTransactionsModal barangay={barangay} onClose={() => setShowTxnModal(false)} />
        )}

        {/* ── View Report Modal — A4 print preview ── */}
        {showReportModal && (
          <Portal>
            <div
              onClick={e => { if (e.target === e.currentTarget) setShowReportModal(false) }}
              style={{
                position: 'fixed', inset: 0, zIndex: 9998,
                background: 'rgba(10, 5, 8, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '2rem 1rem', overflowY: 'auto',
              }}
            >
              {/* Toolbar */}
              <div
                className="no-print report-toolbar"
                style={{
                  width: 'min(210mm, 100%)', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap',
                }}
              >
                <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem' }}>
                  Report Preview — Barangay {barangay}
                </div>
                <div className="report-toolbar-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-sm report-download-btn report-toolbar-btn" onClick={handleDownloadPDF} disabled={isDownloadingPdf} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    {isDownloadingPdf ? 'Generating PDF...' : 'Download (Save as PDF)'}
                  </button>
                  <button className="btn btn-sm report-print-btn report-toolbar-btn" onClick={handlePrintReport} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                    Print
                  </button>
                  <button className="btn btn-sm report-close-btn report-toolbar-btn" onClick={() => setShowReportModal(false)}>
                    Close
                  </button>
                </div>
              </div>

              {/* ── A4 Page ── */}
              <div
                id="sk-report-printable"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  background: '#ffffff',
                  padding: '16mm 15mm',
                  boxShadow: '0 24px 70px rgba(0,0,0,0.35)',
                  color: '#1a1a1a',
                  fontFamily: 'var(--font-body)',
                  boxSizing: 'border-box',
                }}
              >
                {/* Letterhead */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  borderBottom: '4px solid #760031', paddingBottom: '20px', marginBottom: '28px',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '26px', color: '#760031', letterSpacing: '-0.02em' }}>
                      eSKala
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Sangguniang Kabataan Management System · Santa Rosa City, Laguna
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: '#111' }}>
                      SK Project &amp; Budget Report
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Generated: {reportGeneratedAt}
                    </div>
                  </div>
                </div>

                {/* Report subject */}
                <div style={{ marginBottom: '26px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: '#111' }}>
                    Barangay {barangay}
                  </div>
                </div>

                {/* Executive summary paragraph */}
                <div style={{ marginBottom: '26px', fontSize: '12px', lineHeight: 1.9, color: '#333' }}>
                  This report presents the current financial standing and project portfolio of the
                  Sangguniang Kabataan of Barangay {barangay} for the covered period. As of {reportGeneratedAt},
                  the barangay has utilized <strong>{usagePct}%</strong> of its allocated annual budget of{' '}
                  <strong>{formatPeso(budget)}</strong> across <strong>{localProjects.length}</strong> recorded
                  {localProjects.length === 1 ? ' project' : ' projects'}, with <strong>{formatPeso(remain)}</strong> remaining
                  available for future youth development initiatives.
                </div>

                {/* Financial summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '26px' }}>
                  {[
                    { label: 'Annual Budget', val: formatPeso(budget), color: '#760031' },
                    { label: 'Amount Disbursed', val: formatPeso(spent), color: '#b45309' },
                    { label: 'Remaining', val: formatPeso(remain), color: '#166534' },
                  ].map(item => (
                    <div key={item.label} style={{ border: '1px solid #e5e0da', borderRadius: '8px', padding: '16px 16px' }}>
                      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '20px', color: item.color, marginTop: '6px' }}>{item.val}</div>
                    </div>
                  ))}
                </div>

                {/* Utilization bar */}
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#444' }}>Budget Utilization</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#760031' }}>{usagePct}%</span>
                  </div>
                  <div style={{ height: '12px', background: '#f0ece5', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${usagePct}%`, background: 'linear-gradient(90deg, #760031, #9a0040)' }} />
                  </div>
                </div>

                {/* Projects table */}
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: '#111', marginBottom: '12px' }}>
                  Project List ({localProjects.length})
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ background: '#faf4eb' }}>
                      {['Title', 'Category', 'Status', 'Budget', 'Spent', 'Progress'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 10px', borderBottom: '2px solid #760031', color: '#760031', fontWeight: 700, textTransform: 'uppercase', fontSize: '9.5px', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {localProjects.length > 0 ? localProjects.map((p: any) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px 10px', fontWeight: 600 }}>{p.title}</td>
                        <td style={{ padding: '10px 10px', color: '#555' }}>{p.category}</td>
                        <td style={{ padding: '10px 10px', textTransform: 'capitalize', color: '#555' }}>{p.status}</td>
                        <td style={{ padding: '10px 10px' }}>{formatPeso(p.proposedBudget)}</td>
                        <td style={{ padding: '10px 10px', color: '#b45309' }}>{formatPeso(p.spent)}</td>
                        <td style={{ padding: '10px 10px' }}>{p.progress}%</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px 10px', textAlign: 'center', color: '#999' }}>
                          No projects recorded for this barangay.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Footer */}
                <div style={{
                  marginTop: '40px', paddingTop: '14px', borderTop: '1px solid #eee',
                  display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#999',
                }}>
                  <span>eSKala · Sangguniang Kabataan Management System</span>
                  <span>Barangay {barangay} — Confidential, for internal SK use</span>
                </div>
              </div>
            </div>
          </Portal>
        )}

      </div>
    </section >
  )
}
