import { useState, useEffect, FormEvent } from 'react'
import type { UserAccount, ReportProject } from '../types'
import ProjectDetailModal from '../components/ProjectDetailModal'
import BarangayTransactionsModal from '../components/BarangayTransactionsModal'
import { DonutChart } from '../components/MiniChart'
import SingleNewsCarousel from '../components/SingleNewsCarousel'
import { fetchProjectsApi, fetchBarangayReportApi, fetchNewsApi } from '../services/api'

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

export default function CitizenHome({ user }: CitizenHomeProps) {
  const barangay = user?.barangay || 'Balibago'
  const [summary, setSummary] = useState({ spent: 0, annualBudget: 0, remaining: 0 })
  const [localProjects, setLocalProjects] = useState<ReportProject[]>([])
  const [news, setNews] = useState<any[]>([])
  const [localComments, setLocalComments] = useState<any[]>([])
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadCitizenData() {
      try {
        const [projRes, repRes, newsRes] = await Promise.all([
          fetchProjectsApi({ barangay }).catch(() => []),
          fetchBarangayReportApi(barangay).catch(() => null),
          fetchNewsApi().catch(() => []),
        ])

        console.log("newsRes =", newsRes)
        console.log("projRes:", projRes)
        console.log("repRes:", repRes)
        console.log("newsRes:", newsRes)

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
            image: n.imageURL || undefined,
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

        console.log("mappedNews:", mappedNews)

        setNews(mappedNews)

        if (Array.isArray(projRes)) {
          setLocalProjects(projRes.map((p: any) => ({
            id: String(p.projectID || p.id),
            title: p.projectName || p.title,
            barangay: p.projectLocation || barangay,
            category: p.projectCategory || 'Education',
            status: p.projectStatus ? p.projectStatus.toLowerCase() as any : 'ongoing',
            proposedBudget: Number(p.projectBudget || 0),
            spent: Number(p.projectBreakdown || 0),
            remainingBudget: Math.max(0, Number(p.projectBudget || 0) - Number(p.projectBreakdown || 0)),
            progress: p.projectProgress || 0,
            progressPercent: p.projectProgress || 0,
            startDate: p.projectStartTime ? new Date(p.projectStartTime).toISOString().split('T')[0] : '',
            endDate: p.projectEndTime ? new Date(p.projectEndTime).toISOString().split('T')[0] : '',
            description: p.projectDescription || '',
          })))
        }

        if (repRes) {
          setSummary({
            spent: Number(repRes.spent || 0),
            annualBudget: Number(repRes.annualBudget || 0),
            remaining: Number(repRes.remaining || 0),
          })
        }
      } catch (err) {
        console.warn('API load warning:', err)
      }
    }
    loadCitizenData()
  }, [barangay])

  const [comment, setComment] = useState('')
  const [suggestionCat, setSuggestionCat] = useState('Sports Facilities')
  const [submitted, setSubmitted] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ReportProject | null>(null)
  const [showTxnModal, setShowTxnModal] = useState(false)

  const spent = summary.spent
  const budget = summary.annualBudget || 1
  const remain = summary.remaining
  const usagePct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0

  const handleComment = (e: FormEvent) => {
    e.preventDefault()
    if (comment.trim()) {
      const newC = {
        id: `C-${Date.now()}`,
        barangay,
        author: user?.name?.split(' ')[0] ?? 'Citizen',
        text: `[${suggestionCat}] ${comment.trim()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        type: 'suggestion' as const,
        votes: 1,
      }
      setLocalComments((prev: any[]) => [newC, ...prev])
      setSubmitted(true)
      setComment('')
      setTimeout(() => setSubmitted(false), 4000)
    }
  }

  const handleVote = (id: string) => {
    setLocalComments((prev: any[]) => prev.map((c: any) => {
      if (c.id !== id) return c
      const alreadyVoted = votedIds.has(id)
      return { ...c, votes: (c.votes ?? 0) + (alreadyVoted ? -1 : 1) }
    }))
    setVotedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  console.log("news state:", news)

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
          <div>
            <span className="page-kicker">Citizen Portal · Barangay {barangay}</span>
            <h1 className="page-title" style={{ marginTop: '0.3rem' }}>Your Barangay's SK Transparency Dashboard</h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              Track Barangay {barangay}'s SK budget utilization, active projects, and community engagement. Click any project card to inspect financial details and leave feedback.
            </p>
          </div>
          <button
            className="btn btn-gold btn-sm"
            onClick={() => setShowTxnModal(true)}
            style={{ alignSelf: 'flex-start', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 2-2 2v16a2 2 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Track Funds &amp; Receipts
          </button>
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
            <div className="stat-label">Amount Disbursed</div>
            <div className="stat-sub">{usagePct}% of annual budget</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #166534' }}>
            <div className="stat-value" style={{ color: '#166534' }}>₱{(remain / 1_000_000).toFixed(2)}M</div>
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
                      <div className="v-card-badge-pin">
                        <span className={`badge badge-${p.status}`}>{p.status}</span>
                      </div>
                    </div>

                    <div className="v-card-body" style={{ padding: '0.9rem 1rem 1rem' }}>
                      <div className="v-card-kicker">{p.category}</div>
                      <div className="v-card-title" style={{ fontSize: '0.92rem' }}>{p.title}</div>
                      <div className="v-card-date">{p.startDate} — {p.endDate}</div>

                      <div style={{ marginTop: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Progress</span>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)' }}>{p.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>

                      <div className="v-card-footer" style={{ paddingTop: '0.65rem' }}>
                        <div>
                          <div className="v-card-budget" style={{ fontSize: '0.95rem' }}>₱{(p.proposedBudget / 1000).toFixed(0)}K</div>
                          <div className="v-card-budget-label">Proposed Budget</div>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          Inspect
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
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

            {/* ── Facebook-Style SK Community Suggestion Post Box & Feed ── */}
            <div style={{ background: '#fff', border: '1.5px solid rgba(118,0,49,0.14)', boxShadow: '0 8px 24px rgba(118,0,49,0.06)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(118,0,49,0.08)', paddingBottom: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', background: 'var(--maroon)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0 }}>
                  {user?.name?.charAt(0) ?? 'C'}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.96rem', color: 'var(--ink)' }}>
                    What should Sangguniang Kabataan of Barangay {barangay} do, fix, or create next?
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    Post a public suggestion directly to your SK Council feed
                  </div>
                </div>
              </div>

              {submitted ? (
                <div className="alert-success" style={{ marginBottom: '1rem' }}>
                  Suggestion posted to the Barangay {barangay} SK feed! Thank you for participating.
                </div>
              ) : (
                <form onSubmit={handleComment} style={{ display: 'grid', gap: '0.85rem' }}>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder={`What's on your mind regarding Barangay ${barangay} SK? (e.g. "Fix basketball court lighting", "More youth workshops")`}
                    style={{ resize: 'vertical', fontFamily: 'var(--font-body)', fontSize: '0.88rem' }}
                    required
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.78rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)' }}>Topic:</label>
                      <select
                        className="form-input"
                        style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        value={suggestionCat}
                        onChange={e => setSuggestionCat(e.target.value)}
                      >
                        <option value="Sports Facilities">Sports Facilities</option>
                        <option value="Scholarships &amp; Education">Scholarships &amp; Education</option>
                        <option value="Digital Hub &amp; Wi-Fi">Digital Hub &amp; Wi-Fi</option>
                        <option value="Street Lighting &amp; Safety">Street Lighting &amp; Safety</option>
                        <option value="Youth Events &amp; Culture">Youth Events &amp; Culture</option>
                        <option value="General Suggestion">General Suggestion</option>
                      </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.4rem' }}>
                      Post Suggestion &rarr;
                    </button>
                  </div>
                </form>
              )}

              {/* Feed of Recent Citizen Suggestion Posts */}
              <div style={{ marginTop: '1.8rem', borderTop: '1px solid rgba(118,0,49,0.08)', paddingTop: '1.2rem', display: 'grid', gap: '0.9rem' }}>
                <div className="page-kicker">Barangay {barangay} Community Posts</div>
                {localComments.map((c: any) => (
                  <div key={c.id} className="comment-card" style={{ background: 'rgba(255,255,255,0.95)', border: '1.5px solid rgba(118,0,49,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div style={{ width: '30px', height: '30px', background: 'rgba(118,0,49,0.1)', color: 'var(--maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.8rem' }}>
                          {c.author.charAt(0)}
                        </div>
                        <span className="comment-author">{c.author}</span>
                      </div>
                      <span className="comment-date">{c.date}</span>
                    </div>

                    <p className="comment-text" style={{ margin: '0.6rem 0', fontSize: '0.88rem', color: 'var(--ink)' }}>
                      {c.text}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(118,0,49,0.06)', paddingTop: '0.5rem', marginTop: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => handleVote(c.id)}
                        className="link-button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.76rem',
                          color: 'var(--maroon)',
                          fontWeight: 500,
                          fontFamily: 'var(--font-display)',
                          lineHeight: 1,
                          transition: 'opacity 0.15s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                      >
                        <svg
                          width="16" height="16" viewBox="0 0 24 24"
                          fill={votedIds.has(c.id) ? 'var(--maroon)' : 'none'}
                          stroke={votedIds.has(c.id) ? 'var(--maroon-dark)' : 'var(--maroon)'}
                          strokeWidth="2"
                          strokeLinejoin="round"
                          style={{ display: 'block', flexShrink: 0, transition: 'transform 0.15s ease' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span style={{ lineHeight: 1 }}>Agree / Helpful ({c.votes ?? 0})</span>
                      </button>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                        Barangay {barangay} Feed
                      </span>
                    </div>
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

        {/* ── Modals ── */}
        {selectedProject && (
          <ProjectDetailModal project={selectedProject} user={user} onClose={() => setSelectedProject(null)} />
        )}

        {showTxnModal && (
          <BarangayTransactionsModal barangay={barangay} onClose={() => setShowTxnModal(false)} />
        )}

      </div>
    </section>
  )
}
