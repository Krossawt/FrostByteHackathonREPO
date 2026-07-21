import { cityHighlights, news, projects, citizenComments } from '../data/mockData'
import type { UserAccount } from '../types'

interface CitizenHomeProps {
  user?: UserAccount | null
}

function CitizenHome({ user }: CitizenHomeProps) {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">Citizen dashboard</div>
        <p className="subtitle">Your view of barangay budget status, news, and ongoing youth projects in Santa Rosa City.</p>

        <div className="dashboard-grid dashboard-grid-3 section-surface" style={{ marginTop: '2rem' }}>
          {cityHighlights.map((stat) => (
            <div key={stat.label} className="card">
              <span>{stat.label}</span>
              <h3>{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="section-surface" style={{ marginTop: '2rem' }}>
          <h3>Recommended updates{user?.barangay ? ` for ${user.barangay}` : ''}</h3>
          <div className="news-list">
            {news.slice(0, 2).map((item) => (
              <div key={item.id} className="news-item">
                <small>{item.category}</small>
                <h4>{item.title}</h4>
                <p>{item.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-surface" style={{ marginTop: '2rem' }}>
          <h3>Citizen suggestions and comments</h3>
          <div className="news-list">
            {citizenComments.map((comment) => (
              <div key={comment.id} className="news-item">
                <small>{comment.barangay} • {comment.date}</small>
                <h4>{comment.author}</h4>
                <p>{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CitizenHome
