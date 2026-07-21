import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="landing-container">
      {/* Top Header */}
      <header className="landing-header">
        <nav className="landing-nav-left">
          <Link to="/" className="landing-nav-link">HOME</Link>
          <Link to="/about" className="landing-nav-link">ABOUT</Link>
        </nav>

        <div className="landing-nav-right">
          <Link to="/login" className="btn-landing-login">LOGIN</Link>
          <Link to="/register" className="landing-signup-link">SIGN UP</Link>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="landing-main-grid">
        {/* Left Column */}
        <div className="landing-hero-left">
          {/* Logo Strip using SVG files from public folder */}
          <div className="landing-logos-strip">
            <img src="/eSKalaLogo.svg" alt="eSKala SK Logo" className="landing-logo-img logo-sk" />
            <img src="/SantaRosa.svg" alt="Santa Rosa City Seal" className="landing-logo-img logo-santarosa" />
            <img src="/CYDOlogo.svg" alt="CYDO Office Seal" className="landing-logo-img logo-cydo" />
            <img src="/bagongPilipinasLogo.svg" alt="Bagong Pilipinas Logo" className="landing-logo-img logo-bagongpilipinas" />
          </div>

          {/* Title */}
          <h1 className="landing-brand-title">
            e<span className="maroon">SK</span>ala
          </h1>

          {/* Subtitle */}
          <p className="landing-hero-subtitle">
            Santa Rosa’s first Sanguniang Kabataan (SK) Financial Transparency Report Website
          </p>

          {/* Statistics */}
          <div className="landing-stats-section">
            <p className="landing-stats-caption">As of 2026:</p>

            <div className="landing-stats-row">
              {/* Stat 1 */}
              <div className="landing-stat-item">
                <span className="landing-stat-number">18</span>
                <div className="landing-stat-label">
                  Barangays<br />Joined
                </div>
              </div>

              {/* Stat 2 */}
              <div className="landing-stat-item">
                <span className="landing-stat-number">2.3M</span>
                <div className="landing-stat-label-small">
                  Pesos allocated<br />
                  funds for SK<br />
                  projects
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Kickoff Card) */}
        <div className="landing-kickoff-card">
          <img
            src="/kickoff-building.png"
            alt="Santa Rosa SK Kickoff Building"
            className="landing-kickoff-image"
          />

          <div className="landing-kickoff-overlay">
            <h2 className="landing-kickoff-title">eSKala Official Kickoff</h2>
            <p className="landing-kickoff-text">
              Every good boy does fine Every good boy does fineEvery good boy does fineEvery good boy does fineEvery good boy does fine....
            </p>

            <div className="landing-kickoff-btn-row">
              <Link to="/about" className="btn-landing-readmore">
                READ MORE &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-version">eSKala v 1.0</div>
        <div className="landing-footer-links">
          <Link to="/about">Terms and Conditions</Link>
          <Link to="/about">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  )
}

export default Landing
