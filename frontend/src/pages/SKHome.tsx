import { cityHighlights, projects, citizenComments } from '../data/mockData'
import type { UserAccount } from '../types'

interface SKHomeProps {
  user?: UserAccount | null
}

function SKHome({ user }: SKHomeProps) {
  const barangay = user?.barangay || 'Your barangay'
  const filtered = projects.filter((project) => project.barangay === barangay)

  return (
    <section className="section">
      <div className="container">
        <div className="section-title">SK Officer dashboard</div>
        <p className="subtitle">Manage barangay projects, review data interpretations, and monitor citizen feedback.</p>

        <div className="dashboard-grid dashboard-grid-3 section-surface" style={{ marginTop: '2rem' }}>
          {cityHighlights.slice(0, 3).map((stat) => (
            <div key={stat.label} className="card">
              <span>{stat.label}</span>
              <h3>{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="section-surface" style={{ marginTop: '2rem' }}>
          <h3>{barangay} projects overview</h3>
          <div className="news-list">
            {filtered.map((project) => (
              <div key={project.id} className="project-card">
                <div className="inline-row" style={{ justifyContent: 'space-between' }}>
                  <span className="small-pill">{project.status}</span>
                  <span>{project.progress}% complete</span>
                </div>
                <h4>{project.title}</h4>
                <p>{project.description}</p>
                <p><strong>Budget:</strong> ₱{project.proposedBudget.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-surface" style={{ marginTop: '2rem' }}>
          <h3>Citizen comments relevant to {barangay}</h3>
          <div className="news-list">
            {citizenComments.filter((comment) => comment.barangay === barangay).length ? (
              citizenComments
                .filter((comment) => comment.barangay === barangay)
                .map((comment) => (
                  <div key={comment.id} className="news-item">
                    <small>{comment.date}</small>
                    <h4>{comment.author}</h4>
                    <p>{comment.text}</p>
                  </div>
                ))
            ) : (
              <div className="news-item">
                <p>No citizen comments yet for this barangay.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SKHome
