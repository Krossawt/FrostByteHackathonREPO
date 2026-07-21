import { barangaySummary, projects, citizenComments } from '../data/mockData'
import type { UserAccount } from '../types'

interface SKHomeProps {
  user?: UserAccount | null
}

function SKHome({ user }: SKHomeProps) {
  const barangay = user?.barangay || 'Your barangay'
  const filtered = projects.filter((project) => project.barangay === barangay)
  const summary = barangaySummary.find((item) => item.barangay === barangay)
  const localComments = citizenComments.filter((comment) => comment.barangay === barangay)

  return (
    <section className="section">
      <div className="container">
        <div className="page-intro">
          <p className="hero-kicker">SK operations dashboard</p>
          <h1 className="section-title">A compact control center for barangay projects and citizen feedback.</h1>
          <p className="subtitle">This view is structured for financial reporting, project oversight, and response handling in a formal municipal workflow.</p>
        </div>

        <div className="section-surface" style={{ marginTop: '0.5rem' }}>
          <div className="panel-header">
            <div>
              <h3>{barangay} financial and program overview</h3>
              <p>Operational indicators tied directly to the barangay selected for this account.</p>
            </div>
            <span className="status-pill">Barangay-specific</span>
          </div>
          <div className="dashboard-grid dashboard-grid-3">
            <div className="card">
              <strong>Annual budget</strong>
              <h3>₱{summary ? summary.annualBudget.toLocaleString() : '0'}</h3>
            </div>
            <div className="card">
              <strong>Funds spent</strong>
              <h3>₱{summary ? summary.spent.toLocaleString() : '0'}</h3>
            </div>
            <div className="card">
              <strong>Registered projects</strong>
              <h3>{summary ? summary.projects : 0}</h3>
            </div>
          </div>
        </div>

        <div className="section-grid" style={{ marginTop: '1.5rem' }}>
          <div className="section-surface">
            <div className="panel-header">
              <div>
                <h3>{barangay} project overview</h3>
                <p>Current and upcoming proposals tracked in a public-ready format.</p>
              </div>
              <span className="status-pill">Project oversight</span>
            </div>
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

          <div className="section-surface">
            <div className="panel-header">
              <div>
                <h3>Citizen feedback relevant to {barangay}</h3>
                <p>Comments and suggestions captured for follow-up.</p>
              </div>
              <span className="status-pill">Public input</span>
            </div>
            <div className="news-list">
              {localComments.length ? localComments.map((comment) => (
                <div key={comment.id} className="news-item">
                  <small>{comment.date}</small>
                  <h4>{comment.author}</h4>
                  <p>{comment.text}</p>
                </div>
              )) : <div className="news-item"><p>No citizen comments yet for this barangay.</p></div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SKHome
