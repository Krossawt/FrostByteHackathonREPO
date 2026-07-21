import { activityLogs } from '../data/mockData'

function SuperAdminActivity() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">Activity logs</div>
        <p className="subtitle">Read-only tracker of changes made by SK officials in the system.</p>

        <div className="section-surface" style={{ marginTop: '2rem' }}>
          <div className="news-list">
            {activityLogs.map((event) => (
              <div key={event.id} className="news-item">
                <small>{event.when}</small>
                <h4>{event.user}</h4>
                <p>{event.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SuperAdminActivity
