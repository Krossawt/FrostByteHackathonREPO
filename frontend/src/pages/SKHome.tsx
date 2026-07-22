import { useState, FormEvent } from 'react'
import { barangaySummary, projects, receipts, citizenComments, activityLogs, skOfficials } from '../data/mockData'
import type { UserAccount } from '../types'

interface SKHomeProps { user?: UserAccount | null }

export default function SKHome({ user }: SKHomeProps) {
  const barangay = user?.barangay || 'Balibago'
  const position = user?.skPosition || 'Chairperson'
  const canAddProject = position === 'Chairperson' || position === 'Secretary'
  const canAddReceipt = position === 'Chairperson' || position === 'Treasurer'

  const summary    = barangaySummary.find(b => b.barangay === barangay)
  const myProjects = projects.filter(p => p.barangay === barangay)
  const myReceipts = receipts.filter(r => r.barangay === barangay)
  const myComments = citizenComments.filter(c => c.barangay === barangay)
  const myLogs     = activityLogs.filter(l => l.barangay === barangay).slice(0, 8)
  const myOfficials= skOfficials.filter(o => o.barangay === barangay)

  const spent   = summary?.spent ?? 0
  const budget  = summary?.annualBudget ?? 1
  const remain  = summary?.remaining ?? 0
  const usePct  = Math.round((spent / budget) * 100)
  const totalReceipts = myReceipts.reduce((s, r) => s + r.amount, 0)

  const [activeTab, setActiveTab] = useState<'overview' | 'receipts' | 'comments'>('overview')

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
          <div>
            <span className="page-kicker">SK Dashboard · {barangay}</span>
            <h1 className="page-title" style={{ marginTop: '0.3rem' }}>Welcome, {user?.name?.split(' ')[0] ?? 'SK Officer'}</h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              {position} · Barangay {barangay}, Santa Rosa City, Laguna
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignSelf: 'flex-start', marginTop: '0.4rem' }}>
            {canAddProject && <button className="btn btn-primary btn-sm">+ Add Project</button>}
            {canAddReceipt && <button className="btn btn-secondary btn-sm">+ Upload Receipt</button>}
          </div>
        </div>

        {/* ── Financial Stat Cards ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">₱{(budget / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Annual Budget</div>
            <div className="stat-sub">FY 2025 allocation</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #b45309' }}>
            <div className="stat-value" style={{ color: '#b45309' }}>₱{(spent / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Amount Disbursed</div>
            <div className="stat-sub">{usePct}% of budget used</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #166534' }}>
            <div className="stat-value" style={{ color: '#166534' }}>₱{(remain / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Remaining</div>
            <div className="stat-sub">Available for projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{myProjects.length}</div>
            <div className="stat-label">Projects</div>
            <div className="stat-sub">{myProjects.filter(p => p.status === 'ongoing').length} ongoing</div>
          </div>
        </div>

        {/* ── Budget utilization bar ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem' }}>Budget Utilization — Brgy. {barangay}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)', fontSize: '1.05rem' }}>{usePct}%</span>
          </div>
          <div className="progress-bar progress-thick">
            <div className="progress-fill" style={{ width: `${usePct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.45rem', fontSize: '0.76rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
            <span>₱{spent.toLocaleString()} spent</span>
            <span>of ₱{budget.toLocaleString()} total budget</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="filter-tabs">
          <button className={`filter-tab${activeTab === 'overview' ? ' active' : ''}`} onClick={() => setActiveTab('overview')}>
            Projects & Council
          </button>
          <button className={`filter-tab${activeTab === 'receipts' ? ' active' : ''}`} onClick={() => setActiveTab('receipts')}>
            Receipts ({myReceipts.length})
          </button>
          <button className={`filter-tab${activeTab === 'comments' ? ' active' : ''}`} onClick={() => setActiveTab('comments')}>
            Citizen Feedback ({myComments.length})
          </button>
        </div>

        {/* ── Tab: Overview ── */}
        {activeTab === 'overview' && (
          <div className="page-cols page-cols-sidebar">
            {/* Projects */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div className="page-kicker">Project Management</div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                    {barangay} SK Projects
                  </h2>
                </div>
                {canAddProject && <button className="btn btn-primary btn-sm">+ New Project</button>}
              </div>

              <div style={{ display: 'grid', gap: '0.9rem' }}>
                {myProjects.length > 0 ? myProjects.map(p => (
                  <div key={p.id} className="project-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <span className={`badge badge-${p.status}`} style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>{p.status}</span>
                        <div className="project-title">{p.title}</div>
                        <div className="project-meta">
                          <span className="project-meta-item">🏷 {p.category}</span>
                          <span className="project-meta-item">📅 {p.startDate}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                        {canAddProject && <button className="btn btn-secondary btn-sm">Edit</button>}
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="project-budget-row">
                      <span>Budget: <span className="project-budget-val">₱{p.proposedBudget.toLocaleString()}</span></span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--maroon)' }}>{p.progress}%</span>
                    </div>
                  </div>
                )) : (
                  <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No projects yet</div>
                    {canAddProject && <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Add your first SK project.</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Council + Activity Log */}
            <div style={{ display: 'grid', gap: '1.2rem', alignContent: 'start' }}>

              {/* Council */}
              <div>
                <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>SK Council — {barangay}</div>
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {myOfficials.map(o => (
                    <div key={o.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem' }}>
                      <div className="sk-avatar" style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}>
                        {o.name.split(' ').filter(w => w.length > 1 && !/^(Jr|Sr)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem' }}>{o.name}</div>
                      </div>
                      <span className={`badge ${o.position === 'Chairperson' ? 'badge-chairperson' : o.position === 'Treasurer' ? 'badge-treasurer' : o.position === 'Secretary' ? 'badge-secretary' : 'badge-kagawad'}`}>
                        {o.position}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity log */}
              <div>
                <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>Recent Activity</div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {myLogs.map(log => (
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

        {/* ── Tab: Receipts ── */}
        {activeTab === 'receipts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div className="page-kicker">Financial Records</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                  Official Receipts & Disbursements
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--maroon)' }}>
                  Total: ₱{totalReceipts.toLocaleString()}
                </div>
                {canAddReceipt && <button className="btn btn-primary btn-sm">+ Upload Receipt (OCR)</button>}
              </div>
            </div>

            {/* Upload zone (for eligible SK roles) */}
            {canAddReceipt && (
              <div className="upload-zone" style={{ marginBottom: '1.2rem' }}>
                <div className="upload-zone-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="upload-zone-text">Upload Receipt Image or PDF</div>
                <div className="upload-zone-hint">Supports JPG, PNG, PDF · OCR auto-extracts amount, vendor, and date</div>
              </div>
            )}

            <div className="card-grid card-grid-2">
              {myReceipts.length > 0 ? myReceipts.map(r => (
                <div key={r.id} className="receipt-row">
                  <div style={{ flex: 1 }}>
                    <div className="receipt-vendor">{r.vendor}</div>
                    <div className="receipt-meta">
                      📅 {r.date} · {r.projectTitle || 'General Disbursement'}
                    </div>
                    <div style={{ marginTop: '0.3rem' }}>
                      <span className={`badge ${r.status === 'verified' ? 'badge-completed' : r.status === 'pending' ? 'badge-upcoming' : 'badge-cancelled'}`}>
                        {r.status}
                      </span>
                      {r.ocrExtracted && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>OCR ✓</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="receipt-amount">₱{r.amount.toLocaleString()}</div>
                    {canAddReceipt && <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.4rem' }}>View</button>}
                  </div>
                </div>
              )) : (
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)', gridColumn: '1/-1' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧾</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No receipts uploaded yet</div>
                  {canAddReceipt && <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Upload a receipt to get started.</div>}
                </div>
              )}
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
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
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
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No citizen feedback yet</div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  )
}
