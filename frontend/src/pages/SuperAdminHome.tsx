import { projects, news } from '../data/mockData'

function SuperAdminHome() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">Super admin dashboard</div>
        <p className="subtitle">Review citywide SK project progress and publish official news for the portal.</p>

        <div className="grid grid-2" style={{ gap: '1.5rem', marginTop: '2rem' }}>
          <div className="section-surface">
            <h3>Current & upcoming projects</h3>
            <div className="news-list">
              {projects.filter((project) => project.status !== 'completed').map((project) => (
                <div key={project.id} className="project-card">
                  <div className="inline-row" style={{ justifyContent: 'space-between' }}>
                    <span className="small-pill">{project.status}</span>
                    <span>{project.barangay}</span>
                  </div>
                  <h4>{project.title}</h4>
                  <small>Progress: {project.progress}%</small>
                </div>
              ))}
            </div>
          </div>

          <div className="section-surface">
            <h3>Latest news</h3>
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
