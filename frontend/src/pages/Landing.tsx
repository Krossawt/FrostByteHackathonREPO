import { Link } from 'react-router-dom'
import { cityHighlights, news, projects, skOfficials } from '../data/mockData'

function Landing() {
  return (
    <section className="section">
      <div className="container">
        <div className="hero-banner">
          <div className="hero-grid">
            <div className="hero-panel">
              <div className="hero-kicker">Official public portal for Santa Rosa City</div>
              <h1 className="hero-title">A professional, transparent view of SK projects, budgets, and civic participation.</h1>
              <p className="hero-copy">
                eSKala consolidates barangay reports, funding updates, and citizen feedback into one credible platform designed for public trust.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary" to="/login">Access the portal</Link>
                <Link className="btn btn-secondary" to="/register">Create citizen account</Link>
              </div>
              <div className="pill-list">
                <span className="badge">Budget transparency</span>
                <span className="badge">Project tracking</span>
                <span className="badge">Citizen engagement</span>
              </div>
            </div>

            <div className="hero-panel">
              <div className="hero-card">
                <strong>Citywide summary</strong>
                <div className="hero-highlight">
                  {cityHighlights.map((item) => (
                    <div key={item.label} className="metric-card">
                      <p>{item.label}</p>
                      <h3>{item.value}</h3>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hero-card">
                <strong>Active barangay SK leaders</strong>
                <div className="news-list">
                  {skOfficials.slice(0, 3).map((official) => (
                    <div key={official.id} className="news-item">
                      <small>{official.barangay}</small>
                      <h4>{official.name}</h4>
                      <p>{official.position}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section-grid" style={{ marginTop: '2rem' }}>
          <div className="section-surface">
            <h3>Current citywide projects</h3>
            <div className="news-list">
              {projects.filter((project) => project.status !== 'completed').slice(0, 3).map((project) => (
                <div key={project.id} className="project-card">
                  <div className="inline-row">
                    <span className="small-pill">{project.status}</span>
                    <span>{project.barangay}</span>
                  </div>
                  <h4>{project.title}</h4>
                  <p>{project.description}</p>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-surface">
            <h3>Latest official updates</h3>
            <div className="news-list">
              {news.slice(0, 3).map((item) => (
                <div key={item.id} className="news-item">
                  <small>{item.date}</small>
                  <h4>{item.title}</h4>
                  <p>{item.summary}</p>
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
