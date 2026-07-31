import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Menu, X } from 'lucide-react'
import { BARANGAYS } from '../constants'
import { DonutChart, HBarChart } from '../components/MiniChart'
import ProjectDetailModal from '../components/ProjectDetailModal'
import BarangayTransactionsModal from '../components/BarangayTransactionsModal'
import NewsTicker from '../components/NewsTicker'
import type { ReportProject, NewsItem } from '../types'
import { fetchExecutiveSummaryApi, fetchNewsApi, fetchProjectsApi, fetchSKOfficialsApi } from '../services/api'


const NEWS_IMAGES: Record<string, string> = {
  'N-01': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=640&q=75',
  'N-02': 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=640&q=75',
  'N-03': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=640&q=75',
  'N-04': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&q=75',
  'N-05': 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=640&q=75',
  'N-06': 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=640&q=75',
  'N-07': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=640&q=75',
  'N-08': 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=640&q=75',
}

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

function getCover(cat?: string) { return CATEGORY_IMAGES[cat ?? 'Other'] ?? CATEGORY_IMAGES['Other'] }

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed') }),
      { threshold: 0.1 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}



export default function Landing() {
  useScrollReveal()

  const [navOpen, setNavOpen] = useState(false)

  // Live API States (strictly loaded from backend database)
  const [liveNews, setLiveNews] = useState<NewsItem[]>([])
  const [liveProjects, setLiveProjects] = useState<ReportProject[]>([])
  const [summaryData, setSummaryData] = useState<{
    totalBudget: number
    totalSpent: number
    totalProjects: number
    ongoingProjects: number
    completedProjects: number
    upcomingProjects: number
    skOfficialsCount: number
    barangays: any[]
  }>({
    totalBudget: 0,
    totalSpent: 0,
    totalProjects: 0,
    ongoingProjects: 0,
    completedProjects: 0,
    upcomingProjects: 0,
    skOfficialsCount: 0,
    barangays: []
  })

  useEffect(() => {
    async function loadLandingData() {
      try {
        const [sumRes, newsRes, projRes, skOfficialsRes] = await Promise.all([
          fetchExecutiveSummaryApi().catch(() => null),
          fetchNewsApi().catch(() => []),
          fetchProjectsApi({ status: 'Posted' }).catch(() => []),
          fetchSKOfficialsApi().catch(() => []),
        ])

        const fallbackSkCount = Array.isArray(skOfficialsRes) ? skOfficialsRes.length : 0
        const skOfficialsCount = (sumRes && typeof sumRes.skOfficialsCount === 'number')
          ? Number(sumRes.skOfficialsCount)
          : fallbackSkCount

        if (sumRes) {
          setSummaryData({
            totalBudget: Number(sumRes.totalBudget || 0),
            totalSpent: Number(sumRes.totalSpent || 0),
            totalProjects: Number(sumRes.totalProjects || 0),
            ongoingProjects: Number(sumRes.ongoingProjects || 0),
            completedProjects: Number(sumRes.completedProjects || 0),
            upcomingProjects: Number(sumRes.upcomingProjects || 0),
            skOfficialsCount,
            barangays: Array.isArray(sumRes.barangays) ? sumRes.barangays : [],
          })
        } else if (fallbackSkCount > 0) {
          setSummaryData(prev => ({ ...prev, skOfficialsCount }))
        }

        if (Array.isArray(newsRes)) {
          setLiveNews(newsRes)
        }

        if (Array.isArray(projRes)) {
          setLiveProjects(projRes.map((p: any) => ({
            id: String(p.projectID || p.id),
            title: p.projectName || p.title,
            barangay: p.projectLocation,
            category: p.projectCategory || 'Education',
            status: p.projectStatus ? p.projectStatus.toLowerCase() as any : 'ongoing',
            proposedBudget: Number(p.projectBudget || 0),
            spent: Number(p.projectBreakdown || 0),
            progress: p.projectProgress || 0,
            progressPercent: p.projectProgress || 0,
            startDate: p.projectStartTime ? new Date(p.projectStartTime).toISOString().split('T')[0] : '',
            endDate: p.projectEndTime ? new Date(p.projectEndTime).toISOString().split('T')[0] : '',
            description: p.projectDescription || '',
          })))
        }
      } catch (err) {
        console.warn('API error loading landing data:', err)
      }
    }
    loadLandingData()
  }, [])

  // News carousel
  const [newsIdx, setNewsIdx] = useState(0)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const newsList = liveNews

  // Guard: only advance if there's more than one item to prevent NaN from % 0
  const nextNews = useCallback(() => {
    if (newsList.length < 2) return
    setNewsIdx(i => (i + 1) % newsList.length)
  }, [newsList.length])
  const prevNews = useCallback(() => {
    if (newsList.length < 2) return
    setNewsIdx(i => (i - 1 + newsList.length) % newsList.length)
  }, [newsList.length])
  const pauseAuto = () => { if (autoRef.current) clearInterval(autoRef.current) }
  const resumeAuto = () => {
    if (newsList.length < 2) return
    autoRef.current = setInterval(nextNews, 4000)
  }

  // Restart the interval only after news has actually loaded (length changes from 0 → n)
  useEffect(() => {
    if (newsList.length < 2) return
    autoRef.current = setInterval(nextNews, 4000)
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [nextNews, newsList.length])

  // Legal popup state
  type LegalModal = 'terms' | 'privacy' | 'ra10742' | 'disclosure' | null
  const [legalModal, setLegalModal] = useState<LegalModal>(null)

  // Barangay picker & modals
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedBrgy, setSelectedBrgy] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<ReportProject | null>(null)
  const [showTxnModal, setShowTxnModal] = useState(false)

  const clearBrgy = () => setSelectedBrgy(null)

  const handleSelectBrgy = (b: string) => {
    setSelectedBrgy(b)
    setPickerOpen(false)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  // Barangay-specific data
  const brgyData = selectedBrgy ? summaryData.barangays.find((b: any) => b.barangay === selectedBrgy) : null
  const brgyProj = selectedBrgy ? liveProjects.filter(p => p.barangay === selectedBrgy) : liveProjects
  const brgyUsage = brgyData && brgyData.annualBudget > 0 ? Math.min(Math.round((brgyData.spent / brgyData.annualBudget) * 100), 100) : 0

  const totalBudget = summaryData.totalBudget
  const totalSpent = summaryData.totalSpent
  const utilizationPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const brgyTxn = brgyProj
  const projectCount = summaryData.totalProjects || liveProjects.length
  const projectStatusCounts = {
    ongoing: summaryData.ongoingProjects || liveProjects.filter(p => p.status === 'ongoing').length,
    upcoming: summaryData.upcomingProjects || liveProjects.filter(p => p.status === 'upcoming').length,
    completed: summaryData.completedProjects || liveProjects.filter(p => p.status === 'completed').length,
  }

  const STAT_CARDS = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      val: '18', lbl: 'Barangays Covered',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      val: totalBudget === 0 ? '₱0' : `₱${(totalBudget / 1_000_000).toFixed(1)}M`, lbl: 'Total SK Funds Released',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      val: `${projectCount}`, lbl: 'SK Projects Tracked',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      val: summaryData.skOfficialsCount === 0 ? '0' : summaryData.skOfficialsCount.toLocaleString(),
      lbl: 'SK Officials Serving',
    },
  ]

  const barData = summaryData.barangays.slice(0, 9).map((b: any) => ({
    label: String(b.barangay || '').length > 10 ? String(b.barangay).slice(0, 9) + '…' : String(b.barangay),
    value: Number(b.spent || 0), max: (totalBudget || 1) / 18,
  }))

  return (
    <div className="landing-container">

      {/* ── News Ticker ── */}
      <NewsTicker />

      {/* ── Header ── */}
      <header className="landing-header">
        {/* Desktop Navigation */}
        <nav className="landing-nav-left desktop-only">
          <Link to="/" className="landing-nav-link">HOME</Link>
          <Link to="/about" className="landing-nav-link">ABOUT</Link>
          <Link to="/sks" className="landing-nav-link">SK OFFICIALS</Link>
        </nav>
        <div className="landing-nav-right desktop-only">
          <Link to="/login" className="btn-landing-login btn-landing-login--home">LOGIN</Link>
          <Link to="/register" className="landing-signup-link landing-signup-link--home">SIGN UP</Link>
        </div>

        {/* Mobile Header Bar */}
        <div className="landing-header-mobile-bar mobile-only">
          <Link to="/" className="landing-mobile-brand">
            e<span className="maroon">SK</span>ala
          </Link>
          <div className="landing-mobile-bar-actions">
            <Link to="/login" className="btn-landing-login-mobile">LOGIN</Link>
            <Link to="/register" className="landing-signup-link-mobile">SIGN UP</Link>
            <button
              className="landing-menu-toggle"
              onClick={() => setNavOpen(!navOpen)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={navOpen}
            >
              {navOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu — nav links only */}
        <div className={`landing-mobile-dropdown mobile-only ${navOpen ? 'open' : ''}`}>
          <div className="landing-mobile-nav-links">
            <Link to="/" className="landing-mobile-nav-link" onClick={() => setNavOpen(false)}>HOME</Link>
            <Link to="/about" className="landing-mobile-nav-link" onClick={() => setNavOpen(false)}>ABOUT</Link>
            <Link to="/sks" className="landing-mobile-nav-link" onClick={() => setNavOpen(false)}>SK OFFICIALS</Link>
          </div>
        </div>
      </header>

      {/* ══ SECTION 1: HERO (City / Barangay Dynamic Mode) ══════════════════════ */}
      {!selectedBrgy ? (
        <main className="landing-main-grid">

          {/* LEFT — City Hero */}
          <div className="landing-hero-left">
            <Link to="/" className="landing-logos-strip" style={{ cursor: 'default', textDecoration: 'none' }}>
              <img src="/eSKalaLogo.svg" alt="eSKala SK Logo" className="landing-logo-img logo-sk"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <img src="/SantaRosa.svg" alt="Santa Rosa City Seal" className="landing-logo-img"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <img src="/CYDOlogo.svg" alt="CYDO Office Seal" className="landing-logo-img"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <img src="/bagongPilipinasLogo.svg" alt="Bagong Pilipinas Logo" className="landing-logo-img"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </Link>

            <h1 className="landing-brand-title">
              e<span className="maroon">SK</span>ala
            </h1>

            <p className="landing-hero-subtitle">
              Santa Rosa City's official Sangguniang Kabataan Financial Transparency Portal — making youth governance visible to every citizen.
            </p>

            {/* Stats row */}
            <div className="landing-stats-section">
              <p className="landing-stats-caption">As of 2026 · BSKE 2023–2026 Term:</p>
              <div className="landing-stats-row">
                <div className="landing-stat-item">
                  <span className="landing-stat-number">18</span>
                  <div className="landing-stat-label">Barangays<br />Covered</div>
                </div>
                <div className="landing-stat-item">
                  <span className="landing-stat-number">{totalBudget === 0 ? '₱0' : `₱${(totalBudget / 1_000_000).toFixed(1)}M`}</span>
                  <div className="landing-stat-label-small">
                    Total SK Funds<br />Released for Youth<br />Programs
                  </div>
                </div>
                <div className="landing-stat-item">
                  <span className="landing-stat-number">{projectCount}</span>
                  <div className="landing-stat-label-small">
                    Active &amp; Completed<br />SK Projects<br />Across the City
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <Link to="/login" className="btn-landing-login" style={{ padding: '0.8rem 2rem', fontSize: '0.9rem' }}>
                ACCESS PORTAL
              </Link>
            </div>
          </div>

          {/* RIGHT — Featured Card */}
          <div className="landing-kickoff-card">
            <img
              src="/kickoff-building.png"
              alt="Santa Rosa City Hall"
              className="landing-kickoff-image"
              onError={e => {
                const el = e.target as HTMLImageElement
                el.style.display = 'none'
                const placeholder = el.nextElementSibling as HTMLElement
                if (placeholder) placeholder.style.display = 'flex'
              }}
            />
            <div style={{
              display: 'none', width: '100%', height: '100%',
              background: 'linear-gradient(135deg, rgba(118,0,49,0.9) 0%, rgba(15,5,10,0.95) 100%)',
              alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0,
            }}>
              <div style={{ textAlign: 'center', color: '#fff', padding: '2rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3rem', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
                  e<span style={{ color: '#FEEC41' }}>SK</span>ala
                </div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', maxWidth: '28ch', lineHeight: 1.5 }}>
                  Official SK Transparency Portal<br />City of Santa Rosa, Laguna
                </div>
              </div>
            </div>

            <div className="landing-kickoff-overlay">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#FEEC41', marginBottom: '0.25rem', display: 'block' }}>
                OFFICIAL PORTAL LAUNCH
              </span>
              <h2 className="landing-kickoff-title">eSKala — SK Transparency Portal Goes Live</h2>
              <p className="landing-kickoff-text">
                The City of Santa Rosa, Laguna officially launches eSKala — giving all 18 barangay SK councils a unified platform for financial transparency, project tracking, and citizen engagement.
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                {[{ v: '18', l: 'Barangays' }, { v: '54+', l: 'SK Officials' }, { v: '284', l: 'Suggestions' }].map(s => (
                  <div key={s.l}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: '#fff', lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.15rem' }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="landing-kickoff-btn-row">
                <Link to="/about" className="btn-landing-readmore">READ MORE &rarr;</Link>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* BARANGAY DYNAMIC DASHBOARD MODE */
        <div style={{ margin: '2rem 0 3.5rem' }}>
          <div className="brgy-view-banner">
            <div>
              <div className="landing-section-label" style={{ color: 'var(--gold)' }}>Barangay Transparency Dashboard</div>
              <div className="brgy-view-name">Barangay {selectedBrgy}</div>
              <div className="brgy-view-sub">
                City of Santa Rosa, Laguna · BSKE 2023–2026 Term · {brgyProj.length} projects · ₱{(brgyData?.annualBudget ?? 0).toLocaleString()} budget
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn btn-gold btn-sm"
                onClick={() => setShowTxnModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Track Funds &amp; Receipts ({brgyTxn.length})
              </button>
              <button onClick={clearBrgy} className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}>
                View All Santa Rosa Data
              </button>
            </div>
          </div>

          {/* Barangay Stats Grid */}
          <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card card-accent">
              <div className="stat-value">{(brgyData?.annualBudget ?? 0) === 0 ? '₱0' : `₱${((brgyData?.annualBudget ?? 0) / 1_000_000).toFixed(2)}M`}</div>
              <div className="stat-label">Annual Allocation</div>
              <div className="stat-sub">FY 2026 SK Fund</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #b45309' }}>
              <div className="stat-value" style={{ color: '#b45309' }}>{(brgyData?.spent ?? 0) === 0 ? '₱0' : `₱${((brgyData?.spent ?? 0) / 1_000_000).toFixed(2)}M`}</div>
              <div className="stat-label">Disbursed</div>
              <div className="stat-sub">{brgyUsage}% utilization</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #166534' }}>
              <div className="stat-value" style={{ color: '#166534' }}>{(brgyData?.remaining ?? 0) === 0 ? '₱0' : `₱${((brgyData?.remaining ?? 0) / 1_000_000).toFixed(2)}M`}</div>
              <div className="stat-label">Remaining Balance</div>
              <div className="stat-sub">Available for programs</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{brgyProj.length}</div>
              <div className="stat-label">Active Projects</div>
              <div className="stat-sub">{brgyProj.filter(p => p.status === 'ongoing').length} ongoing</div>
            </div>
          </div>

          {/* Donut Chart & Project Status */}
          <div className="card-grid card-grid-2" style={{ marginBottom: '2rem' }}>
            <div className="chart-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <DonutChart value={brgyUsage} size={120} stroke={15} label={`${brgyUsage}%`} sublabel="used" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.5rem' }}>
                  Budget Utilization — Brgy. {selectedBrgy}
                </div>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
                    <span style={{ color: 'var(--muted)' }}>Annual Allocation:</span>
                    <strong style={{ color: 'var(--maroon)' }}>₱{(brgyData?.annualBudget ?? 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
                    <span style={{ color: 'var(--muted)' }}>Amount Disbursed:</span>
                    <strong style={{ color: '#b45309' }}>₱{(brgyData?.spent ?? 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
                    <span style={{ color: 'var(--muted)' }}>Remaining Balance:</span>
                    <strong style={{ color: '#166534' }}>₱{(brgyData?.remaining ?? 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.75rem' }}>
                Projects &amp; Transactions Quick View
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0.9rem', background: 'rgba(118,0,49,0.04)', border: '1px solid rgba(118,0,49,0.1)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.86rem' }}>Receipts &amp; Fund Audits</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{brgyTxn.length} receipt records available</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowTxnModal(true)}>
                    Track Funds →
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0.9rem', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(118,0,49,0.1)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.86rem' }}>SK Official Council</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Serving BSKE 2023–2026 Term</div>
                  </div>
                  <Link to="/sks" className="btn btn-secondary btn-sm">View Directory</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Barangay Projects Vertical Grid */}
          <div style={{ marginBottom: '1.2rem' }}>
            <div className="landing-section-label">Barangay Initiatives</div>
            <h2 className="landing-section-title">Projects in Barangay {selectedBrgy}</h2>
          </div>

          {brgyProj.length > 0 ? (
            <div className="card-grid card-grid-3">
              {brgyProj.map(p => (
                <div key={p.id} className="v-card" onClick={() => setSelectedProject(p)}>
                  <div className="v-card-img-wrap">
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

                  <div className="v-card-body">
                    <div className="v-card-kicker">{p.category}</div>
                    <div className="v-card-title">{p.title}</div>
                    <div className="v-card-date">{p.startDate} — {p.endDate}</div>
                    <p className="v-card-desc">{p.description}</p>

                    <div style={{ marginTop: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Budget Used</span>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)' }}>
                          {p.proposedBudget > 0 ? Math.round((p.spent / p.proposedBudget) * 100) : 0}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(100, p.proposedBudget > 0 ? (p.spent / p.proposedBudget) * 100 : 0)}%` }} />
                      </div>
                    </div>

                    <div className="v-card-footer">
                      <div>
                        <div className="v-card-budget">₱{(p.proposedBudget / 1000).toFixed(0)}K</div>
                        <div className="v-card-budget-label">Proposed Budget</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: '#b45309' }}>₱{(p.spent / 1000).toFixed(0)}K</div>
                        <div className="v-card-budget-label">Disbursed</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No projects found for Barangay {selectedBrgy}</div>
            </div>
          )}
        </div>
      )}

      {/* ══ SECTION 2: CITY STATS (Full-Bleed Edge-to-Edge) ════════════════════ */}
      <section id="stats-section" className="full-bleed-section landing-section-stats">
        <div className="full-bleed-inner">

          <div className="reveal">
            <div className="landing-section-label">City-Wide Overview</div>
            <div className="landing-section-title">Santa Rosa SK at a Glance</div>
            <div className="landing-section-sub">
              Consolidated financial and project data for all 18 barangays of Santa Rosa City, Laguna.
              Data reflects the 2023–2026 BSKE term under RA 10742 as amended by RA 11768.
            </div>
          </div>

          {/* Stat cards */}
          <div className="card-grid card-grid-4" style={{ marginBottom: '2.5rem' }}>
            {STAT_CARDS.map((s, i) => (
              <div key={i} className={`city-stat-card reveal reveal-delay-${i + 1}`}>
                <div className="city-stat-icon">{s.icon}</div>
                <div>
                  <div className="city-stat-val">{s.val}</div>
                  <div className="city-stat-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="card-grid card-grid-2 reveal">
            {/* Donut */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <div className="chart-card-title">City-Wide Fund Utilization</div>
                  <div className="chart-card-sub">Total SK budget vs. amount disbursed</div>
                </div>
              </div>
              <div className="donut-wrap">
                <DonutChart value={utilizationPct} size={130} stroke={16}
                  label={`${utilizationPct}%`} sublabel="used" />
                <div className="donut-legend">
                  {[
                    { dot: '#760031', label: 'Disbursed', val: totalSpent === 0 ? '₱0' : `₱${(totalSpent / 1_000_000).toFixed(1)}M` },
                    { dot: 'rgba(118,0,49,0.12)', label: 'Remaining', val: (totalBudget - totalSpent) === 0 ? '₱0' : `₱${((totalBudget - totalSpent) / 1_000_000).toFixed(1)}M` },
                    { dot: '#b45309', label: 'Utilization Rate', val: `${utilizationPct}%` },
                  ].map(item => (
                    <div key={item.label} className="donut-legend-item">
                      <div className="donut-legend-dot" style={{ background: item.dot }} />
                      <span>{item.label}: <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{item.val}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar chart — top 9 barangays */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <div className="chart-card-title">Budget Utilization by Barangay</div>
                  <div className="chart-card-sub">Amount spent vs. average allocation</div>
                </div>
              </div>
              <HBarChart data={barData} height={14} />
            </div>
          </div>

          {/* Project status row */}
          <div className="card-grid card-grid-3 reveal" style={{ marginTop: '1.5rem' }}>
            {[
              { label: 'Ongoing Projects', count: projectStatusCounts.ongoing, color: 'var(--maroon)', badge: 'badge-ongoing' },
              { label: 'Upcoming Projects', count: projectStatusCounts.upcoming, color: '#1d4ed8', badge: 'badge-upcoming' },
              { label: 'Completed Projects', count: projectStatusCounts.completed, color: '#166534', badge: 'badge-completed' },
            ].map((s, i) => (
              <div key={s.label} className={`city-stat-card reveal reveal-delay-${i + 1}`}>
                <div style={{ fontSize: '2.6rem', fontFamily: 'var(--font-display)', fontWeight: 900, color: s.color, lineHeight: 1, minWidth: '3rem' }}>{s.count}</div>
                <div>
                  <div className={`badge ${s.badge}`} style={{ marginBottom: '0.3rem' }}>{s.label}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>Across all 18 barangays</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══ SECTION 3: NEWS CAROUSEL (Dark Full-Bleed) ══════════════════════════ */}
      <section className="full-bleed-section landing-section-dark">
        <div className="full-bleed-inner">

          <div className="reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <div>
              <div className="landing-section-label">Latest Updates</div>
              <div className="landing-section-title" style={{ marginBottom: 0 }}>City News &amp; Announcements</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { pauseAuto(); prevNews(); resumeAuto() }}
                style={{ width: 36, height: 36, border: '1.5px solid rgba(118,0,49,0.25)', background: 'rgba(118,0,49,0.10)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#760031', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 150ms, border-color 150ms' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button onClick={() => { pauseAuto(); nextNews(); resumeAuto() }}
                style={{ width: 36, height: 36, border: '1.5px solid rgba(118,0,49,0.25)', background: 'rgba(118,0,49,0.10)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#760031', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 150ms, border-color 150ms' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>

          {newsList.length > 0 ? (
            <>
              <div
                className="news-carousel-outer"
                onMouseEnter={pauseAuto}
                onMouseLeave={resumeAuto}
              >
                <div
                  className="news-carousel-track"
                  style={{ transform: `translateX(calc(-${newsIdx * (320 + 20)}px))` }}
                >
                  {(newsList.length > 2 ? [...newsList, ...newsList] : newsList).map((item: any, i: number) => {
                    const imgSrc = item.image || item.imageURL || item.image_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&q=80'

                    return (
                      <div key={`${item.id}-${i}`} className="news-carousel-item">
                        <img
                          src={imgSrc}
                          alt={item.category}
                          className="news-carousel-item-img"
                          onError={e => {
                            const el = e.target as HTMLImageElement
                            el.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&q=80'
                          }}
                        />
                        <div className="news-carousel-item-body">
                          <span className="news-cat">{item.category}</span>
                          <div className="news-title" style={{ fontSize: '0.9rem' }}>{item.title}</div>
                          <span className="news-date">{item.date}</span>
                          <p className="news-summary" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{item.summary}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {newsList.length > 1 && (
                <div className="news-carousel-dots">
                  {newsList.map((_: any, i: number) => (
                    <button key={i} className={`news-carousel-dot${newsIdx % newsList.length === i ? ' active' : ''}`}
                      onClick={() => { pauseAuto(); setNewsIdx(i); resumeAuto() }} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#000' }}>
              No city news published yet.
            </div>
          )}

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-version">eSKala v1.0 · City of Santa Rosa, Laguna · CYDO</div>
        <div className="landing-footer-links">
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit', padding: 0, textDecoration: 'underline' }}
            onClick={() => setLegalModal('terms')}>Terms and Conditions</button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit', padding: 0, textDecoration: 'underline' }}
            onClick={() => setLegalModal('privacy')}>Privacy Policy</button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit', padding: 0, textDecoration: 'underline' }}
            onClick={() => setLegalModal('ra10742')}>RA 10742</button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit', padding: 0, textDecoration: 'underline' }}
            onClick={() => setLegalModal('disclosure')}>Full Disclosure</button>
        </div>
      </footer>

      {/* ── Legal Popups ── */}
      {legalModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setLegalModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '14px', padding: '2rem', maxWidth: '560px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--maroon)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>eSKala Legal</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.15rem', color: 'var(--ink)' }}>
                  {legalModal === 'terms' && 'Terms and Conditions'}
                  {legalModal === 'privacy' && 'Privacy Policy'}
                  {legalModal === 'ra10742' && 'RA 10742 — SK Reform Act of 2015'}
                  {legalModal === 'disclosure' && 'Full Disclosure Policy'}
                </div>
              </div>
              <button onClick={() => setLegalModal(null)}
                style={{ background: 'rgba(118,0,49,0.08)', border: 'none', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.75 }}>
              {legalModal === 'terms' && (
                <>
                  <p>By accessing and using the eSKala platform, you agree to comply with and be bound by the following terms and conditions of use.</p>
                  <p style={{ marginTop: '0.75rem' }}><strong>1. Platform Purpose.</strong> eSKala is the official Sangguniang Kabataan financial transparency portal of the City of Santa Rosa, Laguna. It is operated by the City Youth Development Office (CYDO) in compliance with RA 10742 (SK Reform Act of 2015) as amended by RA 11768.</p>
                  <p style={{ marginTop: '0.75rem' }}><strong>2. User Eligibility.</strong> Registration is strictly limited to residents of Santa Rosa City, Laguna. Providing false information during registration is grounds for account suspension.</p>
                  <p style={{ marginTop: '0.75rem' }}><strong>3. Acceptable Use.</strong> Users shall not post false, misleading, or offensive content. Comments and suggestions must be constructive and relevant to SK projects.</p>
                  <p style={{ marginTop: '0.75rem' }}><strong>4. Data Accuracy.</strong> Financial data displayed is sourced from official SK barangay records. Any discrepancies should be reported to CYDO.</p>
                  <p style={{ marginTop: '0.75rem' }}><strong>5. Governing Law.</strong> These terms are governed by the laws of the Republic of the Philippines, including RA 10742, RA 10173 (Data Privacy Act), and applicable DILG memoranda.</p>
                  <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>For questions: cydo@santarosacity.gov.ph · (049) 530-0015 local 5011</p>
                </>
              )}
              {legalModal === 'privacy' && (
                <>
                  <p>The City Government of Santa Rosa, Laguna, through CYDO, is committed to protecting your personal information in accordance with <strong>Republic Act No. 10173</strong> (Data Privacy Act of 2012).</p>
                  <p style={{ marginTop: '0.75rem' }}><strong>Information We Collect.</strong> Name, email address, barangay location, and username upon registration. Usage data such as project views, comments, and login timestamps.</p>
                  <p style={{ marginTop: '0.75rem' }}><strong>How We Use Your Data.</strong> To provide citizen services and account management. To track SK project engagement and community participation. To comply with DILG Full Disclosure and COA audit requirements.</p>
                  <p style={{ marginTop: '0.75rem' }}><strong>Data Sharing.</strong> Your data will not be sold or disclosed to third parties. It may be shared with DILG and COA for compliance audits as required by law.</p>
                  <p style={{ marginTop: '0.75rem' }}><strong>Your Rights.</strong> You have the right to access, correct, or request deletion of your personal data. Submit requests to CYDO.</p>
                  <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>Data Protection Officer: cydo@santarosacity.gov.ph</p>
                </>
              )}
              {legalModal === 'ra10742' && (
                <>
                  <p><strong>Republic Act No. 10742</strong> — Sangguniang Kabataan Reform Act of 2015 establishes the legal and operational framework for all SK units in the Philippines.</p>
                  <p style={{ marginTop: '0.75rem' }}><strong>Key Provisions Relevant to eSKala:</strong></p>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'grid', gap: '0.4rem' }}>
                    <li>Section 12 — Annual Barangay Youth Investment Program (ABYIP): Every SK unit must prepare an annual program detailing all planned youth activities and their corresponding budgets.</li>
                    <li>Section 17 — SK Fund Sources: SK funds come from the General Fund of the barangay (10% allocation) and other sources as provided by law.</li>
                    <li>Section 20 — Full Disclosure: All SK financial records must be publicly posted within 30 days of quarter end in compliance with DILG Memorandum Circulars.</li>
                    <li>RA 11768 Amendment: Enhanced digital reporting requirements and updated age qualification criteria for SK officers.</li>
                  </ul>
                  <p style={{ marginTop: '0.75rem' }}>eSKala operationalizes these mandates by providing a centralized, real-time digital transparency portal accessible to all Santa Rosa City residents.</p>
                </>
              )}
              {legalModal === 'disclosure' && (
                <>
                  <p>In compliance with the <strong>DILG Full Disclosure Policy</strong> and <strong>RA 10742 Section 20</strong>, the City of Santa Rosa SK units are required to disclose the following financial documents:</p>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'grid', gap: '0.4rem' }}>
                    <li>Annual Barangay Youth Investment Program (ABYIP) — within 30 days of approval</li>
                    <li>Quarterly Budget Reports — within 30 days of quarter end</li>
                    <li>Project Progress Reports — as each project milestone is reached</li>
                    <li>Purchase Orders and Disbursements — as processed</li>
                    <li>Audit Observation Memoranda (AOM) responses — within 60 days of COA issuance</li>
                  </ul>
                  <p style={{ marginTop: '0.75rem' }}>eSKala serves as the official digital disclosure platform for all 18 barangay SK units of Santa Rosa City, Laguna. All disclosures are binding public records.</p>
                  <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>CYDO Full Disclosure Desk: cydo@santarosacity.gov.ph</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Barangay Picker ── */}
      {pickerOpen && (
        <div className="brgy-picker-dropdown">
          <button className={`brgy-picker-dropdown-item${!selectedBrgy ? ' selected' : ''}`} onClick={clearBrgy}>
            All Barangays (City-Wide)
          </button>
          {BARANGAYS.map(b => (
            <button
              key={b}
              className={`brgy-picker-dropdown-item${selectedBrgy === b ? ' selected' : ''}`}
              onClick={() => handleSelectBrgy(b)}
            >
              {b}
            </button>
          ))}
        </div>
      )}

      <button
        className="brgy-picker-btn"
        onClick={() => setPickerOpen(v => !v)}
        title="Select a barangay to view its data"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
        {selectedBrgy ? `Brgy. ${selectedBrgy}` : 'Select Barangay'}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d={pickerOpen ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
        </svg>
      </button>

      {/* Modals */}
      {selectedProject && (
        <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      {showTxnModal && selectedBrgy && (
        <BarangayTransactionsModal barangay={selectedBrgy} onClose={() => setShowTxnModal(false)} />
      )}

    </div>
  )
}