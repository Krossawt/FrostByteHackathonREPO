import { useState, useEffect } from 'react'
import { BARANGAYS } from '../constants'
import { fetchAuditLogsApi } from '../services/api'
import Portal from '../components/Portal'

const ACTION_TYPES = ['All', 'Project Created', 'Receipt Uploaded', 'Account Created', 'News Published', 'Login', 'Project Updated', 'Suggestion Posted', 'Account Deleted']

interface AuditLogItem {
  id: string
  logID: number | string
  actorID?: number
  actorName: string
  actorRole?: string
  barangay?: string
  actionType: string
  targetModule: string
  targetID?: string
  details?: string
  timestamp: string
  formattedDate: string
}

function getActionBadgeStyle(action: string) {
  const act = action.toLowerCase()
  if (act.includes('created') || act.includes('post')) {
    return { bg: 'rgba(22, 101, 52, 0.1)', color: '#166534', border: 'rgba(22, 101, 52, 0.25)', label: action }
  }
  if (act.includes('uploaded') || act.includes('receipt') || act.includes('update')) {
    return { bg: 'rgba(180, 83, 9, 0.1)', color: '#b45309', border: 'rgba(180, 83, 9, 0.25)', label: action }
  }
  if (act.includes('delete') || act.includes('suspend') || act.includes('remove')) {
    return { bg: 'rgba(185, 28, 28, 0.1)', color: '#b91c1c', border: 'rgba(185, 28, 28, 0.25)', label: action }
  }
  if (act.includes('login') || act.includes('auth')) {
    return { bg: 'rgba(29, 78, 216, 0.1)', color: '#1d4ed8', border: 'rgba(29, 78, 216, 0.25)', label: action }
  }
  return { bg: 'rgba(118, 0, 49, 0.08)', color: 'var(--maroon)', border: 'rgba(118, 0, 49, 0.2)', label: action }
}

interface SuperAdminActivityProps {
  selectedBarangay?: string
}

export default function SuperAdminActivity({ selectedBarangay }: SuperAdminActivityProps) {
  const [search, setSearch] = useState('')
  const [barangay, setBarangay] = useState('All')
  const [actionType, setActionType] = useState('All')
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetchAuditLogsApi(200)
        if (Array.isArray(res)) {
          setLogs(res.map((l: any) => ({
            id: String(l.logID || l.id || Math.random()),
            logID: l.logID || l.id || 'N/A',
            actorID: l.actorID,
            actorName: l.actorName || l.actor || 'System',
            actorRole: l.actorRole || 'System',
            barangay: l.barangay || 'Santa Rosa City',
            actionType: l.actionType || l.action || 'System Event',
            targetModule: l.targetModule || 'system',
            targetID: l.targetID ? String(l.targetID) : undefined,
            details: l.details || l.description || '',
            timestamp: l.timestamp || new Date().toISOString(),
            formattedDate: l.timestamp ? new Date(l.timestamp).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently',
          })))
        }
      } catch (err) {
        console.warn('API fetch audit logs warning:', err)
      }
    }
    loadLogs()
  }, [])

  const activeBrgy = selectedBarangay && selectedBarangay !== '' ? selectedBarangay : barangay

  const filtered = logs.filter(l => {
    const matchBrgy = activeBrgy === 'All' || activeBrgy === 'all' || l.barangay?.toLowerCase().includes(activeBrgy.toLowerCase())
    const matchAction = actionType === 'All' || l.actionType.toLowerCase().includes(actionType.toLowerCase()) || (l.details ?? '').toLowerCase().includes(actionType.toLowerCase())
    const q = search.toLowerCase().trim()
    const matchQ = !q ||
      l.actorName.toLowerCase().includes(q) ||
      l.actionType.toLowerCase().includes(q) ||
      (l.barangay?.toLowerCase() ?? '').includes(q) ||
      (l.targetModule?.toLowerCase() ?? '').includes(q) ||
      (l.details?.toLowerCase() ?? '').includes(q)
    return matchBrgy && matchAction && matchQ
  })

  const exportLogsToCsv = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor Name', 'Actor Role', 'Barangay', 'Action Type', 'Target Module', 'Target ID', 'Details']
    const rows = filtered.map((log) => [
      log.logID ?? '',
      log.formattedDate ?? '',
      log.actorName ?? '',
      log.actorRole ?? '',
      log.barangay ?? '',
      log.actionType ?? '',
      log.targetModule ?? '',
      log.targetID ?? '',
      log.details ?? '',
    ])

    const escapeCsvValue = (value: any) => {
      const stringValue = String(value ?? '')
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sk-audit-log-trail-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <section className="section section-accent-flow" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
      <div className="container">

        {/* ── Page Intro Banner ── */}
        <div className="page-intro reveal section-glass-grid" style={{ padding: '1.5rem 1.8rem', borderRadius: '12px', marginBottom: '1.8rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,244,235,0.9) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="page-kicker">Immutable Audit Trail · COA / DILG Compliance</span>
              <h1 className="page-title" style={{ marginTop: '0.3rem' }}>
                Official System Audit Logs
                {selectedBarangay && selectedBarangay !== '' && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--maroon)', fontWeight: 700, marginLeft: '0.6rem' }}>
                    · Barangay {selectedBarangay} Filter Active
                  </span>
                )}
              </h1>
              <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
                Immutable line-by-line audit record of all actions executed by SK Officials, Citizens, and Super Admins. Compliant with Republic Act 10742 &amp; COA audit standards.
              </p>
            </div>
            <button
              className="btn btn-secondary"
              style={{ alignSelf: 'flex-start', marginTop: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={exportLogsToCsv}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export Audit Trail (CSV)
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="card-grid card-grid-4 reveal" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">{logs.length}</div>
            <div className="stat-label">Total Log Entries</div>
            <div className="stat-sub">Immutable System Logs</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #166534' }}>
            <div className="stat-value" style={{ color: '#166534' }}>{logs.filter((l) => l.actionType.includes('Created') || l.actionType.includes('Uploaded') || l.actionType.includes('Posted')).length}</div>
            <div className="stat-label">Creation &amp; Posts</div>
            <div className="stat-sub">Projects, Receipts &amp; News</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #1d4ed8' }}>
            <div className="stat-value" style={{ color: '#1d4ed8' }}>{logs.filter((l) => l.actionType.toLowerCase().includes('login')).length}</div>
            <div className="stat-label">Auth &amp; Session Logs</div>
            <div className="stat-sub">User authentications</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{new Set(logs.map((l) => l.actorName)).size}</div>
            <div className="stat-label">Unique Actors</div>
            <div className="stat-sub">Officials &amp; Citizens</div>
          </div>
        </div>

        {/* ── Toolbar & Filters ── */}
        <div className="toolbar" style={{ alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
          <div className="toolbar-left" style={{ flexWrap: 'wrap', flex: 1 }}>
            <div className="search-wrap" style={{ flex: 1, minWidth: '220px' }}>
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input className="search-input" type="text" placeholder="Search by actor, action, module, or details…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="search-input" style={{ width: 'auto', paddingLeft: '0.85rem', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23760031' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.6rem center', paddingRight: '1.8rem' }}
              value={barangay} onChange={e => setBarangay(e.target.value)}>
              <option value="All">All Barangays</option>
              {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="search-input" style={{ width: 'auto', paddingLeft: '0.85rem', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23760031' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.6rem center', paddingRight: '1.8rem' }}
              value={actionType} onChange={e => setActionType(e.target.value)}>
              {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
            {filtered.length} log entry{filtered.length !== 1 ? 'ies' : ''}
          </span>
        </div>

        {/* ── Enterprise Line-by-Line Audit Log Table ── */}
        {filtered.length > 0 ? (
          <div style={{
            background: '#fff',
            border: '1.5px solid rgba(118,0,49,0.14)',
            boxShadow: '0 8px 24px rgba(118,0,49,0.06)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(118,0,49,0.04)', borderBottom: '1.5px solid rgba(118,0,49,0.12)', fontFamily: 'var(--font-display)', color: 'var(--ink)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.85rem 1.1rem', width: '90px' }}>Log ID</th>
                    <th style={{ padding: '0.85rem 1.1rem', width: '180px' }}>Timestamp</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Actor</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Barangay</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Action Event</th>
                    <th style={{ padding: '0.85rem 1.1rem', width: '110px' }}>Module</th>
                    <th style={{ padding: '0.85rem 1.1rem', textIndent: '0.2rem' }}>Details Summary</th>
                    <th style={{ padding: '0.85rem 1.1rem', textAlign: 'right', width: '90px' }}>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => {
                    const badge = getActionBadgeStyle(log.actionType)
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        style={{
                          borderBottom: '1px solid rgba(118,0,49,0.06)',
                          cursor: 'pointer',
                          transition: 'background 140ms ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(118,0,49,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        {/* Log ID */}
                        <td style={{ padding: '0.75rem 1.1rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--muted)', fontSize: '0.8rem' }}>
                          #{log.logID}
                        </td>

                        {/* Timestamp */}
                        <td style={{ padding: '0.75rem 1.1rem', color: 'var(--ink)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>
                          {log.formattedDate}
                        </td>

                        {/* Actor & Role */}
                        <td style={{ padding: '0.75rem 1.1rem' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)' }}>{log.actorName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{log.actorRole || 'System'}</div>
                        </td>

                        {/* Barangay */}
                        <td style={{ padding: '0.75rem 1.1rem', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.76rem', background: 'rgba(118,0,49,0.06)', color: 'var(--maroon)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                            {log.barangay}
                          </span>
                        </td>

                        {/* Action Event */}
                        <td style={{ padding: '0.75rem 1.1rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.65rem',
                            borderRadius: '12px',
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}>
                            {log.actionType}
                          </span>
                        </td>

                        {/* Target Module */}
                        <td style={{ padding: '0.75rem 1.1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--muted)' }}>
                          {log.targetModule}
                        </td>

                        {/* Details Summary */}
                        <td style={{ padding: '0.75rem 1.1rem', color: 'var(--ink-2)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.details || '—'}
                        </td>

                        {/* Inspect Button */}
                        <td style={{ padding: '0.75rem 1.1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLog(log)
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                            Inspect
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No audit logs match your filter</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Try adjusting your search or filter criteria.</div>
          </div>
        )}

        {/* ── Audit Log Details Inspector Modal ── */}
        {selectedLog && (
          <Portal>
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedLog(null) }}
              style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(10, 5, 8, 0.6)',
                backdropFilter: 'blur(5px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1.5rem',
              }}
            >
              <div style={{
                background: '#fff',
                border: '1.5px solid rgba(118,0,49,0.2)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                borderRadius: '14px',
                width: 'min(580px, 95vw)',
                maxHeight: '88vh',
                overflowY: 'auto',
                padding: '1.8rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', borderBottom: '1.5px solid rgba(118,0,49,0.1)', paddingBottom: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Official Audit Log Record #{selectedLog.logID}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                      {selectedLog.actionType}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.2rem' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '0.9rem', fontSize: '0.86rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', background: 'rgba(118,0,49,0.03)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(118,0,49,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>ACTOR NAME</div>
                      <div style={{ fontWeight: 800, color: 'var(--ink)', marginTop: '0.1rem' }}>{selectedLog.actorName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>ROLE</div>
                      <div style={{ fontWeight: 700, color: 'var(--maroon)', marginTop: '0.1rem' }}>{selectedLog.actorRole}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', background: 'rgba(118,0,49,0.03)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(118,0,49,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>BARANGAY JURISDICTION</div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', marginTop: '0.1rem' }}>{selectedLog.barangay}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>TIMESTAMP</div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', marginTop: '0.1rem' }}>{selectedLog.formattedDate}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', background: 'rgba(118,0,49,0.03)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(118,0,49,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>TARGET MODULE</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--ink)', marginTop: '0.1rem' }}>{selectedLog.targetModule}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>TARGET ID</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--ink)', marginTop: '0.1rem' }}>{selectedLog.targetID || 'N/A'}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.35rem' }}>
                      FULL AUDIT ACTION DETAILS
                    </div>
                    <div style={{ background: '#1e1e1e', color: '#68d391', fontFamily: 'monospace', fontSize: '0.82rem', padding: '1rem', borderRadius: '8px', lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {selectedLog.details || 'No additional detail parameters recorded for this entry.'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.4rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setSelectedLog(null)}>
                    Done Inspecting
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

      </div>
    </section>
  )
}
