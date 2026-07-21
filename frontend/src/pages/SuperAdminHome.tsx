import { projects, news } from '../data/mockData'

function SuperAdminHome() {
  return (
    <section className="section">
      <div className="container">
        <div className="page-intro">
          <p className="hero-kicker">Super admin operations</p>
          <h1 className="section-title">Citywide oversight for projects, accounts, and public announcements.</h1>
          <p className="subtitle">This workspace is structured to support municipal-level governance and a broader rollout of official SK administration.</p>
        </div>

        <div className="section-grid">
          <div className="section-surface">
            <div className="panel-header">
              <div>
                <h3>Current and upcoming SK projects</h3>
                <p>Priority initiatives across the city in a consolidated management view.</p>
              </div>
              <span className="status-pill">Program control</span>
            </div>
            <div className="news-list">
              {projects.filter((project) => project.status !== 'completed').map((project) => (
                <div key={project.id} className="project-card">
                  <div className="inline-row" style={{ justifyContent: 'space-between' }}>
                    <span className="small-pill">{project.status}</span>
                    <span>{project.barangay}</span>
                  </div>
                  <h4>{project.title}</h4>
                  <p>Progress: {project.progress}% complete</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-surface">
            <div className="panel-header">
              <div>
                <h3>Latest public announcements</h3>
                <p>Editorial content prepared for public release.</p>
              </div>
              <span className="status-pill">Editorial</span>
            </div>
            <div className="news-list">
              {news.map((item) => (
                <div key={item.id} className="news-item">
                  <small>{item.category}</small>
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

export default SuperAdminHome
