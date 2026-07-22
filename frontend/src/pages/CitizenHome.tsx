import { useState, FormEvent } from 'react'
import { barangaySummary, news, projects, citizenComments } from '../data/mockData'
import type { UserAccount } from '../types'

interface CitizenHomeProps { user?: UserAccount | null }

export default function CitizenHome({ user }: CitizenHomeProps) {
  const barangay    = user?.barangay || 'Balibago'
  const summary     = barangaySummary.find(b => b.barangay === barangay)
  const localProjects = projects.filter(p => p.barangay === barangay)
  const localComments = citizenComments.filter(c => c.barangay === barangay)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const spent     = summary?.spent ?? 0
  const budget    = summary?.annualBudget ?? 1
  const remain    = summary?.remaining ?? 0
  const usagePct  = Math.round((spent / budget) * 100)

  const handleComment = (e: FormEvent) => {
    e.preventDefault()
    if (comment.trim()) { setSubmitted(true); setComment('') }
  }

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div className="page-intro">
          <span className="page-kicker">Citizen Portal · {barangay}</span>
          <h1 className="page-title">Your Barangay's SK Transparency Dashboard</h1>
          <p className="page-subtitle">
            Track {barangay}'s SK budget utilization, active projects, and community engagement. Data reflects the 2023–2025 BSKE term.
          </p>
        </div>

        {/* ── Financial Stat Cards ── */}
        <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">₱{(budget / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Annual Budget</div>
            <div className="stat-sub">FY 2025 · SK Allocation</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #b45309' }}>
            <div className="stat-value" style={{ color: '#b45309' }}>₱{(spent / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Amount Spent</div>
            <div className="stat-sub">{usagePct}% of annual budget</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #166534' }}>
            <div className="stat-value" style={{ color: '#166534' }}>₱{(remain / 1_000_000).toFixed(2)}M</div>
            <div className="stat-label">Remaining</div>
            <div className="stat-sub">Available for disbursement</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{summary?.projects ?? 0}</div>
            <div className="stat-label">Total Projects</div>
            <div className="stat-sub">{localProjects.filter(p => p.status === 'ongoing').length} currently active</div>
          </div>
        </div>

        {/* ── Budget Utilization Bar ── */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.2rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem' }}>Budget Utilization — Brgy. {barangay}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)', fontSize: '1.1rem' }}>{usagePct}%</span>
          </div>
          <div className="progress-bar progress-thick">
            <div className="progress-fill" style={{ width: `${usagePct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
            <span>₱0</span>
            <span style={{ color: '#b45309', fontWeight: 700 }}>₱{spent.toLocaleString()} spent</span>
            <span>₱{budget.toLocaleString()} total</span>
          </div>
        </div>

        {/* ── Two columns: Projects + News/Comments ── */}
        <div className="page-cols page-cols-sidebar">

          {/* Left — Projects */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <div className="page-kicker">Local Activity</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                {barangay} — SK Projects
              </h2>
            </div>

            {localProjects.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {localProjects.map(p => (
                  <div key={p.id} className="project-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                      <div>
                        <span className={`badge badge-${p.status}`} style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>{p.status}</span>
                        <div className="project-title">{p.title}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.35rem', color: 'var(--maroon)', lineHeight: 1 }}>{p.progress}%</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Done</div>
                      </div>
                    </div>
                    <div className="project-meta">
                      {p.category && <span className="project-meta-item">🏷 {p.category}</span>}
                      <span className="project-meta-item">📅 {p.startDate} → {p.endDate}</span>
                    </div>
                    <p className="project-desc">{p.description}</p>
                    <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                      <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="project-budget-row">
                      <span>Budget: <span className="project-budget-val">₱{p.proposedBudget.toLocaleString()}</span></span>
                      <span>Spent: <span className="project-budget-val">₱{p.spent.toLocaleString()}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No projects listed yet</div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>SK {barangay} projects will appear here once registered.</div>
              </div>
            )}
          </div>

          {/* Right — News + Comments */}
          <div style={{ display: 'grid', gap: '1.5rem', alignContent: 'start' }}>

            {/* City News */}
            <div>
              <div style={{ marginBottom: '0.85rem' }}>
                <div className="page-kicker">City News</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>Latest Announcements</h2>
              </div>
              <div style={{ display: 'grid', gap: '0.7rem' }}>
                {news.slice(0, 4).map(n => (
                  <div key={n.id} className="news-card">
                    <span className="news-cat">{n.category}</span>
                    <div className="news-title" style={{ fontSize: '0.88rem' }}>{n.title}</div>
                    <span className="news-date">{n.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Citizen Comments */}
            <div>
              <div style={{ marginBottom: '0.85rem' }}>
                <div className="page-kicker">Community Feedback</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginTop: '0.2rem' }}>Comments & Suggestions</h2>
              </div>
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {localComments.length > 0 ? localComments.map(c => (
                  <div key={c.id} className="comment-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <span className="comment-author">{c.author}</span>
                      {c.type && <span className={`badge ${c.type === 'suggestion' ? 'badge-upcoming' : 'badge-ongoing'}`}>{c.type}</span>}
                    </div>
                    <span className="comment-date">{c.date}</span>
                    <p className="comment-text">{c.text}</p>
                    {c.votes !== undefined && (
                      <div className="comment-votes">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        {c.votes} helpful
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem' }}>No comments yet</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>Be the first to leave feedback!</div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Comment */}
            <div className="card" style={{ background: 'rgba(118,0,49,0.04)', border: '1.5px solid rgba(118,0,49,0.14)' }}>
              <div className="page-kicker" style={{ marginBottom: '0.75rem' }}>Your Voice</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.96rem', marginBottom: '0.85rem' }}>Leave a Comment or Suggestion</h3>
              {submitted ? (
                <div className="notice success">✓ Your comment has been submitted. Thank you for participating!</div>
              ) : (
                <form onSubmit={handleComment} style={{ display: 'grid', gap: '0.75rem' }}>
                  <textarea
                    className="login-input" style={{ minHeight: '90px', resize: 'vertical', padding: '0.75rem 1rem' }}
                    placeholder={`Share your thoughts about SK ${barangay} projects…`}
                    value={comment} onChange={e => setComment(e.target.value)} required
                  />
                  <button type="submit" className="btn-login-submit" style={{ marginTop: 0, padding: '0.75rem' }}>
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
