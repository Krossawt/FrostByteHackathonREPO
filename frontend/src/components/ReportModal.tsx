import React, { useState, useEffect } from 'react'
import Portal from './Portal'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const PAGE_WIDTH_PX = 794
const PAGE_HEIGHT_PX = 1123

export interface ReportProjectItem {
  id: string | number
  title: string
  barangay?: string
  category?: string
  status?: string
  proposedBudget?: number
  spent?: number
}

export interface ReportBarangayItem {
  barangay: string
  projects: number
  annualBudget: number
  spent: number
}

export interface ReportSummaryData {
  annualBudget?: number
  totalBudget?: number
  spent?: number
  totalSpent?: number
  remaining?: number
  displayBudget?: number
  displaySpent?: number
  displayProj?: number
  displayUsage?: number
  usagePct?: number
}

export interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  barangayName?: string
  selectedBarangay?: string | null
  summary: ReportSummaryData
  barangayList?: ReportBarangayItem[]
  projects: ReportProjectItem[]
}

function formatPeso(amount: number) {
  return `₱${Math.round(amount || 0).toLocaleString('en-PH')}`
}

export default function ReportModal({
  isOpen,
  onClose,
  barangayName,
  selectedBarangay,
  summary,
  barangayList = [],
  projects = [],
}: ReportModalProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!isOpen) return

    const updateScale = () => {
      const viewportWidth = window.innerWidth
      const padding = 24 // 12px padding on each side
      const availableWidth = Math.max(260, viewportWidth - padding)
      const newScale = Math.min(1, availableWidth / PAGE_WIDTH_PX)
      setScale(newScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    window.addEventListener('orientationchange', updateScale)
    return () => {
      window.removeEventListener('resize', updateScale)
      window.removeEventListener('orientationchange', updateScale)
    }
  }, [isOpen])

  if (!isOpen) return null

  const reportGeneratedAt = new Date().toLocaleString('en-PH', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const isCitywide = !barangayName && !selectedBarangay
  const activeBarangay = barangayName || selectedBarangay

  const budget = summary.displayBudget ?? summary.totalBudget ?? summary.annualBudget ?? 0
  const spent = summary.displaySpent ?? summary.totalSpent ?? summary.spent ?? 0
  const remaining = Math.max(0, budget - spent)
  const usagePct =
    summary.displayUsage ??
    summary.usagePct ??
    (budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0)

  // Items per page configuration
  const BARANGAYS_PER_PAGE_1 = 9
  const PROJECTS_PER_PAGE_2_WITH_BG = 8
  const PROJECTS_PER_PAGE_SINGLE_1 = 9
  const PROJECTS_PER_PAGE_SUBSEQUENT = 12

  const pageChunks: Array<{
    pageNum: number
    showTopSummary?: boolean
    barangays?: ReportBarangayItem[]
    barangayTitle?: string
    projects?: ReportProjectItem[]
    projectTitle?: string
  }> = []

  if (isCitywide) {
    const bPage1 = barangayList.slice(0, BARANGAYS_PER_PAGE_1)
    const bPage2 = barangayList.slice(BARANGAYS_PER_PAGE_1)

    const pPage2 = projects.slice(0, PROJECTS_PER_PAGE_2_WITH_BG)
    const remainingProjects = projects.slice(PROJECTS_PER_PAGE_2_WITH_BG)

    // Page 1
    pageChunks.push({
      pageNum: 1,
      showTopSummary: true,
      barangays: bPage1,
      barangayTitle: `Barangay Breakdown (${barangayList.length})`,
    })

    // Page 2
    if (bPage2.length > 0 || projects.length > 0) {
      pageChunks.push({
        pageNum: 2,
        showTopSummary: false,
        barangays: bPage2.length > 0 ? bPage2 : undefined,
        barangayTitle: bPage2.length > 0 ? `Barangay Breakdown (Continued)` : undefined,
        projects: pPage2.length > 0 ? pPage2 : undefined,
        projectTitle: pPage2.length > 0 ? `Project List (${projects.length})` : undefined,
      })
    }

    // Page 3+
    let pOffset = PROJECTS_PER_PAGE_2_WITH_BG
    while (pOffset < projects.length) {
      const chunk = projects.slice(pOffset, pOffset + PROJECTS_PER_PAGE_SUBSEQUENT)
      pOffset += PROJECTS_PER_PAGE_SUBSEQUENT
      pageChunks.push({
        pageNum: pageChunks.length + 1,
        showTopSummary: false,
        projects: chunk,
        projectTitle: `Project List (Continued)`,
      })
    }
  } else {
    // Single barangay view
    const pPage1 = projects.slice(0, PROJECTS_PER_PAGE_SINGLE_1)

    // Page 1
    pageChunks.push({
      pageNum: 1,
      showTopSummary: true,
      projects: pPage1,
      projectTitle: `Project List (${projects.length})`,
    })

    // Page 2+
    let pOffset = PROJECTS_PER_PAGE_SINGLE_1
    while (pOffset < projects.length) {
      const chunk = projects.slice(pOffset, pOffset + PROJECTS_PER_PAGE_SUBSEQUENT)
      pOffset += PROJECTS_PER_PAGE_SUBSEQUENT
      pageChunks.push({
        pageNum: pageChunks.length + 1,
        showTopSummary: false,
        projects: chunk,
        projectTitle: `Project List (Continued)`,
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPdf(true)
      const pageElements = document.querySelectorAll('.sk-report-page-sheet')
      if (!pageElements.length) return

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      for (let i = 0; i < pageElements.length; i++) {
        if (i > 0) pdf.addPage('a4', 'portrait')
        const el = pageElements[i] as HTMLElement

        const canvas = await html2canvas(el, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1280,
          windowHeight: 1800,
          onclone: (clonedDoc) => {
            const clonedSheets = clonedDoc.querySelectorAll('.sk-report-page-sheet')
            clonedSheets.forEach((sheet) => {
              const s = sheet as HTMLElement
              s.style.width = '794px'
              s.style.height = '1123px'
              s.style.padding = '16mm 15mm'
              s.style.transform = 'none'
              s.style.position = 'static'
              s.style.boxSizing = 'border-box'
              s.style.margin = '0 auto'
            })

            const clonedStages = clonedDoc.querySelectorAll('.sk-report-page-viewport-stage')
            clonedStages.forEach((stage) => {
              const st = stage as HTMLElement
              st.style.width = '794px'
              st.style.height = '1123px'
              st.style.transform = 'none'
              st.style.marginBottom = '24px'
            })
          },
        })

        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST')
      }

      const fileBarangay = activeBarangay || 'SantaRosaCity'
      pdf.save(`SK-Report-${fileBarangay.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error('PDF export error:', err)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <Portal>
      <div
        className="report-modal-portal-root"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {/* Toolbar */}
        <div className="no-print report-toolbar">
          <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
            Report Preview — {activeBarangay ? `Barangay ${activeBarangay}` : 'Santa Rosa City · All Barangays'} ({pageChunks.length} {pageChunks.length === 1 ? 'Page' : 'Pages'})
          </div>
          <div className="report-toolbar-actions">
            <button
              className="btn btn-sm report-download-btn report-toolbar-btn"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download (Save as PDF)'}</span>
            </button>
            <button
              className="btn btn-sm report-print-btn report-toolbar-btn"
              onClick={handlePrint}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
              <span>Print</span>
            </button>
            <button className="btn btn-sm report-close-btn report-toolbar-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Paginated A4 Page Sheets */}
        {pageChunks.map((chunk, idx) => (
          <React.Fragment key={chunk.pageNum}>
            {pageChunks.length > 1 && (
              <div
                className="no-print report-page-indicator"
                style={{
                  width: `${PAGE_WIDTH_PX * scale}px`,
                  textAlign: 'right',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.75)',
                  marginBottom: '6px',
                }}
              >
                Page {chunk.pageNum} of {pageChunks.length}
              </div>
            )}

            <div
              className="sk-report-page-viewport-stage"
              style={{
                width: `${PAGE_WIDTH_PX * scale}px`,
                height: `${PAGE_HEIGHT_PX * scale}px`,
                position: 'relative',
                marginBottom: '1.5rem',
              }}
            >
              <div
                className="sk-report-page-sheet"
                id={idx === 0 ? 'sk-report-printable' : undefined}
                style={{
                  width: `${PAGE_WIDTH_PX}px`,
                  height: `${PAGE_HEIGHT_PX}px`,
                  transform: scale < 1 ? `scale(${scale})` : 'none',
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  background: '#ffffff',
                  padding: '16mm 15mm',
                  boxShadow: '0 24px 70px rgba(0,0,0,0.4)',
                  color: '#1a1a1a',
                  fontFamily: 'var(--font-body)',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                }}
              >
                <div>
                  {/* Letterhead Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderBottom: '4px solid #760031',
                      paddingBottom: '16px',
                      marginBottom: '22px',
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', color: '#760031', letterSpacing: '-0.02em' }}>
                        eSKala
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>
                        Sangguniang Kabataan Management System · Santa Rosa City, Laguna
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: '#111' }}>
                        {isCitywide ? 'SK Executive Budget & Project Report' : 'SK Project & Budget Report'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>
                        Generated: {reportGeneratedAt}
                      </div>
                    </div>
                  </div>

                  {/* Page 1 Summary Content */}
                  {chunk.showTopSummary && (
                    <>
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '19px', color: '#111' }}>
                          {activeBarangay ? `Barangay ${activeBarangay}` : 'Santa Rosa City — All 18 Barangays'}
                        </div>
                      </div>

                      <div style={{ marginBottom: '22px', fontSize: '11.5px', lineHeight: 1.85, color: '#333' }}>
                        {isCitywide ? (
                          <>
                            This report presents the citywide financial standing and project portfolio of the
                            Sangguniang Kabataan across all 18 barangays of Santa Rosa City. As of {reportGeneratedAt},
                            the city has utilized <strong>{usagePct}%</strong> of the combined annual budget of{' '}
                            <strong>{formatPeso(budget)}</strong> across <strong>{projects.length}</strong> recorded projects,
                            with <strong>{formatPeso(remaining)}</strong> remaining available citywide.
                          </>
                        ) : (
                          <>
                            This report presents the current financial standing and project portfolio of the
                            Sangguniang Kabataan of Barangay {activeBarangay} for the covered period. As of {reportGeneratedAt},
                            the barangay has utilized <strong>{usagePct}%</strong> of its allocated annual budget of{' '}
                            <strong>{formatPeso(budget)}</strong> across <strong>{projects.length}</strong> recorded projects,
                            with <strong>{formatPeso(remaining)}</strong> remaining available for future youth development initiatives.
                          </>
                        )}
                      </div>

                      <div className="sk-report-summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '22px' }}>
                        {[
                          { label: isCitywide ? 'Total City Budget' : 'Annual Budget', val: formatPeso(budget), color: '#760031' },
                          { label: 'Amount Disbursed', val: formatPeso(spent), color: '#b45309' },
                          { label: 'Remaining', val: formatPeso(remaining), color: '#166534' },
                        ].map((item) => (
                          <div key={item.label} className="sk-report-card-item" style={{ border: '1px solid #e5e0da', borderRadius: '8px', padding: '14px 14px' }}>
                            <div className="sk-report-card-label" style={{ fontSize: '9.5px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{item.label}</div>
                            <div className="sk-report-card-val" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '18px', color: item.color, marginTop: '4px' }}>{item.val}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#444' }}>Budget Utilization</span>
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#760031' }}>{usagePct}%</span>
                        </div>
                        <div style={{ height: '10px', background: '#f0ece5', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${usagePct}%`, background: 'linear-gradient(90deg, #760031, #9a0040)' }} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Barangay Table Chunk */}
                  {chunk.barangays && chunk.barangays.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      {chunk.barangayTitle && (
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '13.5px', color: '#111', marginBottom: '10px' }}>
                          {chunk.barangayTitle}
                        </div>
                      )}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#faf4eb' }}>
                            {['Barangay', 'Projects', 'Budget', 'Disbursed', 'Utilization'].map((h) => (
                              <th key={h} style={{ textAlign: 'left', padding: '9px 8px', borderBottom: '2px solid #760031', color: '#760031', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.05em' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {chunk.barangays.map((b: any) => {
                            const pct = b.annualBudget > 0 ? Math.round((b.spent / b.annualBudget) * 100) : 0
                            return (
                              <tr key={b.barangay} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px 8px', fontWeight: 600 }}>{b.barangay}</td>
                                <td style={{ padding: '8px 8px', color: '#555' }}>{b.projects}</td>
                                <td style={{ padding: '8px 8px' }}>{formatPeso(b.annualBudget)}</td>
                                <td style={{ padding: '8px 8px', color: '#b45309' }}>{formatPeso(b.spent)}</td>
                                <td style={{ padding: '8px 8px' }}>{pct}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Project Table Chunk */}
                  {chunk.projects && chunk.projects.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      {chunk.projectTitle && (
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '13.5px', color: '#111', marginBottom: '10px' }}>
                          {chunk.projectTitle}
                        </div>
                      )}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#faf4eb' }}>
                            {['Title', ...(isCitywide ? ['Barangay'] : []), 'Category', 'Status', 'Budget', 'Spent'].map((h) => (
                              <th key={h} style={{ textAlign: 'left', padding: '9px 8px', borderBottom: '2px solid #760031', color: '#760031', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.05em' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {chunk.projects.map((p: any) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '8px 8px', fontWeight: 600 }}>{p.title}</td>
                              {isCitywide && <td style={{ padding: '8px 8px', color: '#555' }}>{p.barangay}</td>}
                              <td style={{ padding: '8px 8px', color: '#555' }}>{p.category}</td>
                              <td style={{ padding: '8px 8px', textTransform: 'capitalize', color: '#555' }}>{p.status}</td>
                              <td style={{ padding: '8px 8px' }}>{formatPeso(p.proposedBudget || 0)}</td>
                              <td style={{ padding: '8px 8px', color: '#b45309' }}>{formatPeso(p.spent || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Page Footer */}
                <div
                  style={{
                    paddingTop: '12px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '9.5px',
                    color: '#999',
                  }}
                >
                  <span>eSKala · Sangguniang Kabataan Management System</span>
                  <span>Page {chunk.pageNum} of {pageChunks.length} · {activeBarangay ? `Barangay ${activeBarangay}` : 'Santa Rosa City'}</span>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </Portal>
  )
}
