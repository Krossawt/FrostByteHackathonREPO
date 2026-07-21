import { Link } from 'react-router-dom'
import { cityHighlights, news, projects, skOfficials } from '../data/mockData'

function Landing() {
  return (
    <section className="section hero-section">
      <div className="container">
        <div className="logo-strip">
          <span className="logo-pill">SK</span>
          <span className="logo-pill">Santa Rosa</span>
          <span className="logo-pill">Youth Dev Office</span>
          <span className="logo-pill">Bagong Pilipinas</span>
        </div>

        <div className="hero-banner hero-grid">
          <div className="hero-copy-panel">
            <div className="hero-kicker">Official public portal for Santa Rosa City</div>
            <h1 className="hero-title">eSKala</h1>
            <p className="hero-subline">Santa Rosa’s first Sanggunian Kabataan (SK) financial transparency report website for barangay accountability.</p>

            <div className="hero-stat-grid">
              <div className="hero-stat">
                <span className="hero-stat-value">18</span>
                <span className="hero-stat-label">Barangays joined</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">2.3M</span>
                <span className="hero-stat-label">Pesos allocated for SK projects</span>
              </div>
            </div>

            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-pill">Login</Link>
              <Link to="/register" className="btn btn-secondary btn-pill">Sign up</Link>
            </div>
          </div>

          <div className="hero-image-card">
            <div className="hero-image-top" />
            <div className="hero-image-body">
              <p className="hero-card-label">eSKala Official Kickoff</p>
              <h2 className="hero-card-title">Every good initiative begins with clarity.</h2>
              <p className="hero-card-copy">A single portal for SK reports, project updates, and barangay financial status in Santa Rosa City.</p>
              <Link to="/about" className="btn btn-text">Read more →</Link>
            </div>
          </div>
        </div>

        <div className="section-grid" style={{ marginTop: '2rem' }}>
          <div className="section-surface">
            <h3>Citywide transparency, simplified</h3>
            <p className="subtitle">The portal is built for public visibility across barangay SK projects, spending, and community engagement.</p>
            <div className="news-list" style={{ marginTop: '1.5rem' }}>
              {news.slice(0, 2).map((item) => (
                <div key={item.id} className="news-item compact">
                  <small>{item.date}</small>
                  <h4>{item.title}</h4>
                  <p>{item.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-surface">
            <h3>Featured barangay initiatives</h3>
            <div className="news-list" style={{ marginTop: '1.5rem' }}>
              {projects.filter((project) => project.status !== 'completed').slice(0, 3).map((project) => (
                <div key={project.id} className="project-card compact">
                  <div className="inline-row" style={{ justifyContent: 'space-between' }}>
                    <span className="small-pill">{project.status}</span>
                    <span>{project.barangay}</span>
                  </div>
                  <h4>{project.title}</h4>
                  <p>{project.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Landing
