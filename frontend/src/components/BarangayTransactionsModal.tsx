import { useState, useEffect, useMemo } from 'react'
import Portal from './Portal'
import { fetchProjectsApi, fetchPurchaseOrdersApi } from '../services/api'

interface BarangayTransactionsModalProps {
  barangay: string
  onClose: () => void
}

interface PurchaseOrderRow {
  id: string
  projectTitle: string
  vendor: string
  amount: number
  date: string
  description?: string
}

export default function BarangayTransactionsModal({ barangay, onClose }: BarangayTransactionsModalProps) {
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState<PurchaseOrderRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Load real purchase orders from the database for this barangay
  useEffect(() => {
    async function loadTransactions() {
      setIsLoading(true)
      setLoadError('')
      try {
        // 1. Get all Posted (public) projects for this barangay
        const projects = await fetchProjectsApi({ barangay, public_only: true })
        if (!Array.isArray(projects) || projects.length === 0) {
          setOrders([])
          return
        }

        // 2. For each project, fetch purchase orders and flatten into a single list
        const allOrderPromises = projects.map(async (p: any) => {
          const projectId = Number(p.projectID || p.id)
          if (!projectId) return []
          try {
            const pos = await fetchPurchaseOrdersApi(projectId)
            if (!Array.isArray(pos)) return []
            return pos.map((po: any) => ({
              id: po.orderID || String(po.id),
              projectTitle: p.projectName || p.title || 'Unnamed Project',
              vendor: po.orderName || po.supplierName || 'Unknown Vendor',
              amount: Number(po.orderTotalPrice || (Number(po.orderPrice) * Number(po.orderQty)) || po.orderAmount || 0),
              date: po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-PH') : '—',
              description: po.orderType || 'Purchase Order',
            }))
          } catch {
            return []
          }
        })

        const results = await Promise.all(allOrderPromises)
        const flat: PurchaseOrderRow[] = results.flat().filter((o) => o.amount > 0)
        // Sort newest first
        flat.sort((a, b) => {
          const da = new Date(a.date).getTime()
          const db = new Date(b.date).getTime()
          return db - da
        })
        setOrders(flat)
      } catch (err: any) {
        console.warn('BarangayTransactionsModal fetch error:', err)
        setLoadError('Unable to load transaction data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    loadTransactions()
  }, [barangay])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return orders
    return orders.filter(
      (r) =>
        r.vendor.toLowerCase().includes(q) ||
        r.projectTitle.toLowerCase().includes(q) ||
        (r.description?.toLowerCase() ?? '').includes(q)
    )
  }, [orders, search])

  const totalDisbursed = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered])

  return (
    <Portal>
      <div
        className="modal-overlay"
        style={{ paddingTop: '5.5rem', paddingBottom: '2rem', alignItems: 'flex-start' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="modal" style={{ width: 'min(840px, 95vw)', maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Modal Header */}
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--maroon) 0%, var(--maroon-dark) 100%)', color: '#fff', padding: '1.1rem 1.5rem', flexShrink: 0 }}>
            <div>
              <h2 className="modal-title" style={{ color: '#fff', fontSize: '1.15rem', margin: 0 }}>
                Barangay {barangay} — Fund Receipts & Transactions
              </h2>
              <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.75)', marginTop: '0.15rem' }}>
                Live purchase orders from the database — sorted from latest to oldest
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="modal-body" style={{ padding: '1.2rem 1.5rem', overflowY: 'auto', flex: 1 }}>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--muted)' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid rgba(118,0,49,0.15)', borderTopColor: 'var(--maroon)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem' }}>
                  Loading transactions from database…
                </div>
              </div>
            ) : loadError ? (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: '#b91c1c' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{loadError}</div>
              </div>
            ) : (
              <>
                {/* Top Metrics */}
                <div className="card-grid card-grid-2" style={{ marginBottom: '1.2rem' }}>
                  <div className="stat-card card-accent" style={{ padding: '0.85rem 1.2rem' }}>
                    <div className="stat-value" style={{ fontSize: '1.4rem' }}>
                      ₱{Math.round(totalDisbursed).toLocaleString('en-PH')}
                    </div>
                    <div className="stat-label">Total Disbursed</div>
                  </div>
                  <div className="stat-card" style={{ padding: '0.85rem 1.2rem', borderLeft: '3px solid #b45309' }}>
                    <div className="stat-value" style={{ fontSize: '1.4rem', color: '#b45309' }}>
                      {filtered.length}
                    </div>
                    <div className="stat-label">Total Receipts Filed</div>
                  </div>
                </div>

                {/* Search */}
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div className="search-wrap" style={{ flex: 1, minWidth: '220px' }}>
                    <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      className="search-input"
                      type="text"
                      placeholder="Search vendor or project…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Table */}
                {filtered.length > 0 ? (
                  <div style={{ background: '#fff', border: '1.5px solid rgba(118,0,49,0.12)', overflowX: 'auto' }}>
                    <table className="txn-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Vendor / Payee</th>
                          <th>Project</th>
                          <th>Type</th>
                          <th>Amount (₱)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((r) => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.date}</td>
                            <td>
                              <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{r.vendor}</div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--ink-2)' }}>{r.projectTitle}</td>
                            <td style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>{r.description}</td>
                            <td style={{ fontWeight: 900, color: 'var(--maroon)', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                              ₱{Math.round(r.amount).toLocaleString('en-PH')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      No transaction receipts found for Barangay {barangay}
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>
                      Receipts appear here once SK officials attach purchase orders to Posted projects.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid rgba(118,0,49,0.1)', padding: '0.85rem 1.5rem', flexShrink: 0 }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
