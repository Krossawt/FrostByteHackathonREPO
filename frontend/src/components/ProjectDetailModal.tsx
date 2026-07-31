/**
 * eSKala — Project Detail Modal
 * Opens when any project card is clicked.
 * Tabs: Overview | Finance & Receipts | Citizen Comments
 */
import { useState, useEffect, FormEvent } from 'react'
// @ts-ignore
import Tesseract from 'tesseract.js'
import type { ReportProject, Receipt, UserAccount } from '../types'
import CameraCaptureModal from './CameraCaptureModal'
import ConfirmDialog from './ConfirmDialog'
import Portal from './Portal'
import { fetchCommentsApi, fetchProjectByIdApi, updateProjectApi, postCommentApi, createPurchaseOrderApi, fetchPurchaseOrdersApi, uploadReceiptImageApi, resolveImageUrl } from '../services/api'

const CATEGORY_IMAGES: Record<string, string> = {
  'Education': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
  'Health': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
  'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  'Environment': 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&q=80',
  'Infrastructure': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  'Livelihood': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
  'Capacity Building': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  'Peace & Order': 'https://images.unsplash.com/photo-1589994160839-163cd867cfe8?w=800&q=80',
  'Arts & Culture': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
  'Disaster Preparedness': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
  'Governance': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  'Other': 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80',
}

const CATEGORY_OPTIONS = ['Health & Wellness', 'Education', 'Sports & Recreation', 'Infrastructure', 'Environment', 'Livelihood', 'Capacity Building', 'Peace & Order', 'Other']

function getCoverImg(category?: string) {
  return CATEGORY_IMAGES[category ?? 'Other'] ?? CATEGORY_IMAGES['Other']
}

interface ProjectDetailModalProps {
  project: ReportProject | null
  user?: UserAccount | null
  onClose: () => void
  initialTab?: ModalTab
  autoShowReceiptForm?: boolean
  autoEditProject?: boolean
  onAddReceipt?: (projectId: string, receipt: Receipt) => void
  onProjectUpdated?: (updated: ReportProject) => void
}

const STATUS_LEVELS: Record<string, number> = {
  'Incoming': 1, 'incoming': 1, 'upcoming': 1,
  'In Progress': 2, 'in progress': 2, 'ongoing': 2,
  'Completed': 3, 'completed': 3, 'posted': 3,
}

function getStatusLevel(st?: string): number {
  if (!st) return 1
  return STATUS_LEVELS[st] || 1
}

type ModalTab = 'overview' | 'finance' | 'comments'
type Feedback = { type: 'success' | 'info'; message: string }

function mapApiProjectToReportProject(project: any, fallbackBarangay: string): ReportProject {
  const rawStatus = String(project?.projectStatus || project?.status || 'ongoing')
  const normalizedStatus = rawStatus.toLowerCase()
  const status: ReportProject['status'] = normalizedStatus.includes('posted') || normalizedStatus.includes('completed')
    ? 'completed'
    : normalizedStatus.includes('approval') || normalizedStatus.includes('finance') || normalizedStatus.includes('draft')
      ? 'upcoming'
      : 'ongoing'

  const proposedBudget = Number(project?.projectBudget ?? project?.proposedBudget ?? 0)
  const spent = Number(project?.projectBreakdown ?? project?.spent ?? 0)
  const startDateValue = project?.projectStartTime || project?.startDate || ''
  const endDateValue = project?.projectEndTime || project?.endDate || ''

  return {
    id: String(project?.projectID || project?.id || ''),
    projectId: project?.projectID ? Number(project.projectID) : undefined,
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
    projectStatus: project?.projectStatus || project?.status,
    projectDescription: project?.projectDescription || project?.description || '',
    projectCategory: project?.projectCategory || project?.category || 'Education',
    projectBudget: proposedBudget,
    projectBreakdown: spent,
    projectProgress: Number(project?.projectProgress ?? project?.progress ?? 0),
    projectStartTime: startDateValue,
    projectEndTime: endDateValue,
  }
}

export default function ProjectDetailModal({
  project,
  user,
  onClose,
  initialTab,
  autoShowReceiptForm,
  autoEditProject,
  onAddReceipt,
  onProjectUpdated,
}: ProjectDetailModalProps) {

  const [tab, setTab] = useState<ModalTab>(initialTab || 'overview')
  const [showReceiptForm, setShowReceiptForm] = useState(!!autoShowReceiptForm)
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null)

  // Receipt form state
  const [rVendor, setRVendor] = useState('')
  const [rAmount, setRAmount] = useState('')
  const [rDate, setRDate] = useState('')
  const [rDesc, setRDesc] = useState('')
  const [rError, setRError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [scanningOcr, setScanningOcr] = useState(false)
  const [ocrMsg, setOcrMsg] = useState('')
  const [showCameraModal, setShowCameraModal] = useState(false)

  // Feedback banner (glass-style, portal-rendered — success = green, info = maroon)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  // Discard-changes confirmation for the Attach Receipt form / Edit Project form
  const [confirmAction, setConfirmAction] = useState<'cancelReceipt' | 'cancelEdit' | null>(null)

  // Snapshot of the edit form's values right after opening — used to detect
  // whether the user actually changed anything before requesting a close.
  const [editSnapshot, setEditSnapshot] = useState({
    title: '', category: 'Education', budget: '', start: '', end: '', barangay: '', desc: '', status: '',
  })

  const handleCameraSnap = async () => {
    setShowCameraModal(false)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 800
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 600, 800)
        ctx.fillStyle = '#760031'
        ctx.font = 'bold 24px sans-serif'
        ctx.fillText('OFFICIAL RECEIPT', 190, 70)
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 18px monospace'
        ctx.fillText('SM SANTA ROSA HARDWARE', 170, 110)
        ctx.font = '15px monospace'
        ctx.fillText('Date: 2026-07-28', 50, 170)
        ctx.fillText('Receipt No: OR-88291', 50, 200)
        ctx.fillText('----------------------------------', 50, 230)
        ctx.fillText('Construction Materials  P 24,500.00', 50, 270)
        ctx.fillText('Logistics & Delivery     P  8,200.00', 50, 300)
        ctx.fillText('----------------------------------', 50, 330)
        ctx.font = 'bold 20px monospace'
        ctx.fillText('TOTAL AMOUNT: P 32,700.00', 50, 380)
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const snapFile = new File([blob], `camera-receipt-${Date.now()}.png`, { type: 'image/png' })
          setUploadedFile(snapFile)
          setOcrMsg('📸 Photo captured via Camera Viewfinder! Starting OCR auto-scan…')
          setTimeout(() => {
            runOcrScan(snapFile)
          }, 300)
        }
      }, 'image/png')
    } catch (err) {
      console.warn('Camera snap error:', err)
    }
  }

  const handleScanOcr = () => runOcrScan()

  const [localReceipts, setLocalReceipts] = useState<Receipt[]>([])
  const [detailProject, setDetailProject] = useState<ReportProject | null>(project)
  const [isLoadingProject, setIsLoadingProject] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [editTitle, setEditTitle] = useState(project?.title || '')
  const [editCategory, setEditCategory] = useState(project?.category || 'Education')
  const [editBudget, setEditBudget] = useState(String(project?.proposedBudget || ''))
  const [editStart, setEditStart] = useState(project?.startDate || '')
  const [editEnd, setEditEnd] = useState(project?.endDate || '')
  const [editDesc, setEditDesc] = useState(project?.description || '')
  const [editBarangay, setEditBarangay] = useState(project?.barangay || '')
  const [editStatus, setEditStatus] = useState<string>(project?.projectStatus || 'In Progress')
  const [pendingStatusConfirm, setPendingStatusConfirm] = useState<string | null>(null)

  // Comment form state
  const [cText, setCText] = useState('')
  const [cType, setCType] = useState<'comment' | 'suggestion'>('comment')
  const [cError, setCError] = useState('')
  const [localComments, setLocalComments] = useState<any[]>([])

  // Auto-dismiss feedback banner after 3 seconds
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

  useEffect(() => {
    const currentProject = project

    if (!currentProject?.id) {
      setDetailProject(null)
      return
    }

    const safeProject = currentProject
    let active = true
    setDetailProject(safeProject)
    setEditTitle(safeProject.title || '')
    setEditCategory(safeProject.category || 'Education')
    setEditBudget(String(safeProject.proposedBudget || ''))
    setEditStart(safeProject.startDate || '')
    setEditEnd(safeProject.endDate || '')
    setEditDesc(safeProject.description || '')
    setEditBarangay(safeProject.barangay || '')
    setEditStatus(safeProject.projectStatus || 'In Progress')
    setEditSnapshot({
      title: safeProject.title || '',
      category: safeProject.category || 'Education',
      budget: String(safeProject.proposedBudget || ''),
      start: safeProject.startDate || '',
      end: safeProject.endDate || '',
      barangay: safeProject.barangay || '',
      desc: safeProject.description || '',
      status: safeProject.projectStatus || 'In Progress',
    })
    setIsEditing(!!autoEditProject)
    setIsLoadingProject(true)
    setDetailError('')

    async function loadProjectDetails() {
      try {
        const res = await fetchProjectByIdApi(safeProject.id)
        if (!active) return
        const mapped = mapApiProjectToReportProject(res, safeProject.barangay)
        setDetailProject(mapped)
        setEditTitle(mapped.title || '')
        setEditCategory(mapped.category || 'Education')
        setEditBudget(String(mapped.proposedBudget || ''))
        setEditStart(mapped.startDate || '')
        setEditEnd(mapped.endDate || '')
        setEditDesc(mapped.description || '')
        setEditBarangay(mapped.barangay || '')
        setEditStatus(mapped.projectStatus || 'In Progress')
        setEditSnapshot({
          title: mapped.title || '',
          category: mapped.category || 'Education',
          budget: String(mapped.proposedBudget || ''),
          start: mapped.startDate || '',
          end: mapped.endDate || '',
          barangay: mapped.barangay || '',
          desc: mapped.description || '',
          status: mapped.projectStatus || 'In Progress',
        })
      } catch (err: any) {
        if (!active) return
        setDetailError(err.message || 'Unable to load project details.')
      } finally {
        if (active) setIsLoadingProject(false)
      }
    }

    async function loadProjectReceipts() {
      try {
        const pId = Number(safeProject.id || (safeProject as any).projectId)
        if (!isNaN(pId) && pId > 0) {
          const orders = await fetchPurchaseOrdersApi(pId)
          if (Array.isArray(orders)) {
            const mapped = orders.map((o: any) => ({
              id: String(o.orderID || o.id),
              projectId: String(o.projectID),
              vendor: o.orderName || o.supplierName || 'Unknown Vendor',
              amount: Number(o.orderTotalPrice ?? o.orderPrice ?? 0),
              date: o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '',
              status: (o.isApproved ? 'verified' : 'pending') as 'verified' | 'pending' | 'rejected',
              ocrExtracted: !!o.isOCRScanned,
              imageUrl: o.receiptImageURL ? resolveImageUrl(o.receiptImageURL) : undefined,
              description: o.orderItemsDescription || '',
            }))
            if (active) setLocalReceipts(mapped)
          }
        }
      } catch (err) {
        console.warn('API fetch receipts warning:', err)
      }
    }

    async function loadProjectComments() {
      try {
        const pId = Number(project?.id)
        if (!isNaN(pId)) {
          const res = await fetchCommentsApi(pId)
          if (Array.isArray(res)) {
            setLocalComments(res.map((c: any) => ({
              id: String(c.commentID || c.id),
              author: c.authorName || 'Citizen',
              text: c.commentDetails,
              type: c.commentType || 'comment',
              upvotes: c.upvotes || 0,
              date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Just now',
            })))
          }
        }
      } catch (err) {
        console.warn('API fetch project comments warning:', err)
      }
    }
    loadProjectDetails()
    loadProjectReceipts()
    loadProjectComments()
    return () => {
      active = false
    }
  }, [project?.id])

  const activeProject = detailProject ?? project
  if (!activeProject) return null

  const canManageReceipts =
    user?.role === 'sk' &&
    (user.skPosition === 'Treasurer' || user.skPosition === 'Chairperson') &&
    user.barangay === activeProject.barangay

  const spentPct = Math.min(Math.round((activeProject.spent / activeProject.proposedBudget) * 100), 100)
  const canEditProject =
    (user?.role === 'sk' || user?.role === 'superadmin') &&
    (user?.skPosition === 'Chairperson' || user?.skPosition === 'Secretary' || user?.role === 'superadmin') &&
    (user?.barangay === activeProject.barangay || user?.role === 'superadmin')

  // Real Tesseract.js OCR scan of uploaded receipt image
  const runOcrScan = async (targetFile?: File) => {
    const file = targetFile || uploadedFile
    if (!file) return
    setScanningOcr(true)
    setOcrMsg('🔍 Initialising Tesseract OCR engine…')

    try {
      setOcrMsg('📄 Reading receipt image with Tesseract OCR…')
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress ?? 0) * 100)
            setOcrMsg(`📄 Scanning receipt… ${pct}%`)
          }
        },
      })

      const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean)

      // ── Amount: find ₱, PHP, TOTAL, AMOUNT patterns ────────────────────
      let extractedAmount = ''
      const amountPatterns = [
        /(?:total|amount|grand\s*total|subtotal|total\s*due)[\s:=₱PHP]*([\d,]+(?:\.\d{1,2})?)/i,
        /₱\s*([\d,]+(?:\.\d{1,2})?)/i,
        /PHP\s*([\d,]+(?:\.\d{1,2})?)/i,
        /([\d,]{3,}(?:\.\d{1,2})?)\s*(?:php|pesos?)/i,
      ]
      for (const pat of amountPatterns) {
        const m = text.match(pat)
        if (m) { extractedAmount = m[1].replace(/,/g, ''); break }
      }

      // ── Date: support MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY, month names ──
      let extractedDate = ''
      const datePatterns = [
        /(\d{4}[-/]\d{2}[-/]\d{2})/,
        /(\d{2}[-/]\d{2}[-/]\d{4})/,
        /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
        /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}/i,
        /\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}/i,
      ]
      for (const pat of datePatterns) {
        const m = text.match(pat)
        if (m) {
          const parsed = new Date(m[0])
          if (!isNaN(parsed.getTime())) {
            extractedDate = parsed.toISOString().slice(0, 10)
          } else {
            // Try rearranging DD/MM/YYYY → YYYY-MM-DD
            const parts = m[0].split(/[-/]/)
            if (parts.length === 3) {
              const attempt = parts[2].length === 4
                ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
                : m[0]
              const p2 = new Date(attempt)
              if (!isNaN(p2.getTime())) extractedDate = p2.toISOString().slice(0, 10)
            }
          }
          if (extractedDate) break
        }
      }

      // ── Vendor: first non-empty, non-numeric line (usually store name) ──
      let extractedVendor = ''
      const skipPrefixes = /^(date|receipt|invoice|official|no\.|#|total|amount|php|₱|\d)/i
      for (const line of lines) {
        if (line.length > 3 && !skipPrefixes.test(line) && /[a-zA-Z]/.test(line)) {
          extractedVendor = line.replace(/[^\w\s&.,'-]/g, '').trim()
          if (extractedVendor.length > 2) break
        }
      }
      // Also check for "sold to", "merchant", "cashier", "store" keywords
      const vendorKeywordMatch = text.match(/(?:merchant|store name|sold to|vendor)[:\s]+([^\n]+)/i)
      if (vendorKeywordMatch) extractedVendor = vendorKeywordMatch[1].trim()

      // ── Description: line after "purpose", "particulars", "item" ────────
      let extractedDesc = ''
      const descKeywordMatch = text.match(/(?:purpose|particulars?|description|items?)[:\s]+([^\n]+)/i)
      if (descKeywordMatch) {
        extractedDesc = descKeywordMatch[1].trim()
      } else {
        // Fallback: second content line that's not the vendor
        const candidates = lines.filter((l: string) => l !== extractedVendor && l.length > 5 && /[a-zA-Z]/.test(l))
        if (candidates[1]) extractedDesc = candidates[1].substring(0, 80)
      }

      // ── Apply extracted values to form ─────────────────────────────────
      if (extractedVendor) setRVendor(extractedVendor)
      if (extractedAmount) setRAmount(extractedAmount)
      if (extractedDate)   setRDate(extractedDate)
      if (extractedDesc)   setRDesc(extractedDesc)

      const found: string[] = []
      if (extractedVendor) found.push(`Vendor: "${extractedVendor}"`)
      if (extractedAmount) found.push(`Amount: ₱${Number(extractedAmount).toLocaleString()}`)
      if (extractedDate)   found.push(`Date: ${extractedDate}`)
      if (extractedDesc)   found.push(`Description: "${extractedDesc}"`)

      if (found.length > 0) {
        setOcrMsg(`✅ OCR Complete! Extracted — ${found.join(' · ')}. Please review and correct if needed.`)
      } else {
        setOcrMsg('⚠️ OCR finished but could not extract data clearly. Please fill the fields manually.')
      }
    } catch (err: any) {
      setOcrMsg(`❌ OCR failed: ${err.message || 'Unknown error'}. Please fill fields manually.`)
    } finally {
      setScanningOcr(false)
    }
  }

  const handleSaveProject = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeProject) return

    // ─ Validation ─────────────────────────────────────────────────────────
    if (!editTitle.trim() || editTitle.trim().length < 3) {
      setDetailError('Project title must be at least 3 characters.')
      return
    }
    if (!editBudget || Number(editBudget) <= 0) {
      setDetailError('Budget must be a positive number.')
      return
    }
    if (editStart && editEnd && new Date(editEnd) <= new Date(editStart)) {
      setDetailError('End date must be after the start date.')
      return
    }
    // ─────────────────────────────────────────────────────────────────────

    setIsSavingProject(true)
    setDetailError('')
    try {
      const payload = {
        projectName: editTitle.trim() || undefined,
        projectDescription: editDesc.trim() || undefined,
        projectStartTime: editStart ? new Date(editStart).toISOString() : undefined,
        projectEndTime: editEnd ? new Date(editEnd).toISOString() : undefined,
        projectLocation: editBarangay.trim() || undefined,
        projectBudget: Number(editBudget) || undefined,
        projectCategory: editCategory || undefined,
        projectStatus: editStatus || undefined,
      }
      const res = await updateProjectApi(activeProject.projectId ?? activeProject.id, payload)
      const updated = mapApiProjectToReportProject(res, activeProject.barangay)
      setDetailProject(updated)
      setIsEditing(false)
      onProjectUpdated?.(updated)
      setFeedback({ type: 'success', message: 'Project updated successfully' })
    } catch (err: any) {
      setDetailError(err.message || 'Unable to update project information.')
    } finally {
      setIsSavingProject(false)
    }
  }

  const resetReceiptForm = () => {
    setRVendor(''); setRAmount(''); setRDate(''); setRDesc('')
    setRError(''); setUploadedFile(null); setOcrMsg('')
  }

  const isReceiptFormDirty = () =>
    !!rVendor.trim() || !!rAmount.trim() || !!rDate || !!rDesc.trim() || !!uploadedFile

  const isEditFormDirty = () =>
    editTitle !== editSnapshot.title ||
    editCategory !== editSnapshot.category ||
    editBudget !== editSnapshot.budget ||
    editStart !== editSnapshot.start ||
    editEnd !== editSnapshot.end ||
    editBarangay !== editSnapshot.barangay ||
    editDesc !== editSnapshot.desc ||
    editStatus !== editSnapshot.status

  const editHasChanges = isEditing && isEditFormDirty()

  const requestCloseEditForm = () => {
    if (isEditFormDirty()) {
      setConfirmAction('cancelEdit')
    } else {
      setIsEditing(false)
    }
  }

  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false)

  const handleAddReceipt = async (e: FormEvent) => {
    e.preventDefault()
    if (!rVendor.trim() || !rAmount || !rDate) { setRError('Fill in all required fields.'); return }
    const amt = parseFloat(rAmount.replace(/,/g, ''))
    if (isNaN(amt) || amt <= 0) { setRError('Enter a valid amount.'); return }
    setRError('')
    setIsSubmittingReceipt(true)

    const pId = Number(activeProject.id || (activeProject as any).projectId || (activeProject as any).projectID)

    let createdOrder: any = null
    try {
      if (!isNaN(pId) && pId > 0) {
        createdOrder = await createPurchaseOrderApi({
          projectID: pId,
          orderName: rVendor.trim(),
          orderType: 'Physical',
          orderQty: 1,
          orderPrice: amt,
          supplierName: rVendor.trim(),
          orderAmount: amt,
        })
      }

      // Upload image to backend if provided; fall back to data URL if upload fails
      let imageUrl: string | undefined
      if (uploadedFile && createdOrder?.orderID) {
        try {
          const uploadResult = await uploadReceiptImageApi(createdOrder.orderID, uploadedFile)
          if (uploadResult.receiptImageURL) {
            imageUrl = resolveImageUrl(uploadResult.receiptImageURL)
          }
        } catch {
          // Non-fatal — receipt is still saved, just no image on reload
          console.warn('Receipt image upload failed; image will not persist on reload')
        }
      }

      const newR: Receipt = {
        id: createdOrder?.orderID || `R-${Date.now()}`,
        projectId: activeProject.id,
        projectTitle: activeProject.title,
        barangay: activeProject.barangay,
        vendor: rVendor.trim(),
        amount: amt,
        date: rDate,
        status: 'verified' as const,
        ocrExtracted: !!uploadedFile || !!ocrMsg,
        description: rDesc.trim(),
        imageUrl,
      } as Receipt

      setLocalReceipts(prev => [newR, ...prev])

      const updatedSpent = activeProject.spent + amt
      const updatedRemaining = Math.max(0, activeProject.proposedBudget - updatedSpent)
      const updatedProject: ReportProject = {
        ...activeProject,
        spent: updatedSpent,
        remainingBudget: updatedRemaining,
        projectBreakdown: updatedSpent,
      }

      setDetailProject(updatedProject)
      onProjectUpdated?.(updatedProject)
      onAddReceipt?.(activeProject.id, newR)

      resetReceiptForm()
      setShowReceiptForm(false)
      setFeedback({ type: 'success', message: `Receipt of ₱${amt.toLocaleString()} attached & applied immediately!` })
    } catch (err: any) {
      setRError(err.message || 'Failed to attach receipt')
    } finally {
      setIsSubmittingReceipt(false)
    }
  }

  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!cText.trim()) { setCError('Please write your comment or suggestion.'); return }
    const pId = Number(activeProject.id || (activeProject as any).projectId || (activeProject as any).projectID)
    setIsSubmittingComment(true)
    setCError('')

    try {
      if (!isNaN(pId) && pId > 0) {
        const created = await postCommentApi({
          commentFor: pId,
          commentDetails: cText.trim(),
          commentType: cType,
        })
        const newC = {
          id: String(created?.commentID || Date.now()),
          author: created?.commentName || user?.name || 'Citizen',
          text: created?.commentDetails || cText.trim(),
          type: created?.commentType || cType,
          upvotes: created?.votesCount || 0,
          date: created?.commentTimestamp ? new Date(created.commentTimestamp).toLocaleDateString() : 'Just now',
        }
        setLocalComments(prev => [newC, ...prev])
        setFeedback({ type: 'success', message: 'Comment submitted successfully' })
      } else {
        const newC = {
          id: `C-${Date.now()}`,
          author: user?.name?.split(' ')[0] ?? 'Citizen',
          text: cText.trim(),
          type: cType,
          upvotes: 0,
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        }
        setLocalComments(prev => [newC, ...prev])
      }
      setCText('')
    } catch (err: any) {
      setCError(err.message || 'Failed to submit comment')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <>
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

      <Portal>
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
          <div className="modal project-modal">

            {/* ── Cover ── */}
            <div className="project-modal-cover">
              <img
                src={getCoverImg(activeProject.category)}
                alt={activeProject.category}
                className="project-modal-cover-img"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div className="project-modal-cover-overlay">
                <span className={`badge badge-${activeProject.status}`}>{activeProject.status}</span>
                <h2 className="project-modal-title">{activeProject.title}</h2>
                <div className="project-modal-meta-row">
                  <span>{activeProject.barangay}</span>
                  <span>·</span>
                  <span>{activeProject.category}</span>
                  <span>·</span>
                  <span>{activeProject.startDate} → {activeProject.endDate}</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
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
                  {detailError && <div className="alert-error" style={{ marginBottom: '1rem' }}>{detailError}</div>}
                  {isLoadingProject && <div className="alert-info" style={{ marginBottom: '1rem' }}>Loading project details…</div>}

                  <div className="project-modal-stats">
                    <div className="project-modal-stat-item">
                      <div className="project-modal-stat-val" style={{ color: 'var(--maroon)' }}>{activeProject.progress}%</div>
                      <div className="project-modal-stat-label">Completion</div>
                    </div>
                    <div className="project-modal-stat-item">
                      <div className="project-modal-stat-val">₱{(activeProject.proposedBudget / 1000).toFixed(0)}K</div>
                      <div className="project-modal-stat-label">Proposed Budget</div>
                    </div>
                    <div className="project-modal-stat-item">
                      <div className="project-modal-stat-val" style={{ color: '#b45309' }}>₱{(activeProject.spent / 1000).toFixed(0)}K</div>
                      <div className="project-modal-stat-label">Disbursed</div>
                    </div>
                    <div className="project-modal-stat-item">
                      <div className="project-modal-stat-val" style={{ color: '#166534' }}>₱{((activeProject.proposedBudget - activeProject.spent) / 1000).toFixed(0)}K</div>
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
                      <span>₱{activeProject.spent.toLocaleString()} spent</span>
                      <span>of ₱{activeProject.proposedBudget.toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <div className="page-kicker" style={{ marginBottom: '0.5rem' }}>Description</div>
                    {isEditing ? (
                      <form onSubmit={handleSaveProject}>
                        <div className="form-group">
                          <label className="form-label">Project Title</label>
                          <input className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                        </div>
                        <div className="form-row-2">
                          <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                              className="form-input"
                              value={editCategory}
                              onChange={e => setEditCategory(e.target.value)}
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
                            <label className="form-label">Budget (₱)</label>
                            <input className="form-input" type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)} />
                          </div>
                        </div>
                        <div className="form-row-2">
                          <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input className="form-input" type="date" value={editStart} onChange={e => setEditStart(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input className="form-input" type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Barangay</label>
                          <input className="form-input" value={editBarangay} onChange={e => setEditBarangay(e.target.value)} />
                        </div>
                        {/* ── Status Progression (3 horizontally aligned buttons) ── */}
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
                              const currentLevel = getStatusLevel(editSnapshot.status || activeProject?.projectStatus || activeProject?.status)
                              const isCurrent = editStatus === st.key
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
                        <div className="form-group">
                          <label className="form-label">Description</label>
                          <textarea className="form-input" rows={4} value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem' }}>
                          {!editHasChanges && (
                            <span style={{
                              fontSize: '0.78rem',
                              color: 'var(--maroon)',
                              fontFamily: 'var(--font-display)',
                              fontWeight: 600,
                              marginRight: 'auto',
                            }}>
                              Edit a field to enable saving
                            </span>
                          )}
                          {editHasChanges && (
                            <button type="submit" className="btn btn-primary btn-sm" disabled={isSavingProject}>
                              {isSavingProject ? 'Saving…' : 'Save Changes'}
                            </button>
                          )}
                          <button type="button" className="btn btn-secondary btn-sm" onClick={requestCloseEditForm}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--ink)' }}>{activeProject.description}</p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setTab('finance')}>
                      View Finance Records
                    </button>
                    {canEditProject && !isEditing && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditTitle(activeProject.title || '')
                          setEditCategory(activeProject.category || 'Education')
                          setEditBudget(String(activeProject.proposedBudget || ''))
                          setEditStart(activeProject.startDate || '')
                          setEditEnd(activeProject.endDate || '')
                          setEditDesc(activeProject.description || '')
                          setEditBarangay(activeProject.barangay || '')
                          setEditStatus(activeProject.projectStatus || 'In Progress')
                          setEditSnapshot({
                            title: activeProject.title || '',
                            category: activeProject.category || 'Education',
                            budget: String(activeProject.proposedBudget || ''),
                            start: activeProject.startDate || '',
                            end: activeProject.endDate || '',
                            barangay: activeProject.barangay || '',
                            desc: activeProject.description || '',
                            status: activeProject.projectStatus || 'In Progress',
                          })
                          setIsEditing(true)
                        }}
                      >
                        Edit Project
                      </button>
                    )}
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
                        {activeProject.proposedBudget > 0 && localReceipts.reduce((s, r) => s + r.amount, 0) > activeProject.proposedBudget && (
                          <span style={{ marginLeft: '0.6rem', fontSize: '0.78rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                            ⚠️ OVER BUDGET (+₱{(localReceipts.reduce((s, r) => s + r.amount, 0) - activeProject.proposedBudget).toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>
                    {canManageReceipts && (
                      !['ongoing', 'in progress'].includes(String(activeProject.projectStatus || activeProject.status || '').toLowerCase()) ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled
                          style={{ opacity: 0.7, cursor: 'not-allowed', background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }}
                          title="Receipt attachment locked — project must be Ongoing / In Progress"
                        >
                          🔒 Receipts Locked (Only allowed when project is Ongoing)
                        </button>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowReceiptForm(v => !v)}>
                          + Attach Receipt
                        </button>
                      )
                    )}
                  </div>

                  {/* Add receipt form with Upload & OCR */}
                  {showReceiptForm && canManageReceipts && ['ongoing', 'in progress'].includes(String(activeProject.projectStatus || activeProject.status || '').toLowerCase()) && (
                    <form onSubmit={handleAddReceipt} className="receipt-form" style={{ marginBottom: '1.5rem' }}>
                      <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>Attach New Receipt Document</div>

                      {rError && <div className="alert-error">{rError}</div>}
                      {ocrMsg && <div className="alert-info" style={{ marginBottom: '0.75rem' }}>{ocrMsg}</div>}

                      {/* Over-Budget Real-Time Warning Banner */}
                      {(() => {
                        const currentSpent = localReceipts.reduce((s, r) => s + r.amount, 0)
                        const budget = activeProject.proposedBudget || 0
                        const typedVal = Number(rAmount || 0)
                        const projectedSpent = currentSpent + typedVal
                        if (budget > 0 && typedVal > 0 && projectedSpent > budget) {
                          return (
                            <div style={{ background: '#fef2f2', border: '1.5px solid #ef4444', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.85rem', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.84rem' }}>
                              ⚠️ OVER BUDGET WARNING: Adding this ₱{typedVal.toLocaleString()} receipt will bring total spending to ₱{projectedSpent.toLocaleString()}, which exceeds the proposed budget of ₱{budget.toLocaleString()} by ₱{(projectedSpent - budget).toLocaleString()}!
                            </div>
                          )
                        }
                        if (budget > 0 && typedVal > 0 && projectedSpent >= budget * 0.9) {
                          return (
                            <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b', color: '#92400e', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.85rem', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.84rem' }}>
                              ⚠️ CAUTION: Total project spending will reach ₱{projectedSpent.toLocaleString()} ({Math.round((projectedSpent / budget) * 100)}% of proposed budget). Nearing budget limit.
                            </div>
                          )
                        }
                        return null
                      })()}

                      {/* Upload Zone & OCR Trigger */}
                      <div style={{ marginBottom: '1rem', border: '1.5px dashed var(--maroon)', padding: '1rem', textAlign: 'center', background: 'rgba(118,0,49,0.02)', borderRadius: '8px' }}>
                        {uploadedFile ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left' }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                              <div>
                                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem' }}>{uploadedFile.name}</div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>{(uploadedFile.size / 1024).toFixed(1)} KB · File Attached</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button type="button" className="btn btn-gold btn-sm" onClick={handleScanOcr} disabled={scanningOcr}>
                                {scanningOcr ? '🔍 Scanning…' : '⚡ Auto-Scan with OCR'}
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
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2" style={{ marginBottom: '0.3rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--maroon)' }}>
                                Click to Upload Receipt File or Drag &amp; Drop
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                                Upload JPG, PNG, or PDF receipts (Max 10MB)
                              </div>
                            </label>
                            <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 700 }}>— OR —</div>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                              <label className="btn btn-gold btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                                🖼️ Select Image File
                                <input
                                  type="file"
                                  accept=".png,.jpg,.jpeg,.pdf"
                                  style={{ display: 'none' }}
                                  onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                      setUploadedFile(e.target.files[0])
                                    }
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                className="btn btn-gold btn-sm"
                                onClick={() => setShowCameraModal(true)}
                                style={{ margin: 0, fontWeight: 700 }}
                              >
                                📷 Open OCR Camera Scanner
                              </button>
                            </div>
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
                        <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmittingReceipt}>
                          {isSubmittingReceipt ? 'Attaching & Applying…' : 'Save & Attach Receipt'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            if (isReceiptFormDirty()) {
                              setConfirmAction('cancelReceipt')
                            } else {
                              resetReceiptForm()
                              setShowReceiptForm(false)
                            }
                          }}
                        >
                          Cancel
                        </button>
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
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
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
                      <div className="page-kicker" style={{ marginBottom: '0.65rem' }}>Share Your Thoughts</div>
                      {cError && <div className="alert-error" style={{ marginBottom: '0.5rem' }}>{cError}</div>}
                      <textarea
                        className="form-input"
                        rows={3}
                        value={cText}
                        onChange={e => setCText(e.target.value)}
                        placeholder="Share your thoughts on this project…"
                        style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }}
                      />
                      <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '0.65rem' }} disabled={isSubmittingComment}>
                        {isSubmittingComment ? 'Submitting…' : 'Submit'}
                      </button>
                    </form>
                  )}

                  {/* Visitor Call-to-Action banner when not logged in */}
                  {!user && (
                    <div style={{ marginBottom: '1.2rem', padding: '1.1rem 1.3rem', background: 'rgba(118,0,49,0.04)', border: '1.5px solid rgba(118,0,49,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)' }}>
                          Want to share your feedback or suggestions with Barangay {activeProject.barangay} SK?
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
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
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
        </div>
      </Portal>

      {/* ── Receipt Image Lightbox Modal ── */}
      {viewingReceipt && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 20000 }} onClick={() => setViewingReceipt(null)}>
            <div className="modal" style={{ width: 'min(560px, 92vw)', padding: '1.25rem', position: 'relative', zIndex: 20001, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Uploaded Image — shown when available */}
              {viewingReceipt.imageUrl ? (
                <div style={{ marginBottom: '1rem' }}>
                  <img
                    src={viewingReceipt.imageUrl}
                    alt={`Receipt from ${viewingReceipt.vendor}`}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      border: '1.5px solid rgba(118,0,49,0.15)',
                      boxShadow: '0 4px 18px rgba(0,0,0,0.10)',
                      display: 'block',
                      objectFit: 'contain',
                      maxHeight: '55vh',
                      background: '#f9f7f4',
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.4rem' }}>
                    Uploaded receipt image
                  </div>
                </div>
              ) : (
                /* Fallback mock receipt card when no image was uploaded */
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
                    <div style={{ fontWeight: 900, fontSize: '0.92rem', color: 'var(--maroon)', marginTop: '0.15rem' }}>BARANGAY {activeProject.barangay.toUpperCase()} SANGGUNIANG KABATAAN</div>
                    <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '0.15rem' }}>OFFICIAL DISBURSEMENT RECEIPT · O.R. #OR-2025-0{Math.abs(viewingReceipt.id.charCodeAt(0)) % 9000 + 1000}</div>
                  </div>

                  <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.78rem', marginBottom: '0.85rem' }}>
                    <div><strong>PAYEE / VENDOR:</strong> {viewingReceipt.vendor}</div>
                    <div><strong>DATE FILED:</strong> {viewingReceipt.date}</div>
                    <div><strong>PROJECT:</strong> {viewingReceipt.projectTitle || activeProject.title}</div>
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
              )}

              {/* Receipt metadata summary (always shown) */}
              <div style={{
                background: 'rgba(118,0,49,0.04)',
                border: '1px solid rgba(118,0,49,0.12)',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                fontSize: '0.78rem',
                display: 'grid',
                gap: '0.25rem',
                marginBottom: '1rem',
              }}>
                <div><strong>Vendor / Payee:</strong> {viewingReceipt.vendor}</div>
                <div><strong>Amount:</strong> ₱{viewingReceipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div><strong>Date:</strong> {viewingReceipt.date}</div>
                {viewingReceipt.description && <div><strong>Description:</strong> {viewingReceipt.description}</div>}
                {viewingReceipt.ocrExtracted && (
                  <div style={{ color: '#166534', fontWeight: 700, marginTop: '0.15rem' }}>✓ OCR Extracted</div>
                )}
              </div>

              <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setViewingReceipt(null)}>
                Done Viewing
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* ── Discard Changes Confirmation (Attach Receipt form) ── */}
      {/* ── Discard Changes Confirmation (Attach Receipt form) ── */}
      <ConfirmDialog
        isOpen={confirmAction === 'cancelReceipt'}
        title="Discard Changes"
        message="Any unsaved receipt details will be lost. Are you sure you want to close this form?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        variant="danger"
        onConfirm={() => {
          resetReceiptForm()
          setShowReceiptForm(false)
          setConfirmAction(null)
          setFeedback({ type: 'info', message: 'Changes discarded' })
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* ── Discard Changes Confirmation (Edit Project form) ── */}
      <ConfirmDialog
        isOpen={confirmAction === 'cancelEdit'}
        title="Discard Changes"
        message="Any unsaved project changes will be lost. Are you sure you want to close this form?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        variant="danger"
        onConfirm={() => {
          setIsEditing(false)
          setConfirmAction(null)
          setFeedback({ type: 'info', message: 'Changes discarded' })
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* ── Status Progression Confirmation ── */}
      <ConfirmDialog
        isOpen={!!pendingStatusConfirm}
        title="Confirm Project Status Change"
        message={`Are you sure you want to advance the project status of "${activeProject?.title}" to "${pendingStatusConfirm}"? Once advanced, status progression cannot be reversed.`}
        confirmLabel="Yes, Advance Status"
        cancelLabel="Cancel"
        danger={false}
        onConfirm={() => {
          if (pendingStatusConfirm) {
            setEditStatus(pendingStatusConfirm)
          }
          setPendingStatusConfirm(null)
        }}
        onCancel={() => setPendingStatusConfirm(null)}
      />
    </>
  )
}
