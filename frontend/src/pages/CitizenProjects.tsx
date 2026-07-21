import { projects } from '../data/mockData'

function CitizenProjects() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">Barangay projects</div>
        <p className="subtitle">All current SK projects across Santa Rosa City barangays.</p>

        <div className="section-surface" style={{ marginTop: '2rem' }}>
          <div className="grid grid-2" style={{ gap: '1.5rem' }}>
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="inline-row" style={{ justifyContent: 'space-between' }}>
                  <span className="small-pill">{project.status}</span>
                  <span>{project.barangay}</span>
                </div>
                <h4>{project.title}</h4>
                <p>{project.description}</p>
                <div className="inline-row" style={{ justifyContent: 'space-between', marginTop: '1rem' }}>
                  <small>{project.startDate} — {project.endDate}</small>
                  <strong>₱{project.proposedBudget.toLocaleString()}</strong>
                </div>
                <div className="progress-track" style={{ marginTop: '1rem' }}>
                  <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CitizenProjects
