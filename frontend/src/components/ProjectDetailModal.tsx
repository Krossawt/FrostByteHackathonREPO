/**
 * eSKala — Project Detail Modal
 * Opens when any project card is clicked.
 * Tabs: Overview | Finance & Receipts | Citizen Comments
 */
import { useState, FormEvent } from 'react'
import { receipts as allReceipts, citizenComments as allComments } from '../data/mockData'
import type { ReportProject, Receipt, UserAccount } from '../types'
import CameraCaptureModal from './CameraCaptureModal'

const CATEGORY_IMAGES: Record<string, string> = {
  'Education':            'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
  'Health':               'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
  'Sports':               'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  'Environment':          'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&q=80',
  'Infrastructure':       'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  'Livelihood':           'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
  'Capacity Building':    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  'Peace & Order':        'https://images.unsplash.com/photo-1589994160839-163cd867cfe8?w=800&q=80',
  'Arts & Culture':       'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
  'Disaster Preparedness':'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
  'Governance':           'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  'Other':                'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80',
}

const SAMPLE_RECEIPT_IMAGES = [
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&q=80',
  'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=700&q=80',
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=700&q=80',
]

function getCoverImg(category?: string) {
  return CATEGORY_IMAGES[category ?? 'Other'] ?? CATEGORY_IMAGES['Other']
}

interface ProjectDetailModalProps {
  project: ReportProject | null
  user?: UserAccount | null
  onClose: () => void
}

type ModalTab = 'overview' | 'finance' | 'comments'

export default function ProjectDetailModal({ project, user, onClose }: ProjectDetailModalProps) {
  const [tab, setTab] = useState<ModalTab>('overview')
  const [showReceiptForm, setShowReceiptForm] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null)

  // Receipt form state
  const [rVendor, setRVendor] = useState('')
  const [rAmount, setRAmount] = useState('')
  const [rDate, setRDate]     = useState('')
  const [rDesc, setRDesc]     = useState('')
  const [rError, setRError]   = useState('')
  const [rSuccess, setRSuccess] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [scanningOcr, setScanningOcr]   = useState(false)
  const [ocrMsg, setOcrMsg]             = useState('')
  const [showCameraModal, setShowCameraModal] = useState(false)

  const handleCameraSnap = () => {
    setShowCameraModal(false)
    handleScanOcr()
  }

  const [localReceipts, setLocalReceipts] = useState(
    allReceipts.filter(r => r.projectId === project?.id)
  )

  // Comment form state
  const [cText, setCText] = useState('')
  const [cType, setCType] = useState<'comment'|'suggestion'>('comment')
  const [cError, setCError] = useState('')
  const [localComments, setLocalComments] = useState(
    allComments.filter(c => c.barangay === project?.barangay)
  )

  if (!project) return null

  const canManageReceipts =
    user?.role === 'sk' &&
    (user.skPosition === 'Treasurer' || user.skPosition === 'Chairperson') &&
    user.barangay === project.barangay

  const spentPct = Math.min(Math.round((project.spent / project.proposedBudget) * 100), 100)

  // Simulated AI OCR Scan of uploaded receipt
  const handleScanOcr = () => {
    setScanningOcr(true)
    setOcrMsg('Scanning receipt document with AI OCR intelligence…')
    setTimeout(() => {
      setRVendor('SM Supermarket Santa Rosa')
      setRAmount('24500')
      setRDate(new Date().toISOString().slice(0, 10))
      setRDesc('Sports equipment & tournament supplies')
      setScanningOcr(false)
      setOcrMsg('OCR Scan Complete! Extracted vendor: "SM Supermarket Santa Rosa", Amount: ₱24,500.00')
    }, 1200)
  }

  const handleAddReceipt = (e: FormEvent) => {
    e.preventDefault()
    if (!rVendor.trim() || !rAmount || !rDate) { setRError('Fill in all required fields.'); return }
    const amt = parseFloat(rAmount.replace(/,/g, ''))
    if (isNaN(amt) || amt <= 0) { setRError('Enter a valid amount.'); return }
    const newR = {
      id: `R-${Date.now()}`, projectId: project.id,
      projectTitle: project.title, barangay: project.barangay,
      vendor: rVendor.trim(), amount: amt, date: rDate,
      status: 'pending' as const, ocrExtracted: !!uploadedFile || !!ocrMsg,
      description: rDesc.trim(),
    }
    setLocalReceipts(prev => [newR, ...prev])
    setRVendor(''); setRAmount(''); setRDate(''); setRDesc(''); setRError(''); setUploadedFile(null); setOcrMsg('')
    setRSuccess(true)
    setTimeout(() => { setRSuccess(false); setShowReceiptForm(false) }, 1500)
  }

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault()
    if (!cText.trim()) { setCError('Please write your comment or suggestion.'); return }
    const newC = {
      id: `C-${Date.now()}`, barangay: project.barangay,
      author: user?.name?.split(' ')[0] ?? 'Citizen',
      text: cText.trim(), date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      type: cType, votes: 0,
    }
    setLocalComments(prev => [newC, ...prev])
    setCText(''); setCError('')
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal project-modal">

        {/* ── Cover ── */}
        <div className="project-modal-cover">
          <img
            src={getCoverImg(project.category)}
            alt={project.category}
            className="project-modal-cover-img"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="project-modal-cover-overlay">
            <span className={`badge badge-${project.status}`}>{project.status}</span>
            <h2 className="project-modal-title">{project.title}</h2>
            <div className="project-modal-meta-row">
              <span>{project.barangay}</span>
              <span>·</span>
              <span>{project.category}</span>
              <span>·</span>
              <span>{project.startDate} → {project.endDate}</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="filter-tabs" style={{ padding: '0 1.5rem', borderBottom: '1px solid var(--border)' }}>
          {(['overview', 'finance', 'comments'] as ModalTab[]).map(t => (
            <button key={t} className={`filter-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'overview' ? 'Overview' : t === 'finance' ? `Finance (${localReceipts.length})` : `Comments (${localComments.length})`}
            </button>
          ))}
        </div>

        <div className="project-modal-body">

          {/* ── Tab: Overview ── */}
          {tab === 'overview' && (
            <div>
              <div className="project-modal-stats">
                <div className="project-modal-stat-item">
                  <div className="project-modal-stat-val" style={{ color: 'var(--maroon)' }}>{project.progress}%</div>
                  <div className="project-modal-stat-label">Completion</div>
                </div>
                <div className="project-modal-stat-item">
                  <div className="project-modal-stat-val">₱{(project.proposedBudget / 1000).toFixed(0)}K</div>
                  <div className="project-modal-stat-label">Proposed Budget</div>
                </div>
                <div className="project-modal-stat-item">
                  <div className="project-modal-stat-val" style={{ color: '#b45309' }}>₱{(project.spent / 1000).toFixed(0)}K</div>
                  <div className="project-modal-stat-label">Disbursed</div>
                </div>
                <div className="project-modal-stat-item">
                  <div className="project-modal-stat-val" style={{ color: '#166534' }}>₱{((project.proposedBudget - project.spent) / 1000).toFixed(0)}K</div>
                  <div className="project-modal-stat-label">Remaining</div>
                </div>
              </div>

              <div style={{ margin: '1.2rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem' }}>Budget Utilization</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--maroon)' }}>{spentPct}%</span>
                </div>
                <div className="progress-bar progress-thick">
                  <div className="progress-fill" style={{ width: `${spentPct}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.74rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                  <span>₱{project.spent.toLocaleString()} spent</span>
                  <span>of ₱{project.proposedBudget.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div className="page-kicker" style={{ marginBottom: '0.5rem' }}>Description</div>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--ink)' }}>{project.description}</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('finance')}>
                  View Finance Records
                </button>
                {!user && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setTab('comments')}>
                    Leave Feedback
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Finance & Receipts ── */}
          {tab === 'finance' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div className="page-kicker">Financial Records</div>
                  <div style={{ fontSize: '1.05rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)', marginTop: '0.15rem' }}>
                    Total Disbursed: ₱{localReceipts.reduce((s, r) => s + r.amount, 0).toLocaleString()}
                  </div>
                </div>
                {canManageReceipts && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowReceiptForm(v => !v)}>
                    + Attach Receipt
                  </button>
                )}
              </div>

              {/* Add receipt form with Upload & OCR */}
              {showReceiptForm && canManageReceipts && (
                <form onSubmit={handleAddReceipt} className="receipt-form" style={{ marginBottom: '1.5rem' }}>
                  <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>Attach New Receipt Document</div>
                  
                  {rSuccess && <div className="alert-success">Receipt recorded successfully!</div>}
                  {rError && <div className="alert-error">{rError}</div>}
                  {ocrMsg && <div className="alert-info" style={{ marginBottom: '0.75rem' }}>{ocrMsg}</div>}

                  {/* Upload Zone & OCR Trigger */}
                  <div style={{ marginBottom: '1rem', border: '1.5px dashed var(--maroon)', padding: '1rem', textAlign: 'center', background: 'rgba(118,0,49,0.02)', borderRadius: '8px' }}>
                    {uploadedFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem' }}>{uploadedFile.name}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>{(uploadedFile.size / 1024).toFixed(1)} KB · File Attached</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCameraModal(true)}>
                            📷 Open Camera
                          </button>
                          <button type="button" className="btn btn-gold btn-sm" onClick={handleScanOcr} disabled={scanningOcr}>
                            {scanningOcr ? 'Scanning OCR…' : '⚡ Auto-Scan with OCR'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                        <label style={{ cursor: 'pointer', textAlign: 'center', display: 'block', width: '100%' }}>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            style={{ display: 'none' }}
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                setUploadedFile(e.target.files[0])
                              }
                            }}
                          />
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2" style={{ marginBottom: '0.3rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--maroon)' }}>
                            Click to Upload Receipt File or Drag &amp; Drop
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                            Upload JPG, PNG, or PDF receipts (Max 10MB)
                          </div>
                        </label>
                        <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 700 }}>— OR —</div>
                        <button type="button" className="btn btn-gold btn-sm" onClick={() => setShowCameraModal(true)}>
                          📷 Open Camera / Snap Receipt Photo
                        </button>
                      </div>
                    )}
                  </div>

                  {showCameraModal && (
                    <CameraCaptureModal
                      title="Capture Official Receipt Photo"
                      subtitle="Align official receipt document within frame and snap photo"
                      onCapture={handleCameraSnap}
                      onClose={() => setShowCameraModal(false)}
                    />
                  )}

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Vendor / Payee *</label>
                      <input className="form-input" value={rVendor} onChange={e => setRVendor(e.target.value)} placeholder="e.g. SM Santa Rosa Hardware" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount (₱) *</label>
                      <input className="form-input" value={rAmount} onChange={e => setRAmount(e.target.value)} placeholder="e.g. 24500" />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Date *</label>
                      <input className="form-input" type="date" value={rDate} onChange={e => setRDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description / Purpose</label>
                      <input className="form-input" value={rDesc} onChange={e => setRDesc(e.target.value)} placeholder="Disbursement details" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button type="submit" className="btn btn-primary btn-sm">Save &amp; Attach Receipt</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowReceiptForm(false)}>Cancel</button>
                  </div>
                </form>
              )}

              {/* Receipts list with View Receipt Button */}
              {localReceipts.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {localReceipts.map(r => (
                    <div key={r.id} className="receipt-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.85rem 1rem', background: '#fff', border: '1px solid rgba(118,0,49,0.1)' }}>
                      <div style={{ flex: 1 }}>
                        <div className="receipt-vendor" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.92rem' }}>{r.vendor}</div>
                        <div className="receipt-meta" style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                          {r.date} {r.description ? `· ${r.description}` : ''}
                        </div>
                        <div style={{ marginTop: '0.3rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span className={`badge ${r.status === 'verified' ? 'badge-completed' : r.status === 'pending' ? 'badge-upcoming' : 'badge-cancelled'}`}>
                            {r.status}
                          </span>
                          {r.ocrExtracted && (
                            <span style={{ fontSize: '0.72rem', color: '#166534', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                              OCR Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <div className="receipt-amount" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem', color: 'var(--maroon)' }}>
                          ₱{r.amount.toLocaleString()}
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={() => setViewingReceipt(r)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No receipts recorded yet</div>
                  {canManageReceipts && <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Attach the first receipt for this project.</div>}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Comments ── */}
          {tab === 'comments' && (
            <div>
              {/* Add comment form (logged-in citizens) */}
              {user?.role === 'citizen' && (
                <form onSubmit={handleAddComment} style={{ marginBottom: '1.2rem', background: 'var(--maroon-faint)', borderRadius: 12, padding: '1rem 1.2rem' }}>
                  <div className="page-kicker" style={{ marginBottom: '0.65rem' }}>Share Your Feedback</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    {(['comment', 'suggestion'] as const).map(t => (
                      <button key={t} type="button"
                        className={`filter-tab${cType === t ? ' active' : ''}`}
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => setCType(t)}>
                        {t === 'comment' ? 'Comment' : 'Suggestion'}
                      </button>
                    ))}
                  </div>
                  {cError && <div className="alert-error" style={{ marginBottom: '0.5rem' }}>{cError}</div>}
                  <textarea
                    className="form-input"
                    rows={3}
                    value={cText}
                    onChange={e => setCText(e.target.value)}
                    placeholder={cType === 'comment' ? 'Share your thoughts on this project…' : 'What would you suggest to improve this?'}
                    style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '0.65rem' }}>Submit</button>
                </form>
              )}

              {/* Visitor Call-to-Action banner when not logged in */}
              {!user && (
                <div style={{ marginBottom: '1.2rem', padding: '1.1rem 1.3rem', background: 'rgba(118,0,49,0.04)', border: '1.5px solid rgba(118,0,49,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)' }}>
                      Want to share your feedback or suggestions with Barangay {project.barangay} SK?
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                      Log in or create a free citizen account to submit comments directly to your local SK Council.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <a href="/login" className="btn btn-primary btn-sm">Log In to Comment</a>
                    <a href="/register" className="btn btn-secondary btn-sm">Create Account</a>
                  </div>
                </div>
              )}

              {localComments.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {localComments.map(c => (
                    <div key={c.id} className="comment-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span className="comment-author">{c.author}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {c.type && <span className={`badge ${c.type === 'suggestion' ? 'badge-upcoming' : 'badge-ongoing'}`}>{c.type}</span>}
                          {c.votes !== undefined && (
                            <span className="comment-votes">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                              {c.votes}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="comment-date">{c.date}</span>
                      <p className="comment-text">{c.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No feedback yet</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Be the first to comment on this project.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Receipt Image Lightbox Modal ── */}
      {viewingReceipt && (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setViewingReceipt(null)}>
          <div className="modal" style={{ width: 'min(480px, 90vw)', padding: '1.25rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>
                  Receipt Document — {viewingReceipt.vendor}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                  Date: {viewingReceipt.date} · Amount: ₱{viewingReceipt.amount.toLocaleString()}
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setViewingReceipt(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Authentic Mock Receipt Document Card */}
            <div style={{
              background: '#FAF8F5',
              border: '2px dashed rgba(118,0,49,0.3)',
              padding: '1.25rem',
              borderRadius: '6px',
              fontFamily: 'Courier New, monospace',
              color: '#111',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.08)',
              marginBottom: '1rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Official Stamp */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                border: '2px solid #166534',
                color: '#166534',
                padding: '0.2rem 0.5rem',
                fontSize: '0.68rem',
                fontWeight: 800,
                transform: 'rotate(-8deg)',
                letterSpacing: '0.08em',
                background: 'rgba(240,253,244,0.85)'
              }}>
                ✓ AUDITED &amp; VERIFIED
              </div>

              <div style={{ textAlign: 'center', borderBottom: '1px dashed #aaa', paddingBottom: '0.75rem', marginBottom: '0.85rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>Republic of the Philippines · City of Santa Rosa</div>
                <div style={{ fontWeight: 900, fontSize: '0.92rem', color: 'var(--maroon)', marginTop: '0.15rem' }}>BARANGAY {project.barangay.toUpperCase()} SANGGUNIANG KABATAAN</div>
                <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '0.15rem' }}>OFFICIAL DISBURSEMENT RECEIPT · O.R. #OR-2025-0{Math.abs(viewingReceipt.id.charCodeAt(0)) % 9000 + 1000}</div>
              </div>

              <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.78rem', marginBottom: '0.85rem' }}>
                <div><strong>PAYEE / VENDOR:</strong> {viewingReceipt.vendor}</div>
                <div><strong>DATE FILED:</strong> {viewingReceipt.date}</div>
                <div><strong>PROJECT:</strong> {viewingReceipt.projectTitle || project.title}</div>
                <div><strong>PARTICULARS:</strong> {viewingReceipt.description || 'Disbursement for youth initiative'}</div>
              </div>

              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', borderTop: '1px dashed #aaa', borderBottom: '1px dashed #aaa', margin: '0.5rem 0 0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '0.3rem 0' }}>DESCRIPTION</th>
                    <th style={{ textAlign: 'right', padding: '0.3rem 0' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.3rem 0' }}>Procurement &amp; Supplies</td>
                    <td style={{ textAlign: 'right' }}>₱{(viewingReceipt.amount * 0.7).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.3rem 0' }}>Logistics &amp; Services</td>
                    <td style={{ textAlign: 'right' }}>₱{(viewingReceipt.amount * 0.3).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900, fontSize: '0.95rem', color: 'var(--maroon)' }}>
                <span>TOTAL AMOUNT PAID:</span>
                <span>₱{viewingReceipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }} onClick={() => setViewingReceipt(null)}>
              Done Viewing
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
