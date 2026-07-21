import { barangaySummary, news, projects, citizenComments } from '../data/mockData'
import type { UserAccount } from '../types'

interface CitizenHomeProps {
  user?: UserAccount | null
}

function CitizenHome({ user }: CitizenHomeProps) {
  const barangay = user?.barangay || 'Your barangay'
  const summary = barangaySummary.find((item) => item.barangay === barangay)
  const localProjects = projects.filter((project) => project.barangay === barangay)
  const localComments = citizenComments.filter((comment) => comment.barangay === barangay)

  return (
    <section className="section">
      <div className="container">
        <div className="page-intro">
          <p className="hero-kicker">Citizen portal</p>
          <h1 className="section-title">A transparent view of your barangay’s current SK work and public progress.</h1>
          <p className="subtitle">The citizen view highlights the local budget, active projects, and ongoing community feedback tied directly to the barangay selected during registration.</p>
        </div>

        <div className="section-surface" style={{ marginTop: '0.5rem' }}>
          <div className="panel-header">
            <div>
              <h3>{barangay} snapshot</h3>
              <p>Current local indicators and public reporting details.</p>
            </div>
            <span className="status-pill">Barangay-specific</span>
          </div>
          <div className="dashboard-grid dashboard-grid-3">
            <div className="card">
              <strong>Annual budget</strong>
              <h3>₱{summary ? summary.annualBudget.toLocaleString() : '0'}</h3>
            </div>
            <div className="card">
              <strong>Amount spent</strong>
              <h3>₱{summary ? summary.spent.toLocaleString() : '0'}</h3>
            </div>
            <div className="card">
              <strong>Active projects</strong>
              <h3>{summary ? summary.projects : 0}</h3>
            </div>
          </div>
        </div>

        <div className="section-grid" style={{ marginTop: '1.5rem' }}>
          <div className="section-surface">
            <div className="panel-header">
              <div>
                <h3>Local projects and updates</h3>
                <p>Project milestones and public progress for {barangay}.</p>
              </div>
              <span className="status-pill">Live feed</span>
            </div>
            <div className="news-list">
              {localProjects.length ? localProjects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="inline-row" style={{ justifyContent: 'space-between' }}>
                    <span className="small-pill">{project.status}</span>
                    <span>{project.progress}% complete</span>
                  </div>
                  <h4>{project.title}</h4>
                  <p>{project.description}</p>
                </div>
              )) : <div className="news-item"><p>No local projects are listed for this barangay yet.</p></div>}
            </div>
          </div>

          <div className="section-surface">
            <div className="panel-header">
              <div>
                <h3>Citizen comments and suggestions</h3>
                <p>Resident feedback tied to your barangay.</p>
              </div>
              <span className="status-pill">Community</span>
            </div>
            <div className="news-list">
              {localComments.length ? localComments.map((comment) => (
                <div key={comment.id} className="news-item">
                  <small>{comment.date}</small>
                  <h4>{comment.author}</h4>
                  <p>{comment.text}</p>
                </div>
              )) : <div className="news-item"><p>No comments have been posted for this barangay yet.</p></div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CitizenHome
