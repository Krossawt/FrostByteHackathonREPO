import { useState, useMemo } from 'react'
import { receipts as allReceipts } from '../data/mockData'
import type { Receipt } from '../types'
import Portal from './Portal'

const SAMPLE_RECEIPT_IMAGES = [
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&q=80',
  'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=700&q=80',
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=700&q=80',
]

interface BarangayTransactionsModalProps {
  barangay: string
  onClose: () => void
}

export default function BarangayTransactionsModal({ barangay, onClose }: BarangayTransactionsModalProps) {
  const [search, setSearch] = useState('')
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null)

  // Filter and sort transactions strictly from latest to oldest
  const filteredReceipts = useMemo(() => {
    return allReceipts
      .filter(r => r.barangay === barangay)
      .filter(r => {
        const q = search.toLowerCase()
        return !q || r.vendor.toLowerCase().includes(q) || (r.projectTitle?.toLowerCase() ?? '').includes(q) || (r.description?.toLowerCase() ?? '').includes(q)
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [barangay, search])

  const totalDisbursed = useMemo(() => {
    return filteredReceipts.reduce((sum, r) => sum + r.amount, 0)
  }, [filteredReceipts])

  return (
    <Portal>
      <div className="modal-overlay" style={{ paddingTop: '5.5rem', paddingBottom: '2rem', alignItems: 'flex-start' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ width: 'min(840px, 95vw)', maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--maroon) 0%, var(--maroon-dark) 100%)', color: '#fff', padding: '1.1rem 1.5rem', flexShrink: 0 }}>
          <div>
            <h2 className="modal-title" style={{ color: '#fff', fontSize: '1.15rem', margin: 0 }}>
              Barangay {barangay} — Fund Receipts &amp; Transactions
            </h2>
            <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.75)', marginTop: '0.15rem' }}>
              Public financial transactions sorted from latest to oldest
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.2rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          
          {/* 2 Essential Top Metrics */}
          <div className="card-grid card-grid-2" style={{ marginBottom: '1.2rem' }}>
            <div className="stat-card card-accent" style={{ padding: '0.85rem 1.2rem' }}>
              <div className="stat-value" style={{ fontSize: '1.4rem' }}>₱{totalDisbursed.toLocaleString()}</div>
              <div className="stat-label">Total Disbursed</div>
            </div>

            <div className="stat-card" style={{ padding: '0.85rem 1.2rem', borderLeft: '3px solid #b45309' }}>
              <div className="stat-value" style={{ fontSize: '1.4rem', color: '#b45309' }}>
                {filteredReceipts.length}
              </div>
              <div className="stat-label">Total Receipts Filed</div>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="search-wrap" style={{ flex: 1, minWidth: '220px' }}>
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Search vendor or purpose…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Uncluttered Table */}
          {filteredReceipts.length > 0 ? (
            <div style={{ background: '#fff', border: '1.5px solid rgba(118,0,49,0.12)', overflowX: 'auto' }}>
              <table className="txn-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vendor / Payee</th>
                    <th>Purpose / Project</th>
                    <th>Amount (₱)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.date}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{r.vendor}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--ink-2)' }}>
                        {r.projectTitle || r.description || 'Barangay Youth Program'}
                      </td>
                      <td style={{ fontWeight: 900, color: 'var(--maroon)', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                        ₱{r.amount.toLocaleString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={() => setViewingReceipt(r)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No transaction receipts found for {barangay}</div>
            </div>
          )}

        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid rgba(118,0,49,0.1)', padding: '0.85rem 1.5rem', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>

      </div>

      {/* ── Receipt Image Lightbox Modal ── */}
      {viewingReceipt && (
        <div className="modal-overlay" onClick={() => setViewingReceipt(null)}>
          <div className="modal" style={{ width: 'min(500px, 90vw)', padding: '1.25rem' }} onClick={e => e.stopPropagation()}>
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
                <div style={{ fontWeight: 900, fontSize: '0.92rem', color: 'var(--maroon)', marginTop: '0.15rem' }}>BARANGAY {barangay.toUpperCase()} SANGGUNIANG KABATAAN</div>
                <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '0.15rem' }}>OFFICIAL DISBURSEMENT RECEIPT · O.R. #OR-2025-0{Math.abs(viewingReceipt.id.charCodeAt(0)) % 9000 + 1000}</div>
              </div>

              <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.78rem', marginBottom: '0.85rem' }}>
                <div><strong>PAYEE / VENDOR:</strong> {viewingReceipt.vendor}</div>
                <div><strong>DATE FILED:</strong> {viewingReceipt.date}</div>
                <div><strong>PROJECT:</strong> {viewingReceipt.projectTitle || 'Barangay Youth Program'}</div>
                <div><strong>PARTICULARS:</strong> {viewingReceipt.description || 'Official procurement disbursement'}</div>
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
    </Portal>
  )
}
