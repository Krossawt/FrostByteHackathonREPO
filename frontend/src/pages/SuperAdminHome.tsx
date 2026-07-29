import { useState, useEffect } from 'react'
import { DonutChart } from '../components/MiniChart'
import ProjectDetailModal from '../components/ProjectDetailModal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { ReportProject } from '../types'
import Portal from '../components/Portal'
import { fetchProjectsApi, fetchExecutiveSummaryApi, fetchAuditLogsApi, postApprovedAbyipApi, createNewsletterApi } from '../services/api'

// ── Category cover images (same palette as SKProjects) ──────────────────────
const CATEGORY_IMAGES: Record<string, string> = {
  'Education': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=640&q=75',
  'Health': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=640&q=75',
  'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&q=75',
  'Sports & Recreation': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&q=75',
  'Environment': 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=640&q=75',
  'Infrastructure': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=640&q=75',
  'Livelihood': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=640&q=75',
  'Capacity Building': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&q=75',
  'Peace & Order': 'https://images.unsplash.com/photo-1589994160839-163cd867cfe8?w=640&q=75',
  'Arts & Culture': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=75',
  'Disaster Preparedness': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=640&q=75',
  'Governance': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=640&q=75',
  'Health & Wellness': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=640&q=75',
  'Other': 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=640&q=75',
}
function getCover(cat?: string) {
  return CATEGORY_IMAGES[cat ?? 'Other'] ?? CATEGORY_IMAGES['Other']
}

function formatMillionsTruncate(amount: number, decimals = 2) {
  if (amount === 0) {
    return '₱0'
  }
  const factor = Math.pow(10, decimals)
  const truncatedValue = Math.floor((amount * factor) / 1_000_000) / factor
  return `₱${truncatedValue.toFixed(decimals)}M`
}

interface SuperAdminHomeProps {
  selectedBarangay: string
  setSelectedBarangay: (b: string) => void
}

type Feedback = { type: 'success' | 'info'; message: string }

export default function SuperAdminHome({ selectedBarangay, setSelectedBarangay }: SuperAdminHomeProps) {
  const [view, setView] = useState<'city' | 'barangay'>(selectedBarangay ? 'barangay' : 'city')

  // Dynamic States
  const [barangayList, setBarangayList] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [cityNews, setCityNews] = useState<any[]>([])

  // Project detail modal
  const [selectedProject, setSelectedProject] = useState<ReportProject | null>(null)

  // ABYIP modal states
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [annualYear, setAnnualYear] = useState('2025')
  const [approvedBudget, setApprovedBudget] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Discard-changes confirmation for the ABYIP modal
  const [confirmAction, setConfirmAction] = useState<'cancel' | null>(null)

  // Feedback banner (glass-style, portal-rendered — success = green, info = maroon)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const openBudgetModal = () => setShowBudgetModal(true)

  const handleCloseBudgetModal = () => {
    setShowBudgetModal(false)
    setAnnualYear('2025')
    setApprovedBudget('')
    setSelectedFile(null)
    setSuccessMessage('')
    setErrorMessage('')
  }

  // Form is only considered "dirty" if the user actually changed something
  // from the defaults — nothing entered means Cancel closes immediately.
  const isBudgetFormDirty = () => {
    return !!selectedFile || approvedBudget !== '' || annualYear !== '2025'
  }

  // X button, overlay click, and Cancel button all route through here.
  // Already on the success screen → just close, nothing to lose.
  // Otherwise → only prompt when the form actually has unsaved input.
  const requestCloseBudgetModal = () => {
    if (successMessage) {
      handleCloseBudgetModal()
      return
    }
    if (isBudgetFormDirty()) {
      setConfirmAction('cancel')
    } else {
      handleCloseBudgetModal()
    }
  }

  // Live API State
  const [liveProjects, setLiveProjects] = useState<ReportProject[]>([])

  useEffect(() => {
    async function loadLiveData() {
      try {
        const [sumRes, projRes, logsRes] = await Promise.all([
          fetchExecutiveSummaryApi().catch(() => null),
          fetchProjectsApi().catch(() => []),
          fetchAuditLogsApi().catch(() => []),
        ])

        if (sumRes && sumRes.barangays) {
          setBarangayList(sumRes.barangays.map((b: any) => ({
            barangay: b.barangay,
            annualBudget: b.annualBudget || 0,
            spent: b.spent || 0,
            projects: b.projectCount || 0,
            remaining: b.remaining || 0,
          })))
        }

        if (Array.isArray(projRes)) {
          setLiveProjects(projRes)
        }

        if (Array.isArray(logsRes) && logsRes.length > 0) {
          setLogs(logsRes.map((l: any) => ({
            id: String(l.logID || l.id),
            user: l.actorName || 'System',
            actor: l.actorName || 'System',
            barangay: l.barangay || 'City',
            action: `${l.actionType}: ${l.details || ''}`,
            date: l.timestamp ? new Date(l.timestamp).toLocaleDateString() : 'Today',
            when: 'Recently'
          })))
        }
      } catch (err) {
        console.warn('API fetch warning:', err)
      }
    }
    loadLiveData()
  }, [])

  // Auto-dismiss feedback banner after 3 seconds
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

  const handleSubmitBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBarangay) {
      setErrorMessage('Please select a specific barangay first.')
      return
    }
    if (!selectedFile) {
      setErrorMessage('Please upload the approved ABYIP document first.')
      return
    }
    if (!approvedBudget || parseFloat(approvedBudget) <= 0) {
      setErrorMessage('Please enter a valid approved ABYIP budget amount.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const budgetVal = parseFloat(approvedBudget)

    try {
      await postApprovedAbyipApi({
        budgetBarangay: selectedBarangay,
        budgetYear: parseInt(annualYear) || 2026,
        budgetValue: budgetVal,
        budgetFileURL: `/static/uploads/${selectedFile.name}`
      })

      await createNewsletterApi({
        title: `ABYIP Approved for Barangay ${selectedBarangay}`,
        summary: `Barangay ${selectedBarangay} receives ₱${budgetVal.toLocaleString()} as their annual budget for the fiscal year ${parseInt(annualYear) || 2026}.`,
        category: 'ABYIP',
        projectLocation: selectedBarangay,
      }).catch((newsErr: any) => {
        console.warn('Failed to auto-create ABYIP newsletter:', newsErr)
      })

      setBarangayList((prev: any[]) =>
        prev.map((b: any) =>
          b.barangay === selectedBarangay
            ? { ...b, annualBudget: budgetVal, remaining: Math.max(0, budgetVal - b.spent) }
            : b
        )
      )

      setIsSubmitting(false)
      setSuccessMessage(`ABYIP (FY ${annualYear}) for Barangay ${selectedBarangay} — ₱${budgetVal.toLocaleString()} has been successfully posted to live database! A newsletter announcement has been generated.`)
      setFeedback({ type: 'success', message: 'Post Approved ABYIP successfully' })
    } catch (err: any) {
      setIsSubmitting(false)
      setErrorMessage(err.message || 'Failed to post approved ABYIP to backend')
    }
  }

  // ── Computed values ──────────────────────────────────────────────────────
  const totalBudget = barangayList.reduce((s: number, b: any) => s + (b.annualBudget || 0), 0)
  const totalSpent = barangayList.reduce((s: number, b: any) => s + (b.spent || 0), 0)
  const totalProj = liveProjects.length
  const usagePct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const bSummary = selectedBarangay ? barangayList.find((b: any) => b.barangay === selectedBarangay) : null
  const bProjects = selectedBarangay ? liveProjects.filter((p: any) => p.barangay === selectedBarangay || p.projectLocation === selectedBarangay) : []

  const displayBudget = selectedBarangay && bSummary ? bSummary.annualBudget : totalBudget
  const displaySpent = selectedBarangay && bSummary ? bSummary.spent : totalSpent
  const displayProj = selectedBarangay ? bProjects.length : totalProj
  const displayUsage = displayBudget > 0 ? Math.min(Math.round((displaySpent / displayBudget) * 100), 100) : 0

  const recentLogs = logs.slice(0, 10)

  // ── Barangay-filtered logs ───────────────────────────────────────────────
  const barangayLogs = selectedBarangay
    ? logs.filter((l: any) => l.barangay === selectedBarangay)
    : recentLogs

  return (
    <section className="section section-accent-flow" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
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

        {/* ── Back breadcrumb: only when a barangay is selected ── */}
        {selectedBarangay && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.1rem',
            padding: '0.65rem 1rem',
            background: 'rgba(118,0,49,0.05)',
            border: '1.5px solid rgba(118,0,49,0.12)',
            borderRadius: '8px',
          }}>
            <button
              onClick={() => { setSelectedBarangay(''); setView('city') }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem',
                color: 'var(--maroon)', padding: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              City Overview
            </button>
            <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>/</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink)' }}>
              Barangay {selectedBarangay}
            </span>
          </div>
        )}

        {/* ── Page Intro Banner ── */}
        <div className="page-intro reveal section-glass-grid" style={{ padding: '1.5rem 1.8rem', borderRadius: '12px', marginBottom: '1.8rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,244,235,0.9) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="page-kicker">City Executive Command · Super Admin</span>
              <h1 className="page-title" style={{ marginTop: '0.3rem' }}>
                {selectedBarangay
                  ? `Barangay ${selectedBarangay} — ABYIP Dashboard`
                  : 'Santa Rosa City SK Executive Dashboard'}
              </h1>
              <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
                {selectedBarangay
                  ? `Annual Barangay Youth Investment Program (ABYIP) — full financial breakdown, projects, and transactions for Barangay ${selectedBarangay}.`
                  : 'Financial and operational oversight across all 18 barangays of Santa Rosa City, Laguna. Click a barangay card below to manage its ABYIP.'}
              </p>
            </div>
            {/* Post Approved ABYIP button ONLY when a specific barangay is selected */}
            {selectedBarangay && (
              <button
                className="btn btn-gold btn-sm"
                onClick={openBudgetModal}
                style={{ alignSelf: 'flex-start', marginTop: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Post Approved ABYIP
              </button>
            )}
          </div>
        </div>

        {/* ── Stat Cards (always show, data changes by context) ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">{formatMillionsTruncate(displayBudget, 2)}</div>
            <div className="stat-label">{selectedBarangay ? `Barangay ${selectedBarangay} ABYIP Budget` : 'Total SK Budget FY 2025'}</div>
            <div className="stat-sub">{selectedBarangay ? 'FY 2025 Allocation' : '18 Barangays combined'}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #b45309' }}>
            <div className="stat-value" style={{ color: '#b45309' }}>{formatMillionsTruncate(displaySpent, 2)}</div>
            <div className="stat-label">Total Disbursed</div>
            <div className="stat-sub">{displayUsage}% utilization rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{displayProj}</div>
            <div className="stat-label">Total Projects</div>
            <div className="stat-sub">{(selectedBarangay ? bProjects : liveProjects).filter((p: any) => p.status === 'ongoing').length} ongoing</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #1d4ed8' }}>
            <div className="stat-value" style={{ color: '#1d4ed8' }}>{selectedBarangay ? '1' : '18'}</div>
            <div className="stat-label">{selectedBarangay ? 'Barangay Selected' : 'Active Barangays'}</div>
            <div className="stat-sub">{selectedBarangay ? `Unit: ${selectedBarangay}` : 'All units reporting'}</div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            CITY-WIDE VIEW (no barangay selected)
        ════════════════════════════════════════════════════════ */}
        {!selectedBarangay && (
          <>
            {/* City-wide utilization + project breakdown */}
            <div className="card-grid card-grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="chart-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <DonutChart value={usagePct} size={110} stroke={14} label={`${usagePct}%`} sublabel="used" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem' }}>City-Wide SK Fund Utilization</div>
                  {[
                    { label: 'Total Budget', val: formatMillionsTruncate(totalBudget, 1), color: 'var(--maroon)' },
                    { label: 'Disbursed', val: formatMillionsTruncate(totalSpent, 1), color: '#b45309' },
                    { label: 'Remaining', val: formatMillionsTruncate(totalBudget - totalSpent, 1), color: '#166534' },
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
                  { label: 'Ongoing', count: liveProjects.filter((p: any) => p.status === 'ongoing').length, color: 'var(--maroon)' },
                  { label: 'Upcoming', count: liveProjects.filter((p: any) => p.status === 'upcoming').length, color: '#1d4ed8' },
                  { label: 'Completed', count: liveProjects.filter((p: any) => p.status === 'completed').length, color: '#166534' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                    <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 900, color: s.color, lineHeight: 1, minWidth: '2rem' }}>{s.count}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>{s.label} projects</div>
                  </div>
                ))}
              </div>
            </div>

            {/* View tabs + barangay/activity columns */}
            <div className="page-cols page-cols-sidebar">
              {/* Left — Barangay Budget Cards (clickable to drill in) */}
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <div className="page-kicker">Barangay Breakdown</div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                    Budget Utilization by Barangay — click to view ABYIP
                  </h2>
                </div>
                <div className="card-grid card-grid-2">
                  {barangayList.map(b => {
                    const pct = b.annualBudget > 0 ? Math.round((b.spent / b.annualBudget) * 100) : 0
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
                          <span>{formatMillionsTruncate(b.spent, 2)}</span>
                          <span>{formatMillionsTruncate(b.annualBudget, 2)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right — City News + System Activity */}
              <div style={{ display: 'grid', gap: '1.5rem', alignContent: 'start' }}>
                <div>
                  <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>City News</div>
                  <div style={{ display: 'grid', gap: '0.65rem' }}>
                    {cityNews.slice(0, 5).map((n: any) => (
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
                    {recentLogs.map((log: any) => (
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
          </>
        )}

        {/* ════════════════════════════════════════════════════════
            BARANGAY-SPECIFIC VIEW (a barangay is selected)
            Shows ONLY that barangay's data — no city-wide info
        ════════════════════════════════════════════════════════ */}
        {selectedBarangay && (
          <>
            {bSummary ? (
              <>
                {/* ── Barangay ABYIP Header Banner ── */}
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1.1rem 1.4rem',
                  background: 'linear-gradient(135deg, var(--maroon), var(--maroon-dark))',
                  color: '#fff',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                      Barangay {selectedBarangay}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.2rem' }}>
                      {bSummary.projects} project{bSummary.projects !== 1 ? 's' : ''} · ABYIP Allocation: {formatMillionsTruncate(bSummary.annualBudget, 2)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Budget', val: formatMillionsTruncate(bSummary.annualBudget, 2), color: '#fef3c7' },
                      { label: 'Disbursed', val: formatMillionsTruncate(bSummary.spent, 2), color: '#fed7aa' },
                      { label: 'Remaining', val: formatMillionsTruncate(bSummary.remaining, 2), color: '#bbf7d0' },
                    ].map(item => (
                      <div key={item.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.12)', padding: '0.5rem 0.9rem', borderRadius: '8px' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem', color: item.color }}>{item.val}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Barangay Utilization Bar ── */}
                <div className="chart-card" style={{ marginBottom: '1.5rem', flexDirection: 'row', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', display: 'flex' }}>
                  <DonutChart
                    value={bSummary.annualBudget > 0 ? Math.min(Math.round((bSummary.spent / bSummary.annualBudget) * 100), 100) : 0}
                    size={100}
                    stroke={13}
                    label={`${bSummary.annualBudget > 0 ? Math.min(Math.round((bSummary.spent / bSummary.annualBudget) * 100), 100) : 0}%`}
                    sublabel="used"
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                      ABYIP Fund Utilization — Barangay {selectedBarangay}
                    </div>
                    {[
                      { label: 'ABYIP Budget', val: formatMillionsTruncate(bSummary.annualBudget, 2), color: 'var(--maroon)' },
                      { label: 'Disbursed', val: formatMillionsTruncate(bSummary.spent, 2), color: '#b45309' },
                      { label: 'Remaining', val: formatMillionsTruncate(bSummary.remaining, 2), color: '#166534' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--muted)' }}>{item.label}</span>
                        <span style={{ fontWeight: 700, color: item.color }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Barangay Projects (v-card style) ── */}
                <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div className="page-kicker">Projects</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                      Barangay {selectedBarangay} — All Projects ({bProjects.length})
                    </h2>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(['ongoing', 'upcoming', 'completed'] as const).map(s => (
                      <span key={s} className={`badge badge-${s}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                        {bProjects.filter((p: any) => p.status === s).length} {s}
                      </span>
                    ))}
                  </div>
                </div>

                {bProjects.length > 0 ? (
                  <div className="card-grid card-grid-3" style={{ marginBottom: '2rem' }}>
                    {bProjects.map(p => (
                      <div key={p.id} className="v-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedProject(p)}>
                        <div className="v-card-img-wrap">
                          <img
                            src={getCover(p.category)}
                            alt={p.category}
                            className="v-card-img"
                            onError={e => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=640&q=75'
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
                          {p.description && <p className="v-card-desc">{p.description}</p>}

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
                            <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                              <div>Spent: <strong style={{ color: '#b45309' }}>₱{(p.spent / 1000).toFixed(0)}K</strong></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)', marginBottom: '2rem' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No projects found for Barangay {selectedBarangay}</div>
                  </div>
                )}

                {/* ── Barangay-specific Activity Log ── */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div className="page-kicker">Activity Log</div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                    Barangay {selectedBarangay} — Recent Activity
                  </h2>
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {barangayLogs.length > 0 ? barangayLogs.map((log: any) => (
                    <div key={log.id} className="card" style={{ padding: '0.72rem 0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink)' }}>{log.action}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{log.actor} · {log.barangay}</div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--muted-light)', flexShrink: 0 }}>{log.date}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem' }}>No activity recorded for this barangay yet.</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Select a barangay from the header dropdown to view its details</div>
              </div>
            )}
          </>
        )}

        {/* ── Project Detail Modal ── */}
        {selectedProject && (
          <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}

        {/* ── Post Approved ABYIP Modal ── */}
        {showBudgetModal && selectedBarangay && (
          <Portal>
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) requestCloseBudgetModal() }}>
              <div className="modal" style={{ maxWidth: '520px' }}>
                <div className="modal-header">
                  <span className="modal-title">Post Approved ABYIP — Barangay {selectedBarangay}</span>
                  <button className="modal-close" onClick={requestCloseBudgetModal}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleSubmitBudget}>
                  <div className="modal-body">
                    {/* Context banner */}
                    {!successMessage && (
                      <div className="notice info" style={{ fontSize: '0.82rem' }}>
                        Annual Barangay Youth Investment Program (ABYIP) for <strong>Barangay {selectedBarangay}</strong>.
                        Upload the official approved document first — budget details will then appear.
                      </div>
                    )}

                    {successMessage && (
                      <div className="notice success">{successMessage}</div>
                    )}
                    {errorMessage && (
                      <div className="notice error">{errorMessage}</div>
                    )}

                    {!successMessage && (
                      <>
                        {/* ── STEP 1: Upload Document (always visible) ── */}
                        <div className="field-group">
                          <label className="field-label">
                            Step 1 — Upload Approved ABYIP Document *
                          </label>
                          {selectedFile ? (
                            <div style={{
                              border: '1.5px dashed var(--maroon)',
                              background: 'rgba(118, 0, 49, 0.03)',
                              padding: '1rem',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                <div style={{ textAlign: 'left' }}>
                                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink)' }}>{selectedFile.name}</div>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>{(selectedFile.size / 1024).toFixed(1)} KB — Document attached ✓</div>
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
                              />
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                              <div>
                                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--maroon)' }}>Click to upload ABYIP document</span> or drag and drop
                              </div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>PDF, DOCX, XLSX, or Image — up to 10MB</span>
                            </label>
                          )}
                        </div>

                        {/* ── STEP 2: Budget details — ONLY visible after file is uploaded ── */}
                        {selectedFile && (
                          <>
                            <div className="field-group">
                              <label className="field-label">Target Barangay</label>
                              <input
                                type="text"
                                className="input"
                                value={`Barangay ${selectedBarangay}`}
                                disabled
                                style={{ background: 'rgba(0,0,0,0.04)', fontWeight: 700, color: 'var(--maroon)' }}
                              />
                            </div>

                            <div className="field-group">
                              <label className="field-label">Step 2 — Fiscal Year (FY) *</label>
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
                              <label className="field-label">Step 3 — Approved ABYIP Budget Amount (₱) *</label>
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
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div className="modal-footer">
                    {successMessage ? (
                      <button type="button" className="btn btn-primary" onClick={requestCloseBudgetModal}>
                        Close
                      </button>
                    ) : (
                      <>
                        <button type="button" className="btn btn-secondary" onClick={requestCloseBudgetModal} disabled={isSubmitting}>
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !selectedFile}>
                          {isSubmitting ? 'Posting ABYIP...' : 'Post Approved ABYIP'}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </Portal>
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
            handleCloseBudgetModal()
            setConfirmAction(null)
            setFeedback({ type: 'info', message: 'Changes discarded' })
          }}
          onCancel={() => setConfirmAction(null)}
        />

      </div>
    </section>
  )
}
