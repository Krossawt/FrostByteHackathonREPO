import { Link } from 'react-router-dom'
import { news, cityHighlights } from '../data/mockData'

const TICKER_ITEMS = [
  'SK Q1 2025 Financial Transparency Report — Now Published for All 18 Barangays',
  'eSKala Citizen Suggestion Portal Now Active',
  'SK Federation President joins City Council Education Committee',
  'CYDO Youth Leadership Summit 2025 — 400 Participants',
  'RA 11768 Amendment: Enhanced SK Fund Guidelines Effective July 2025',
  'Santa Rosa Named Top Youth-Friendly City in Region IV-A',
]

export default function Landing() {
  return (
    <div className="landing-container">

      {/* ── News Ticker ── */}
      <div className="news-ticker">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-sep">◆</span>&nbsp;{item}&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── Header ── */}
      <header className="landing-header">
        <nav className="landing-nav-left">
          <Link to="/" className="landing-nav-link">HOME</Link>
          <Link to="/home" className="landing-nav-link">CITY OVERVIEW</Link>
          <Link to="/about" className="landing-nav-link">ABOUT</Link>
          <Link to="/sks" className="landing-nav-link">SKs</Link>
        </nav>
        <div className="landing-nav-right">
          <Link to="/login" className="btn-landing-login">LOGIN</Link>
          <Link to="/register" className="landing-signup-link">SIGN UP</Link>
        </div>
      </header>

      {/* ── Main Grid ── */}
      <main className="landing-main-grid">

        {/* LEFT — Hero */}
        <div className="landing-hero-left">

          {/* Logo strip */}
          <div className="landing-logos-strip">
            <img src="/eSKalaLogo.svg" alt="eSKala SK Logo" className="landing-logo-img logo-sk"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <img src="/SantaRosa.svg" alt="Santa Rosa City Seal" className="landing-logo-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <img src="/CYDOlogo.svg" alt="CYDO Office Seal" className="landing-logo-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <img src="/bagongPilipinasLogo.svg" alt="Bagong Pilipinas Logo" className="landing-logo-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>

          {/* Brand title */}
          <h1 className="landing-brand-title">
            e<span className="maroon">SK</span>ala
          </h1>

          {/* Subtitle */}
          <p className="landing-hero-subtitle">
            Santa Rosa City's official Sangguniang Kabataan Financial Transparency Portal — making youth governance visible to every citizen.
          </p>

          {/* Stats */}
          <div className="landing-stats-section">
            <p className="landing-stats-caption">As of 2025 · BSKE 2023–2025 Term:</p>
            <div className="landing-stats-row">
              <div className="landing-stat-item">
                <span className="landing-stat-number">18</span>
                <div className="landing-stat-label">Barangays<br />Covered</div>
              </div>
              <div className="landing-stat-item">
                <span className="landing-stat-number">₱39M</span>
                <div className="landing-stat-label-small">
                  Total SK Funds<br />
                  Released for Youth<br />
                  Programs
                </div>
              </div>
              <div className="landing-stat-item">
                <span className="landing-stat-number">141</span>
                <div className="landing-stat-label-small">
                  Active &amp; Completed<br />
                  SK Projects<br />
                  Across the City
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <Link to="/login" className="btn-landing-login" style={{ padding: '0.8rem 2rem', fontSize: '0.9rem' }}>
              ACCESS PORTAL
            </Link>
            <Link to="/home" className="landing-signup-link" style={{ display: 'flex', alignItems: 'center' }}>
              CITY OVERVIEW →
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
          {/* Fallback if image not found */}
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
              🏛 OFFICIAL LAUNCH
            </span>
            <h2 className="landing-kickoff-title">eSKala — SK Transparency Portal Goes Live</h2>
            <p className="landing-kickoff-text">
              The City of Santa Rosa, Laguna officially launches the eSKala portal — giving all 18 barangay SK councils a unified platform for financial transparency, project tracking, and citizen engagement.
            </p>

            {/* Mini stats inside card */}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
              {[
                { v: '18', l: 'Barangays' },
                { v: '54+', l: 'SK Officials' },
                { v: '284', l: 'Suggestions' },
              ].map(s => (
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

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-version">eSKala v1.0 · City of Santa Rosa, Laguna · CYDO</div>
        <div className="landing-footer-links">
          <Link to="/about">Terms and Conditions</Link>
          <Link to="/about">Privacy Policy</Link>
          <a href="#">RA 10742</a>
          <a href="#">Full Disclosure</a>
        </div>
      </footer>

    </div>
  )
}
