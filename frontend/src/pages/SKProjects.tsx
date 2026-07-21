import { projects } from '../data/mockData'

function SKProjects() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">Projects management</div>
        <p className="subtitle">Manage and update project progress using the annual proposal-based workflow.</p>

        <div className="section-surface" style={{ marginTop: '2rem' }}>
          <div className="news-list">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="inline-row" style={{ justifyContent: 'space-between' }}>
                  <span className="small-pill">{project.status}</span>
                  <span>{project.barangay}</span>
                </div>
                <h4>{project.title}</h4>
                <p>{project.description}</p>
                <div className="inline-row" style={{ justifyContent: 'space-between' }}>
                  <small>Proposed: ₱{project.proposedBudget.toLocaleString()}</small>
                  <small>Spent: ₱{project.spent.toLocaleString()}</small>
                </div>
                <div className="progress-track" style={{ marginTop: '1rem' }}>
                  <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                </div>
                <p style={{ marginTop: '0.85rem' }}>
                  Attach receipts for project funding transparency. Receipt upload and OCR support will be connected in the backend.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SKProjects
